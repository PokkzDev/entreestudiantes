const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrateBasicToPremium() {
  try {
    console.log('🔄 Migrating basic subscriptions to premium...');
    
    // Update subscriptions with planId 'basic' to 'premium'
    const subscriptionResult = await prisma.subscription.updateMany({
      where: {
        planId: 'basic'
      },
      data: {
        planId: 'premium'
      }
    });
    
    console.log(`✅ Updated ${subscriptionResult.count} subscriptions from basic to premium`);
    
    // Update payment logs with planId 'basic' to 'premium'
    const paymentLogResult = await prisma.paymentLog.updateMany({
      where: {
        planId: 'basic'
      },
      data: {
        planId: 'premium'
      }
    });
    
    console.log(`✅ Updated ${paymentLogResult.count} payment logs from basic to premium`);
    
    // Update users with accountTier 'basic' to 'premium'
    const userResult = await prisma.user.updateMany({
      where: {
        accountTier: 'basic'
      },
      data: {
        accountTier: 'premium'
      }
    });
    
    console.log(`✅ Updated ${userResult.count} user accounts from basic to premium`);
    
    console.log('\n🎉 Migration completed successfully!');
    console.log('All basic tier references have been updated to premium.');
    
  } catch (error) {
    console.error('❌ Error during migration:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateBasicToPremium(); 