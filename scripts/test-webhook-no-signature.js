const http = require('http');

// Test webhook without signature (should be allowed to pass through)
async function testWebhookNoSignature() {
  console.log('Testing webhook endpoint without signature headers...');
  
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
      'Content-Length': Buffer.byteLength(postData)
      // No signature headers - should skip signature validation
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
        
        if (res.statusCode === 200) {
          console.log('✅ SUCCESS: Webhook endpoint is accessible and working!');
        } else if (res.statusCode === 307) {
          console.log('❌ FAILED: Still being redirected by auth middleware');
        } else {
          console.log(`⚠️ PARTIAL: Got status ${res.statusCode} (not 307 redirect)`);
        }
        
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

testWebhookNoSignature().catch(console.error); 