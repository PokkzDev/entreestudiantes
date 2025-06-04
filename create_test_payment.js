const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestPayment() {
  try {
    console.log('🧪 Creating test payment record to verify functionality...');
    
    // Create a test payment record
    const testPayment = await prisma.paymentLog.create({
      data: {
        userId: 'cmbfp2a1u0002uxtqdgdy1vze',
        planId: 'basic',
        amount: 2990,
        currency: 'CLP',
        flowToken: 'test-token-' + Date.now(),
        commerceOrder: 'TEST-ORDER-' + Date.now(),
        flowOrder: '12345678',
        status: 'completed',
        paymentDate: new Date()
      }
    });

    console.log('✅ Test payment created:', {
      id: testPayment.id,
      planId: testPayment.planId,
      amount: testPayment.amount,
      status: testPayment.status,
      createdAt: testPayment.createdAt
    });

    // Also create a test subscription
    const testSubscription = await prisma.subscription.create({
      data: {
        userId: 'cmbfp2a1u0002uxtqdgdy1vze',
        planId: 'basic',
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        amount: 2990,
        currency: 'CLP',
        paymentId: testPayment.flowOrder,
        autoRenew: false
      }
    });

    console.log('✅ Test subscription created:', {
      id: testSubscription.id,
      planId: testSubscription.planId,
      status: testSubscription.status,
      endDate: testSubscription.endDate
    });

    console.log('\n🎉 Test payment and subscription created successfully!');
    console.log('Now you can check the configuraciones page to see the payment history.');
    console.log('\nTo remove the test data later, run:');
    console.log(`npx prisma studio`);
    console.log('Or create a cleanup script.');

  } catch (error) {
    console.error('❌ Error creating test payment:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestPayment(); 