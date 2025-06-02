const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkPaymentLogs() {
  try {
    console.log('🔍 Checking PaymentLog records...');
    
    // Get all payment logs
    const paymentLogs = await prisma.paymentLog.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    });

    console.log(`📊 Total PaymentLog records: ${paymentLogs.length}`);
    
    if (paymentLogs.length === 0) {
      console.log('❌ No PaymentLog records found');
    } else {
      console.log('✅ PaymentLog records found:');
      paymentLogs.forEach((log, index) => {
        console.log(`\n${index + 1}. Payment Log:`, {
          id: log.id,
          userId: log.userId,
          userEmail: log.user?.email,
          planId: log.planId,
          amount: log.amount,
          currency: log.currency,
          status: log.status,
          flowToken: log.flowToken?.substring(0, 10) + '...',
          commerceOrder: log.commerceOrder,
          flowOrder: log.flowOrder,
          paymentDate: log.paymentDate,
          createdAt: log.createdAt
        });
      });
    }

    // Check recent subscriptions as well
    console.log('\n🔍 Checking recent Subscription records...');
    
    const subscriptions = await prisma.subscription.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      take: 10,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    });

    console.log(`📊 Recent Subscription records: ${subscriptions.length}`);
    subscriptions.forEach((sub, index) => {
      console.log(`\n${index + 1}. Subscription:`, {
        id: sub.id,
        userId: sub.userId,
        userEmail: sub.user?.email,
        planId: sub.planId,
        status: sub.status,
        amount: sub.amount,
        paymentId: sub.paymentId,
        startDate: sub.startDate,
        endDate: sub.endDate,
        createdAt: sub.createdAt
      });
    });

  } catch (error) {
    console.error('❌ Error checking payment logs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPaymentLogs(); 