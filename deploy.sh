#!/bin/bash

# Improved deployment script for entreestudiantes
# Exit on error, undefined variables, and pipe failures
set -euo pipefail

# Configuration
APP_NAME="entreestudiantes"
MAINTENANCE_APP="${APP_NAME}-maintenance"
APP_DIR="/var/www/entreestudiantes/data/www/entreestudiantes.cl"
BACKUP_DIR="${APP_DIR}/backup"
LOG_FILE="${APP_DIR}/deploy.log"
MAX_RETRIES=3
HEALTH_CHECK_TIMEOUT=30

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${timestamp} [${level}] ${message}" | tee -a "${LOG_FILE}"
}

log_info() { log "INFO" "${BLUE}$*${NC}"; }
log_warn() { log "WARN" "${YELLOW}$*${NC}"; }
log_error() { log "ERROR" "${RED}$*${NC}"; }
log_success() { log "SUCCESS" "${GREEN}$*${NC}"; }

# Error handler
error_handler() {
    local line_number=$1
    log_error "Script failed at line ${line_number}. Attempting rollback..."
    rollback
    exit 1
}

# Set up error trap
trap 'error_handler ${LINENO}' ERR

# Rollback function
rollback() {
    log_warn "Starting rollback procedure..."
    
    # Stop maintenance page if running
    if pm2 describe "${MAINTENANCE_APP}" > /dev/null 2>&1; then
        log_info "Stopping maintenance page..."
        pm2 stop "${MAINTENANCE_APP}" || true
    fi
    
    # Start main app if not running
    if ! pm2 describe "${APP_NAME}" > /dev/null 2>&1 || [ "$(pm2 jlist | jq -r ".[] | select(.name==\"${APP_NAME}\") | .pm2_env.status")" != "online" ]; then
        log_info "Starting main app..."
        pm2 start "${APP_NAME}" || log_error "Failed to start main app during rollback"
    fi
    
    log_warn "Rollback completed"
}

# Health check function
health_check() {
    local app_name=$1
    local timeout=${2:-$HEALTH_CHECK_TIMEOUT}
    
    log_info "Performing health check for ${app_name}..."
    
    for i in $(seq 1 $timeout); do
        if pm2 describe "${app_name}" > /dev/null 2>&1; then
            local status=$(pm2 jlist | jq -r ".[] | select(.name==\"${app_name}\") | .pm2_env.status")
            if [ "$status" = "online" ]; then
                log_success "Health check passed for ${app_name}"
                return 0
            fi
        fi
        sleep 1
    done
    
    log_error "Health check failed for ${app_name} after ${timeout} seconds"
    return 1
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if required commands exist
    for cmd in pm2 git npm npx mysqldump jq; do
        if ! command -v "$cmd" &> /dev/null; then
            log_error "Required command '$cmd' not found"
            exit 1
        fi
    done
    
    # Check if app directory exists
    if [ ! -d "$APP_DIR" ]; then
        log_error "App directory $APP_DIR does not exist"
        exit 1
    fi
    
    # Create backup directory if it doesn't exist
    mkdir -p "$BACKUP_DIR"
    
    # Check if PM2 apps are configured
    if ! pm2 describe "${APP_NAME}" > /dev/null 2>&1; then
        log_error "PM2 app '${APP_NAME}' not found"
        exit 1
    fi
    
    if ! pm2 describe "${MAINTENANCE_APP}" > /dev/null 2>&1; then
        log_error "PM2 maintenance app '${MAINTENANCE_APP}' not found"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Backup database with retry logic
backup_database() {
    log_info "Backing up MySQL database..."
    
    local backup_file="${BACKUP_DIR}/${APP_NAME}_backup_$(date +%Y%m%d%H%M%S).sql"
    local retry_count=0
    
    while [ $retry_count -lt $MAX_RETRIES ]; do
        if mysqldump -u root -p --single-transaction --routines --triggers "${APP_NAME}" > "$backup_file" 2>/dev/null; then
            log_success "Database backup created: $backup_file"
            
            # Verify backup file is not empty
            if [ -s "$backup_file" ]; then
                log_success "Backup verification passed"
                return 0
            else
                log_error "Backup file is empty"
                rm -f "$backup_file"
            fi
        fi
        
        retry_count=$((retry_count + 1))
        log_warn "Database backup attempt $retry_count failed. Retrying..."
        sleep 2
    done
    
    log_error "Database backup failed after $MAX_RETRIES attempts"
    return 1
}

# Clean old backups (keep last 10)
cleanup_old_backups() {
    log_info "Cleaning up old backups..."
    find "$BACKUP_DIR" -name "${APP_NAME}_backup_*.sql" -type f | sort -r | tail -n +11 | xargs -r rm -f
    log_success "Old backups cleaned up"
}

# Main deployment function
main() {
    log_info "Starting deployment of ${APP_NAME}..."
    
    # Step 1: Check prerequisites
    check_prerequisites
    
    # Step 2: Stop current PM2 app
    log_info "Stopping main app..."
    pm2 stop "${APP_NAME}"
    
    # Step 3: Start maintenance page
    log_info "Starting maintenance page..."
    pm2 start "${MAINTENANCE_APP}"
    health_check "${MAINTENANCE_APP}" 10
    
    # Step 4: Change to app directory
    log_info "Changing to app directory: $APP_DIR"
    cd "$APP_DIR"
    
    # Step 5: Check Git status
    log_info "Checking Git status..."
    if [ -n "$(git status --porcelain)" ]; then
        log_warn "Working directory has uncommitted changes"
        git status --short
    fi
    
    # Step 6: Pull latest changes from Git
    log_info "Pulling latest changes from main..."
    git fetch origin
    local current_commit=$(git rev-parse HEAD)
    git pull origin main
    local new_commit=$(git rev-parse HEAD)
    
    if [ "$current_commit" = "$new_commit" ]; then
        log_info "No new changes to deploy"
    else
        log_info "Updated from $current_commit to $new_commit"
    fi
    
    # Step 7: Install dependencies and build
    log_info "Installing dependencies..."
    npm ci --production=false
    
    log_info "Building application..."
    npm run build
    
    # Step 8: Backup database
    backup_database
    
    # Step 9: Push schema to Prisma
    log_info "Pushing Prisma schema to database..."
    npx prisma db push --accept-data-loss
    
    # Step 10: Stop maintenance page
    log_info "Stopping maintenance page..."
    pm2 stop "${MAINTENANCE_APP}"
    
    # Step 11: Start main app
    log_info "Starting main app..."
    pm2 start "${APP_NAME}"
    
    # Step 12: Health check
    health_check "${APP_NAME}"
    
    # Step 13: Cleanup
    cleanup_old_backups
    
    log_success "✅ Deployment completed successfully!"
    log_info "Application is now running and healthy"
}

# Run main function
main "$@"