const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkSubscription() {
  try {
    const sub = await prisma.subscription.findFirst({
      where: { userId: 'cmbehegrq0002uxdh0rl1dgeb' }
    });
    
    console.log('Subscription details:', {
      id: sub?.id,
      paymentId: sub?.paymentId,
      planId: sub?.planId,
      amount: sub?.amount,
      status: sub?.status,
      createdAt: sub?.createdAt
    });
    
    // Check if this looks like a fallback paymentId
    if (sub?.paymentId?.startsWith('FALLBACK-')) {
      console.log('🚨 This subscription was created with fallback logic!');
      console.log('This means the original payment verification used fallback data when Flow.cl API was unavailable');
    } else {
      console.log('ℹ️ This subscription has a normal paymentId from Flow.cl');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSubscription(); 