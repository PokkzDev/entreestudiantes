const http = require('http');

// Test the webhook endpoint locally
async function testWebhook() {
  console.log('Testing webhook endpoint...');
  
  const postData = JSON.stringify({
    action: "payment.updated",
    api_version: "v1",
    data: {"id":"123456"},
    date_created: "2021-11-01T02:02:02Z",
    id: "123456",
    live_mode: false,
    type: "payment",
    user_id: 320470378
  });

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/payments/webhook?data.id=123456&type=payment',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
      'X-Signature': 'ts=1635738122,v1=dummy_signature_for_testing',
      'X-Request-Id': 'test_request_id'
    }
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      console.log(`Status Code: ${res.statusCode}`);
      console.log(`Headers:`, res.headers);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('Response:', data);
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', (error) => {
      console.error('Error:', error);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// Test OPTIONS request (CORS preflight)
async function testOptions() {
  console.log('\nTesting OPTIONS request...');
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/payments/webhook',
    method: 'OPTIONS'
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      console.log(`Status Code: ${res.statusCode}`);
      console.log(`Headers:`, res.headers);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('Response:', data);
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', (error) => {
      console.error('Error:', error);
      reject(error);
    });

    req.end();
  });
}

// Test GET request (health check)
async function testGet() {
  console.log('\nTesting GET request...');
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/payments/webhook',
    method: 'GET'
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      console.log(`Status Code: ${res.statusCode}`);
      console.log(`Headers:`, res.headers);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('Response:', data);
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', (error) => {
      console.error('Error:', error);
      reject(error);
    });

    req.end();
  });
}

async function runTests() {
  try {
    console.log('=== Testing Webhook Endpoint ===\n');
    
    // Test GET first
    await testGet();
    
    // Test OPTIONS
    await testOptions();
    
    // Test POST
    await testWebhook();
    
    console.log('\n=== All tests completed ===');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

runTests(); 