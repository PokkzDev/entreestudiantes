const http = require('http');
const crypto = require('crypto');

// Usar el secreto real del archivo .env
const REAL_WEBHOOK_SECRET = '6af3138bfa6a6e27a171d792d21279daa22482b12dae9f85468efcef786b7d65';

// Simular un webhook REAL de MercadoPago con firma válida
async function testRealWebhook() {
  console.log('🔥 Testing REAL webhook with valid signature...');
  
  // Datos del webhook real
  const paymentId = '12345678901';
  const requestId = 'real_request_' + Date.now();
  const timestamp = Math.floor(Date.now() / 1000).toString();
  
  console.log('📋 Webhook data:');
  console.log('  - Payment ID:', paymentId);
  console.log('  - Request ID:', requestId);
  console.log('  - Timestamp:', timestamp);
  console.log('  - Using real secret from .env:', REAL_WEBHOOK_SECRET.substring(0, 16) + '...');
  
  // Crear el manifest string según documentación de MercadoLibre
  // Formato: id:[data.id];request-id:[x-request-id];ts:[timestamp];
  const manifest = `id:${paymentId};request-id:${requestId};ts:${timestamp};`;
  
  console.log('📄 Manifest string:', manifest);
  
  // Generar firma HMAC SHA256
  const signature = crypto
    .createHmac('sha256', REAL_WEBHOOK_SECRET)
    .update(manifest, 'utf8')
    .digest('hex');
  
  console.log('🔐 Generated signature:', signature);
  
  // Crear header x-signature en formato de MercadoLibre
  const xSignature = `ts=${timestamp},v1=${signature}`;
  
  console.log('📤 X-Signature header:', xSignature);
  
  // Payload del webhook real
  const webhookPayload = {
    action: "payment.updated",
    api_version: "v1",
    data: { "id": paymentId },
    date_created: new Date().toISOString(),
    id: parseInt(paymentId),
    live_mode: true, // ✅ WEBHOOK REAL
    type: "payment",
    user_id: 320470378
  };

  const postData = JSON.stringify(webhookPayload);
  
  console.log('📦 Payload:', JSON.stringify(webhookPayload, null, 2));

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: `/api/payments/webhook?data.id=${paymentId}&type=payment`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
      'x-signature': xSignature,
      'x-request-id': requestId
    }
  };

  console.log('\n🚀 Sending real webhook request...');
  console.log('Headers:', options.headers);

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      console.log(`\n📨 Response Status: ${res.statusCode}`);
      console.log('📨 Response Headers:', res.headers);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('📨 Response Body:', data);
        
        try {
          const responseData = JSON.parse(data);
          console.log('📨 Parsed Response:', JSON.stringify(responseData, null, 2));
          
          if (res.statusCode === 200 && responseData.success) {
            console.log('✅ Real webhook verification PASSED completely!');
          } else if (res.statusCode === 401) {
            console.log('❌ Signature verification FAILED');
          } else if (res.statusCode === 502) {
            console.log('✅ Signature verification PASSED! (502 = payment verification failed as expected)');
            console.log('🎉 This confirms the webhook signature verification is working correctly!');
          } else if (res.statusCode === 404) {
            console.log('⚠️  Payment intent not found (expected for test payment)');
          } else {
            console.log('⚠️  Unexpected response code:', res.statusCode);
          }
        } catch (e) {
          console.log('Raw response:', data);
        }
        
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request Error:', error);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// También test con firma inválida para verificar que la validación funciona
async function testInvalidSignature() {
  console.log('\n🔍 Testing with INVALID signature...');
  
  const paymentId = '99999999';
  const requestId = 'invalid_request_' + Date.now();
  const timestamp = Math.floor(Date.now() / 1000).toString();
  
  // Usar firma completamente incorrecta
  const invalidSignature = `ts=${timestamp},v1=invalid_signature_hash_12345`;
  
  const webhookPayload = {
    action: "payment.updated",
    api_version: "v1",
    data: { "id": paymentId },
    date_created: new Date().toISOString(),
    id: parseInt(paymentId),
    live_mode: true, // WEBHOOK REAL
    type: "payment",
    user_id: 320470378
  };

  const postData = JSON.stringify(webhookPayload);

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: `/api/payments/webhook?data.id=${paymentId}&type=payment`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
      'x-signature': invalidSignature,
      'x-request-id': requestId
    }
  };

  console.log('🚀 Sending webhook with invalid signature...');

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      console.log(`\n📨 Response Status: ${res.statusCode}`);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('📨 Response Body:', data);
        
        if (res.statusCode === 401) {
          console.log('✅ Invalid signature correctly REJECTED!');
        } else {
          console.log('⚠️  Expected 401 for invalid signature');
        }
        
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request Error:', error);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

async function runRealWebhookTests() {
  try {
    console.log('🔥 === Testing REAL Webhook Signature Verification ===\n');
    
    // Test 1: Valid signature
    await testRealWebhook();
    
    // Test 2: Invalid signature
    await testInvalidSignature();
    
    console.log('\n🏁 === Real webhook tests completed ===');
  } catch (error) {
    console.error('💥 Test failed:', error);
  }
}

runRealWebhookTests(); 