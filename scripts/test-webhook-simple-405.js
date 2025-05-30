// Test webhook endpoint for 405 issue
console.log('🚀 Testing webhook endpoint for 405 issue...\n');

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

console.log('📦 Test payload:', JSON.stringify(payload, null, 2));

async function testWithFetch() {
  try {
    console.log('\n🔍 Testing with native fetch...');
    
    const response = await fetch('http://localhost:3000/api/payments/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'MercadoPago-Test/1.0'
      },
      body: JSON.stringify(payload)
    });

    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    
    const responseText = await response.text();
    console.log('Response:', responseText);
    
    if (response.status === 405) {
      console.log('\n❌ 405 Error detected! This means:');
      console.log('- The route exists but doesn\'t accept POST method');
      console.log('- Check that POST function is exported in route.js');
      console.log('- Check Next.js server is running properly');
    } else if (response.ok) {
      console.log('\n✅ Webhook is working correctly!');
    }
    
    return response.status;
  } catch (error) {
    console.error('❌ Fetch error:', error.message);
    return null;
  }
}

async function testAlternateEndpoint() {
  try {
    console.log('\n🔍 Testing alternate test endpoint...');
    
    const response = await fetch('http://localhost:3000/api/payments/webhook-test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    console.log('Test endpoint status:', response.status);
    const responseText = await response.text();
    console.log('Test endpoint response:', responseText);
    
    return response.status;
  } catch (error) {
    console.error('❌ Test endpoint error:', error.message);
    return null;
  }
}

// Run the tests
(async () => {
  const mainStatus = await testWithFetch();
  const testStatus = await testAlternateEndpoint();
  
  console.log('\n📊 Results Summary:');
  console.log(`Main webhook: ${mainStatus || 'Failed'}`);
  console.log(`Test webhook: ${testStatus || 'Failed'}`);
  
  if (mainStatus === 405) {
    console.log('\n🔧 Troubleshooting steps:');
    console.log('1. Ensure Next.js dev server is running: npm run dev');
    console.log('2. Check that app/api/payments/webhook/route.js exports POST function');
    console.log('3. Verify no proxy is blocking POST requests');
    console.log('4. Check browser network tab when making requests');
  }
})(); 