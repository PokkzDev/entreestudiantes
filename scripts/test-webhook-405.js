const fetch = require('node-fetch');

// Simular exactamente el webhook que está fallando
async function testWebhook405() {
  const webhookUrl = 'http://localhost:3000/api/payments/webhook';
  
  // El payload exacto que está enviando MercadoPago según el error
  const payload = {
    action: "payment.updated",
    api_version: "v1",
    data: {"id": "123456"},
    date_created: "2021-11-01T02:02:02Z",
    id: "123456",
    live_mode: false,
    type: "payment",
    user_id: 320470378
  };

  console.log('🔍 Testing webhook with exact MercadoPago payload...');
  console.log('Payload:', JSON.stringify(payload, null, 2));
  
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'MercadoPago-Webhook/1.0'
      },
      body: JSON.stringify(payload)
    });

    console.log('\n📊 Response Status:', response.status);
    console.log('📊 Response Status Text:', response.statusText);
    console.log('📊 Response Headers:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('📊 Response Body:', responseText);

    if (response.status === 405) {
      console.log('\n❌ ERROR 405 - Method Not Allowed detected!');
      console.log('This means the endpoint exists but doesn\'t accept POST requests');
      console.log('Possible causes:');
      console.log('1. Route file doesn\'t export POST function');
      console.log('2. Next.js routing issue');
      console.log('3. Server configuration blocking POST requests');
    } else if (response.status === 404) {
      console.log('\n❌ ERROR 404 - Endpoint not found!');
      console.log('The webhook URL is incorrect or route doesn\'t exist');
    } else {
      console.log('\n✅ Webhook endpoint is working!');
    }

  } catch (error) {
    console.error('\n❌ Error testing webhook:', error.message);
    console.log('Make sure your Next.js development server is running on port 3000');
  }
}

// También probar otros métodos HTTP para diagnosticar
async function testAllMethods() {
  const webhookUrl = 'http://localhost:3000/api/payments/webhook';
  const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'];
  
  console.log('\n🔍 Testing all HTTP methods...');
  
  for (const method of methods) {
    try {
      const response = await fetch(webhookUrl, {
        method: method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: method !== 'GET' && method !== 'OPTIONS' ? JSON.stringify({test: true}) : undefined
      });
      
      console.log(`${method}: ${response.status} ${response.statusText}`);
    } catch (error) {
      console.log(`${method}: ERROR - ${error.message}`);
    }
  }
}

async function runTests() {
  console.log('🚀 Running webhook 405 diagnostic tests...\n');
  
  await testWebhook405();
  await testAllMethods();
  
  console.log('\n📋 Diagnostic complete!');
  console.log('\nIf you see a 405 error, check:');
  console.log('1. That app/api/payments/webhook/route.js exports a POST function');
  console.log('2. That your Next.js server is running');
  console.log('3. That no proxy or server is blocking POST requests');
}

runTests().catch(console.error); 