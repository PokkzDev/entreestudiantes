const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugPaymentFlow() {
  try {
    console.log('🔍 Debugging payment flow...');
    
    // Simulate the scenario where we have a successful payment
    // but PaymentLog is not created
    
    const testToken = 'test-debug-token-' + Date.now();
    const testUserId = 'cmbehegrq0002uxdh0rl1dgeb';
    
    // Simulate paymentStatus data structure as it would come from Flow.cl
    const mockPaymentStatus = {
      status: 2, // Approved
      amount: 2990,
      currency: 'CLP',
      commerceOrder: 'ORDER-' + Date.now(),
      flowOrder: '3095993', // Real flowOrder
      subject: 'Plan Premium - EntreEstudiantes',
      payer: 'admin@entreestudiantes.cl',
      requestDate: new Date().toISOString().slice(0, 19).replace('T', ' '),
      optional: JSON.stringify({
        userId: testUserId,
        planId: 'basic',
        planName: 'Premium',
        paymentType: 'direct'
      }),
      paymentData: null,
      pending_info: null,
      merchantId: null
    };
    
    console.log('📋 Mock payment status:', mockPaymentStatus);
    
    // Parse planData like the real code does
    const planData = JSON.parse(mockPaymentStatus.optional);
    console.log('📦 Parsed plan data:', planData);
    
    // Create PaymentLog data like the real code does
    const paymentLogData = {
      userId: testUserId,
      planId: planData.planId,
      amount: mockPaymentStatus.amount,
      currency: mockPaymentStatus.currency || 'CLP',
      flowToken: testToken,
      commerceOrder: mockPaymentStatus.commerceOrder,
      status: 'completed',
      paymentDate: new Date()
    };
    
    // Add Flow order number if available
    if (mockPaymentStatus.flowOrder) {
      paymentLogData.flowOrder = mockPaymentStatus.flowOrder.toString();
    }
    
    console.log('💾 PaymentLog data to be created:', {
      ...paymentLogData,
      flowToken: paymentLogData.flowToken?.substring(0, 10) + '...'
    });
    
    // Test the upsert operation (exactly as done in the real code)
    console.log('🧪 Testing PaymentLog upsert operation...');
    
    try {
      const paymentLogResult = await prisma.paymentLog.upsert({
        where: { flowToken: testToken },
        update: {
          // Update with current data if record already exists
          status: 'completed',
          paymentDate: new Date()
        },
        create: paymentLogData
      });

      console.log('✅ PaymentLog upsert successful:', {
        id: paymentLogResult.id,
        flowToken: paymentLogResult.flowToken?.substring(0, 10) + '...',
        commerceOrder: paymentLogResult.commerceOrder,
        status: paymentLogResult.status
      });
      
      // Clean up test record
      await prisma.paymentLog.delete({
        where: { id: paymentLogResult.id }
      });
      console.log('🧹 Test PaymentLog cleaned up');
      
    } catch (paymentLogError) {
      console.error('❌ PaymentLog upsert failed:', paymentLogError);
      console.error('🔍 Error details:', {
        name: paymentLogError.name,
        message: paymentLogError.message,
        code: paymentLogError.code,
        meta: paymentLogError.meta
      });
    }
    
    // Now test a scenario where token might be null/undefined
    console.log('\n🧪 Testing with null/undefined token scenarios...');
    
    const invalidTokens = [null, undefined, '', 'null', 'undefined'];
    
    for (const invalidToken of invalidTokens) {
      console.log(`\n🔍 Testing with token: ${JSON.stringify(invalidToken)}`);
      
      const invalidPaymentLogData = {
        ...paymentLogData,
        flowToken: invalidToken
      };
      
      try {
        const result = await prisma.paymentLog.upsert({
          where: { flowToken: invalidToken },
          update: {
            status: 'completed',
            paymentDate: new Date()
          },
          create: invalidPaymentLogData
        });
        
        console.log(`✅ Unexpectedly succeeded with token: ${JSON.stringify(invalidToken)}`);
        await prisma.paymentLog.delete({ where: { id: result.id } });
        
      } catch (error) {
        console.log(`❌ Expected failure with token: ${JSON.stringify(invalidToken)}`);
        console.log(`   Error: ${error.message}`);
      }
    }
    
    console.log('\n✨ Debug completed!');
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugPaymentFlow(); 