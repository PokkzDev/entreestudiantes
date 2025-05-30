#!/usr/bin/env node

/**
 * CLI Script to toggle plan purchasing functionality
 * Usage: node scripts/toggle-plan-purchasing.js [enable|disable|status]
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const CONFIG_KEY = 'plan_purchasing_enabled';

async function getCurrentStatus() {
  try {
    const config = await prisma.appConfig.findFirst({
      where: {
        key: CONFIG_KEY,
        isActive: true
      }
    });

    return config ? config.value === 'true' : true; // Default to enabled
  } catch (error) {
    console.error('Error getting current status:', error);
    return null;
  }
}

async function setStatus(enabled) {
  try {
    await prisma.appConfig.upsert({
      where: { key: CONFIG_KEY },
      update: {
        value: enabled.toString(),
        updatedAt: new Date()
      },
      create: {
        key: CONFIG_KEY,
        value: enabled.toString(),
        description: 'Enable or disable plan purchasing functionality. When disabled, users cannot purchase new plans.',
        isActive: true
      }
    });

    return true;
  } catch (error) {
    console.error('Error setting status:', error);
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0]?.toLowerCase();

  console.log('🔧 Plan Purchasing Toggle Script');
  console.log('================================\n');

  try {
    switch (command) {
      case 'enable':
        console.log('🔄 Enabling plan purchasing...');
        const enableSuccess = await setStatus(true);
        if (enableSuccess) {
          console.log('✅ Plan purchasing has been ENABLED');
          console.log('   Users can now purchase plans normally.');
        } else {
          console.log('❌ Failed to enable plan purchasing');
          process.exit(1);
        }
        break;

      case 'disable':
        console.log('🔄 Disabling plan purchasing...');
        const disableSuccess = await setStatus(false);
        if (disableSuccess) {
          console.log('⚠️  Plan purchasing has been DISABLED');
          console.log('   Users will see a "temporarily disabled" message.');
          console.log('   Existing subscriptions continue to work normally.');
        } else {
          console.log('❌ Failed to disable plan purchasing');
          process.exit(1);
        }
        break;

      case 'status':
      case undefined:
        console.log('📊 Checking current status...');
        const currentStatus = await getCurrentStatus();
        if (currentStatus !== null) {
          console.log(`Current status: Plan purchasing is ${currentStatus ? 'ENABLED' : 'DISABLED'}`);
          if (currentStatus) {
            console.log('   ✅ Users can purchase plans');
          } else {
            console.log('   ⚠️  Users cannot purchase new plans');
          }
        } else {
          console.log('❌ Failed to check status');
          process.exit(1);
        }
        break;

      default:
        console.log('❌ Invalid command. Usage:');
        console.log('   node scripts/toggle-plan-purchasing.js enable');
        console.log('   node scripts/toggle-plan-purchasing.js disable');
        console.log('   node scripts/toggle-plan-purchasing.js status');
        process.exit(1);
    }

    console.log('\n📝 Note: Changes take effect immediately without app restart.');
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Interrupted. Cleaning up...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Terminated. Cleaning up...');
  await prisma.$disconnect();
  process.exit(0);
});

main().catch(async (error) => {
  console.error('💥 Fatal error:', error);
  await prisma.$disconnect();
  process.exit(1);
}); 