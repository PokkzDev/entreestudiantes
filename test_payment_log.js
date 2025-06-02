const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testPaymentLogCreation() {
  try {
    console.log('🧪 Testing PaymentLog creation...');
    
    // Get a user to test with
    const testUser = await prisma.user.findFirst({
      where: {
        email: 'admin@entreestudiantes.cl'
      }
    });

    if (!testUser) {
      console.error('❌ Test user not found');
      return;
    }

    console.log('👤 Found test user:', testUser.id, testUser.email);

    // Test PaymentLog data structure (similar to what's used in the payment flow)
    const testPaymentLogData = {
      userId: testUser.id,
      planId: 'basic',
      amount: 2990,
      currency: 'CLP',
      flowToken: 'test-token-' + Date.now(),
      commerceOrder: 'TEST-ORDER-' + Date.now(),
      status: 'completed',
      paymentDate: new Date(),
      flowOrder: '12345678'
    };

    console.log('📋 Test PaymentLog data:', testPaymentLogData);

    // Try to create PaymentLog
    console.log('💾 Attempting to create test PaymentLog...');
    
    const result = await prisma.paymentLog.create({
      data: testPaymentLogData
    });

    console.log('✅ Test PaymentLog created successfully:', {
      id: result.id,
      userId: result.userId,
      planId: result.planId,
      amount: result.amount,
      flowToken: result.flowToken,
      commerceOrder: result.commerceOrder,
      status: result.status,
      createdAt: result.createdAt
    });

    // Clean up test record
    await prisma.paymentLog.delete({
      where: { id: result.id }
    });
    console.log('🧹 Test PaymentLog cleaned up');

    // Now test upsert functionality (which is used in the actual code)
    console.log('\n🧪 Testing PaymentLog upsert functionality...');
    
    const upsertData = {
      userId: testUser.id,
      planId: 'premium', 
      amount: 4990,
      currency: 'CLP',
      flowToken: 'upsert-test-token-' + Date.now(),
      commerceOrder: 'UPSERT-ORDER-' + Date.now(),
      status: 'completed',
      paymentDate: new Date(),
      flowOrder: '87654321'
    };

    const upsertResult = await prisma.paymentLog.upsert({
      where: { flowToken: upsertData.flowToken },
      update: {
        status: 'completed',
        paymentDate: new Date()
      },
      create: upsertData
    });

    console.log('✅ Upsert PaymentLog created successfully:', {
      id: upsertResult.id,
      flowToken: upsertResult.flowToken,
      status: upsertResult.status
    });

    // Clean up upsert test record
    await prisma.paymentLog.delete({
      where: { id: upsertResult.id }
    });
    console.log('🧹 Upsert test PaymentLog cleaned up');

    console.log('\n✨ All PaymentLog tests passed! The database schema and operations work correctly.');

  } catch (error) {
    console.error('❌ Error during PaymentLog testing:', error);
    console.error('🔍 Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      meta: error.meta
    });
  } finally {
    await prisma.$disconnect();
  }
}

testPaymentLogCreation(); 