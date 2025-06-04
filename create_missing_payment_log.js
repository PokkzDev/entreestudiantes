const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createMissingPaymentLog() {
  try {
    console.log('🔍 Looking for subscriptions without corresponding PaymentLog entries...');
    
    // Find subscriptions that don't have corresponding PaymentLog entries
    const subscriptionsWithoutLogs = await prisma.subscription.findMany({
      where: {
        // Find subscriptions where there's no PaymentLog with matching paymentId or userId/planId combo
        NOT: {
          paymentId: {
            in: await prisma.paymentLog.findMany({
              select: { commerceOrder: true, flowOrder: true }
            }).then(logs => [
              ...logs.map(log => log.commerceOrder),
              ...logs.map(log => log.flowOrder).filter(Boolean)
            ])
          }
        }
      },
      include: {
        user: {
          select: { id: true, email: true, name: true }
        }
      }
    });

    console.log(`📊 Found ${subscriptionsWithoutLogs.length} subscriptions without PaymentLog entries`);

    for (const subscription of subscriptionsWithoutLogs) {
      console.log(`\n🔧 Processing subscription: ${subscription.id}`);
      console.log(`   User: ${subscription.user.email}`);
      console.log(`   Plan: ${subscription.planId}`);
      console.log(`   PaymentId: ${subscription.paymentId}`);
      console.log(`   Amount: ${subscription.amount}`);
      console.log(`   Created: ${subscription.createdAt}`);

      // Create PaymentLog entry for this subscription
      const paymentLogData = {
        userId: subscription.userId,
        planId: subscription.planId,
        amount: subscription.amount,
        currency: subscription.currency,
        flowToken: `RETROACTIVE-${subscription.id}-${Date.now()}`, // Generate a unique token
        commerceOrder: `RETRO-${subscription.paymentId}`, // Use subscription paymentId
        flowOrder: subscription.paymentId, // Map subscription paymentId to flowOrder
        status: 'completed',
        paymentDate: subscription.createdAt // Use subscription creation date as payment date
      };

      try {
        const paymentLogResult = await prisma.paymentLog.create({
          data: paymentLogData
        });

        console.log(`   ✅ Created PaymentLog: ${paymentLogResult.id}`);
        console.log(`   📋 FlowToken: ${paymentLogResult.flowToken}`);
        console.log(`   📋 CommerceOrder: ${paymentLogResult.commerceOrder}`);
        
      } catch (error) {
        console.error(`   ❌ Failed to create PaymentLog:`, error.message);
        
        // If it fails due to duplicate, try to find existing
        if (error.code === 'P2002') { // Unique constraint violation
          console.log(`   ℹ️ PaymentLog might already exist for this flowToken`);
          
          // Try to find existing PaymentLog
          const existingLog = await prisma.paymentLog.findFirst({
            where: {
              OR: [
                { commerceOrder: paymentLogData.commerceOrder },
                { flowOrder: paymentLogData.flowOrder },
                { userId: subscription.userId, planId: subscription.planId, amount: subscription.amount }
              ]
            }
          });
          
          if (existingLog) {
            console.log(`   📋 Found existing PaymentLog: ${existingLog.id}`);
          } else {
            console.log(`   ⚠️ No existing PaymentLog found, constraint violation is for different field`);
          }
        }
      }
    }

    // Verify results
    console.log('\n🔍 Verification: Checking all PaymentLog records...');
    const allPaymentLogs = await prisma.paymentLog.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, email: true }
        }
      }
    });

    console.log(`📊 Total PaymentLog records after processing: ${allPaymentLogs.length}`);
    
    allPaymentLogs.forEach((log, index) => {
      console.log(`\n${index + 1}. PaymentLog:`, {
        id: log.id,
        userId: log.userId,
        userEmail: log.user?.email,
        planId: log.planId,
        amount: log.amount,
        status: log.status,
        flowToken: log.flowToken?.startsWith('RETROACTIVE-') ? 'RETROACTIVE' : log.flowToken?.substring(0, 10) + '...',
        commerceOrder: log.commerceOrder,
        flowOrder: log.flowOrder,
        createdAt: log.createdAt
      });
    });

  } catch (error) {
    console.error('❌ Error creating missing PaymentLog entries:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createMissingPaymentLog(); 