# Plan Purchasing Control

This document explains how to enable and disable plan purchasing functionality without rebuilding the application.

## Overview

The plan purchasing control feature allows administrators to dynamically enable or disable the ability for users to purchase new subscription plans. This is useful for:

- **Maintenance periods**: Temporarily disable purchases during system maintenance
- **Payment processor issues**: Quickly disable purchases if there are problems with Flow.cl
- **Emergency situations**: Immediately stop new subscriptions if needed
- **Testing**: Safely test the application with purchases disabled

## Important Notes

- **Existing subscriptions continue to work normally** when purchasing is disabled
- Users with active subscriptions retain their benefits
- Only **new purchases** are affected
- Changes take effect **immediately** without requiring an app restart

## Methods to Control Plan Purchasing

### Method 1: CLI Script (Recommended)

Use the provided CLI script for quick toggling:

#### Check Current Status
```bash
node scripts/toggle-plan-purchasing.js status
```

#### Enable Plan Purchasing
```bash
node scripts/toggle-plan-purchasing.js enable
```

#### Disable Plan Purchasing
```bash
node scripts/toggle-plan-purchasing.js disable
```

### Method 2: Admin API

Use the admin API endpoints with proper authentication:

#### Check All Configurations
```bash
curl -X GET "https://yourdomain.com/api/admin/config" \
  -H "Authorization: Bearer YOUR_ADMIN_API_KEY"
```

#### Toggle Plan Purchasing via API
```bash
# Disable plan purchasing
curl -X PUT "https://yourdomain.com/api/admin/config" \
  -H "Authorization: Bearer YOUR_ADMIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"action": "toggle_plan_purchasing", "enabled": false}'

# Enable plan purchasing
curl -X PUT "https://yourdomain.com/api/admin/config" \
  -H "Authorization: Bearer YOUR_ADMIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"action": "toggle_plan_purchasing", "enabled": true}'
```

### Method 3: Direct Database Update

If you have direct database access:

```sql
-- Disable plan purchasing
UPDATE AppConfig 
SET value = 'false', updatedAt = NOW() 
WHERE key = 'plan_purchasing_enabled';

-- Enable plan purchasing
UPDATE AppConfig 
SET value = 'true', updatedAt = NOW() 
WHERE key = 'plan_purchasing_enabled';

-- Check current status
SELECT key, value, description, updatedAt 
FROM AppConfig 
WHERE key = 'plan_purchasing_enabled';
```

## User Experience

### When Plan Purchasing is Enabled (Default)
- Users see normal plan cards with purchase buttons
- Purchase flow works normally
- No restrictions on plan upgrades

### When Plan Purchasing is Disabled
- Users see a prominent warning message at the top of the plans page
- Purchase buttons are disabled and show "Compras temporalmente deshabilitadas"
- Attempting to purchase via API returns a 503 error with appropriate message
- Free plan is still accessible (no purchasing required)

## Environment Variables

Make sure you have the following environment variables configured:

```env
# Admin API Key (required for API method)
ADMIN_API_KEY=your-secure-admin-api-key

# Alternative: CRON API Key (also works for admin endpoints)
CRON_API_KEY=your-cron-api-key
```

## Security

- The admin API requires proper authentication via API key
- All changes are logged to the console with timestamps
- The CLI script requires local server access
- Changes are tracked in the database with update timestamps

## Troubleshooting

### CLI Script Issues
```bash
# Make script executable (if needed)
chmod +x scripts/toggle-plan-purchasing.js

# Run with explicit node command
node scripts/toggle-plan-purchasing.js status
```

### API Authentication Issues
- Verify your `ADMIN_API_KEY` or `CRON_API_KEY` is set correctly
- Check that the header format is: `Authorization: Bearer YOUR_KEY`

### Database Connection Issues
- Ensure your database connection string is configured properly
- Check that the `AppConfig` table exists (run migrations if needed)

## Examples

### Quick Maintenance Mode
```bash
# Before maintenance
node scripts/toggle-plan-purchasing.js disable

# After maintenance
node scripts/toggle-plan-purchasing.js enable
```

### Automated Monitoring
You can integrate the status check into monitoring scripts:

```bash
#!/bin/bash
status=$(node scripts/toggle-plan-purchasing.js status 2>/dev/null | grep "ENABLED\|DISABLED")
if [[ $status == *"DISABLED"* ]]; then
    echo "⚠️ Plan purchasing is currently disabled"
    # Send alert or notification
fi
```

## Related Files

- `lib/appConfig.js` - Configuration management functions
- `app/api/admin/config/route.js` - Admin API endpoints
- `app/api/plan-purchasing-status/route.js` - Public status check endpoint
- `scripts/toggle-plan-purchasing.js` - CLI script
- `app/api/payments/create-preference/route.js` - Payment creation (with checks)
- `app/planes/page.js` - Plans page UI (with disabled state)

## Support

If you encounter issues with the plan purchasing control system:

1. Check the server logs for any error messages
2. Verify database connectivity
3. Ensure proper environment variables are set
4. Test with the CLI script first before using API methods 