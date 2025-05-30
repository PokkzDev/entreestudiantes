// Test webhook in production environment
console.log('🚀 Testing webhook on entreestudiantes.cl...\n');

const baseUrl = 'https://entreestudiantes.cl';
const webhookUrl = `${baseUrl}/api/payments/webhook`;

// Payload exacto que está enviando MercadoPago
const testPayload = {
  action: "payment.updated",
  api_version: "v1",
  data: {"id": "123456"},
  date_created: "2021-11-01T02:02:02Z",
  id: "123456",
  live_mode: false,
  type: "payment",
  user_id: 320470378
};

async function testGetRequest() {
  console.log('🔍 Testing GET request...');
  console.log(`URL: ${webhookUrl}`);
  
  try {
    const response = await fetch(webhookUrl, {
      method: 'GET'
    });
    
    console.log(`✅ GET Status: ${response.status} ${response.statusText}`);
    
    const responseText = await response.text();
    console.log('Response:', responseText);
    
    return response.status;
  } catch (error) {
    console.error('❌ GET Error:', error.message);
    return null;
  }
}

async function testPostRequest() {
  console.log('\n🔍 Testing POST request...');
  console.log(`URL: ${webhookUrl}`);
  console.log('Payload:', JSON.stringify(testPayload, null, 2));
  
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'MercadoPago-Test/1.0'
      },
      body: JSON.stringify(testPayload)
    });
    
    console.log(`📊 POST Status: ${response.status} ${response.statusText}`);
    console.log('Response Headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('Response Body:', responseText);
    
    if (response.status === 405) {
      console.log('\n❌ ERROR 405 - Method Not Allowed!');
      console.log('This confirms the issue MercadoPago is experiencing.');
      console.log('\nPossible causes:');
      console.log('1. Server/proxy configuration blocking POST');
      console.log('2. CDN/Firewall blocking POST requests');
      console.log('3. Route configuration issue in production');
    } else if (response.status === 404) {
      console.log('\n❌ ERROR 404 - Endpoint not found!');
      console.log('The webhook route may not be deployed correctly.');
    } else if (response.ok) {
      console.log('\n✅ POST request successful!');
      console.log('The webhook should work with MercadoPago.');
    } else {
      console.log(`\n⚠️ Unexpected status: ${response.status}`);
    }
    
    return response.status;
  } catch (error) {
    console.error('❌ POST Error:', error.message);
    return null;
  }
}

async function testAlternativeEndpoint() {
  console.log('\n🔍 Testing alternative test endpoint...');
  const testUrl = `${baseUrl}/api/payments/webhook-test`;
  
  try {
    const response = await fetch(testUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testPayload)
    });
    
    console.log(`🧪 Test endpoint status: ${response.status} ${response.statusText}`);
    const responseText = await response.text();
    console.log('Test endpoint response:', responseText);
    
    return response.status;
  } catch (error) {
    console.error('❌ Test endpoint error:', error.message);
    return null;
  }
}

async function runProductionTests() {
  console.log('🌐 TESTING PRODUCTION WEBHOOK ENDPOINTS');
  console.log('═'.repeat(50));
  
  const getStatus = await testGetRequest();
  const postStatus = await testPostRequest();
  const testStatus = await testAlternativeEndpoint();
  
  console.log('\n📊 RESULTS SUMMARY:');
  console.log('═'.repeat(30));
  console.log(`GET request: ${getStatus || 'Failed'}`);
  console.log(`POST request: ${postStatus || 'Failed'}`);
  console.log(`Test endpoint: ${testStatus || 'Failed'}`);
  
  console.log('\n📋 ANALYSIS:');
  if (getStatus === 200 && postStatus === 405) {
    console.log('🔍 GET works but POST returns 405 - This is the exact issue MercadoPago faces');
    console.log('💡 Solution: Check your hosting provider/CDN settings for POST method restrictions');
  } else if (getStatus === 200 && postStatus === 200) {
    console.log('✅ Both GET and POST work - MercadoPago should work correctly');
    console.log('💡 If MercadoPago still fails, check the exact URL they are using');
  } else if (!getStatus && !postStatus) {
    console.log('❌ Both requests failed - Check domain and SSL certificate');
  }
  
  console.log('\n🔧 NEXT STEPS:');
  if (postStatus === 405) {
    console.log('1. Check hosting provider settings (Vercel/Netlify/etc.)');
    console.log('2. Verify no WAF/firewall is blocking POST requests');
    console.log('3. Check CDN configuration (Cloudflare, etc.)');
    console.log('4. Test with a different webhook URL temporarily');
  } else if (postStatus === 200) {
    console.log('1. Verify MercadoPago is using the exact URL: ' + webhookUrl);
    console.log('2. Check MercadoPago dashboard webhook configuration');
    console.log('3. Test webhook simulation again in MercadoPago');
  }
}

runProductionTests().catch(console.error); 