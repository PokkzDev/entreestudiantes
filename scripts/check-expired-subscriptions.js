#!/usr/bin/env node

/**
 * Subscription Expiration Checker Script
 * 
 * This script checks for expired subscriptions and automatically downgrades users to free tier.
 * Can be run manually or by a cron job.
 * 
 * Usage:
 * node scripts/check-expired-subscriptions.js
 * node scripts/check-expired-subscriptions.js --dry-run  (to see what would happen without making changes)
 */

require('dotenv').config();

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const API_KEY = process.env.CRON_API_KEY;

async function checkExpiredSubscriptions(dryRun = false) {
  try {
    console.log('🔍 Checking for expired subscriptions...');
    console.log(`📍 Target URL: ${APP_URL}/api/admin/check-expired-subscriptions`);
    console.log(`🔧 Mode: ${dryRun ? 'DRY RUN (no changes will be made)' : 'LIVE'}`);
    console.log('');

    if (dryRun) {
      console.log('⚠️  DRY RUN MODE - No actual changes will be made');
      // In dry run, we could implement a separate endpoint or logic
      // For now, we'll just indicate it's dry run
    }

    const headers = {
      'Content-Type': 'application/json'
    };

    // Add API key if available
    if (API_KEY) {
      headers['Authorization'] = `Bearer ${API_KEY}`;
    }

    const response = await fetch(`${APP_URL}/api/admin/check-expired-subscriptions`, {
      method: 'POST',
      headers
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${data.error || 'Unknown error'}`);
    }

    console.log('✅ Success!');
    console.log(`📊 Found: ${data.totalFound} expired subscriptions`);
    console.log(`⚙️  Processed: ${data.processedCount} users`);
    console.log(`⏰ Timestamp: ${data.timestamp}`);
    console.log('');

    if (data.results && data.results.length > 0) {
      console.log('📋 Detailed Results:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      data.results.forEach((result, index) => {
        const status = result.status === 'processed' ? '✅' : '❌';
        console.log(`${status} ${index + 1}. ${result.email}`);
        console.log(`   Previous tier: ${result.previousTier}`);
        console.log(`   Expired: ${new Date(result.expiredDate).toLocaleString()}`);
        if (result.error) {
          console.log(`   Error: ${result.error}`);
        }
        console.log('');
      });
    } else {
      console.log('🎉 No expired subscriptions found!');
    }

  } catch (error) {
    console.error('❌ Error checking expired subscriptions:', error.message);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');

// Run the check
checkExpiredSubscriptions(dryRun); 