const http = require('http');
const crypto = require('crypto');

// Test detallado de verificación de firma
function debugSignatureGeneration() {
  console.log('🔬 === DEBUG: Signature Generation ===\n');
  
  const paymentId = '12345678901';
  const requestId = 'debug_request_1234567890';
  const timestamp = '1748647744'; // Timestamp fijo para test
  const secret = '6af3138bfa6a6e27a171d792d21279daa22482b12dae9f85468efcef786b7d65'; // Real secret from .env
  
  console.log('🔍 Input data:');
  console.log('  - paymentId:', paymentId);
  console.log('  - requestId:', requestId);
  console.log('  - timestamp:', timestamp);
  console.log('  - secret:', secret);
  
  // Crear manifest exacto según documentación
  const manifest = `id:${paymentId};request-id:${requestId};ts:${timestamp};`;
  console.log('\n📋 Manifest string:');
  console.log('  "' + manifest + '"');
  console.log('  Length:', manifest.length);
  console.log('  Bytes:', Buffer.from(manifest, 'utf8'));
  
  // Generar firma paso a paso
  console.log('\n🔐 HMAC Generation:');
  const hmac = crypto.createHmac('sha256', secret);
  console.log('  1. Created HMAC with secret');
  
  hmac.update(manifest, 'utf8');
  console.log('  2. Updated with manifest (utf8)');
  
  const signature = hmac.digest('hex');
  console.log('  3. Generated hex digest:', signature);
  
  const xSignature = `ts=${timestamp},v1=${signature}`;
  console.log('\n📤 Final x-signature header:', xSignature);
  
  return {
    paymentId,
    requestId,
    timestamp,
    manifest,
    signature,
    xSignature
  };
}

async function testWithDebugSignature() {
  const debug = debugSignatureGeneration();
  
  console.log('\n🚀 Sending webhook with debug signature...\n');
  
  const webhookPayload = {
    action: "payment.updated",
    api_version: "v1",
    data: { "id": debug.paymentId },
    date_created: new Date().toISOString(),
    id: parseInt(debug.paymentId),
    live_mode: true,
    type: "payment",
    user_id: 320470378
  };

  const postData = JSON.stringify(webhookPayload);

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: `/api/payments/webhook?data.id=${debug.paymentId}&type=payment`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
      'x-signature': debug.xSignature,
      'x-request-id': debug.requestId
    }
  };

  console.log('📨 Request details:');
  console.log('  URL:', `${options.hostname}:${options.port}${options.path}`);
  console.log('  Headers:', options.headers);

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      console.log(`\n📨 Response Status: ${res.statusCode}`);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('📨 Response Body:', data);
        
        try {
          const responseData = JSON.parse(data);
          console.log('📨 Parsed Response:', JSON.stringify(responseData, null, 2));
          
          if (res.statusCode === 200) {
            console.log('✅ Signature verification SUCCEEDED!');
          } else if (res.statusCode === 401) {
            console.log('❌ Signature verification FAILED');
            console.log('🔍 Check server logs for detailed verification steps');
          } else {
            console.log('⚠️  Unexpected status code');
          }
        } catch (e) {
          console.log('Raw response (not JSON):', data);
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

// También test manual de verificación para comparar
function manualVerification() {
  console.log('\n🧪 === Manual Verification Test ===');
  
  const xSignature = 'ts=1748647744,v1=3e3b3395757af6fed2875507eeb6f37ce2896a3169139f4207816fa63b7f81a5';
  const xRequestId = 'debug_request_1234567890';
  const dataId = '12345678901';
  const secret = '6af3138bfa6a6e27a171d792d21279daa22482b12dae9f85468efcef786b7d65'; // Real secret from .env
  
  console.log('Input parameters:');
  console.log('  xSignature:', xSignature);
  console.log('  xRequestId:', xRequestId);
  console.log('  dataId:', dataId);
  console.log('  secret:', secret);
  
  // Parse signature
  const parts = xSignature.split(',');
  let ts = null;
  let hash = null;
  
  parts.forEach(part => {
    const [key, value] = part.split('=');
    if (key && value) {
      const trimmedKey = key.trim();
      const trimmedValue = value.trim();
      if (trimmedKey === 'ts') {
        ts = trimmedValue;
      } else if (trimmedKey === 'v1') {
        hash = trimmedValue;
      }
    }
  });
  
  console.log('\nParsed components:');
  console.log('  ts:', ts);
  console.log('  hash:', hash);
  
  // Create manifest
  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
  console.log('\nGenerated manifest:', manifest);
  
  // Generate expected signature
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(manifest, 'utf8')
    .digest('hex');
  
  console.log('\nSignature comparison:');
  console.log('  Expected: ', expectedSignature);
  console.log('  Received: ', hash);
  console.log('  Match:    ', expectedSignature === hash ? '✅ YES' : '❌ NO');
  
  return expectedSignature === hash;
}

async function runDebugTests() {
  try {
    // Test 1: Manual verification
    const manualResult = manualVerification();
    
    // Test 2: Real request
    await testWithDebugSignature();
    
    console.log('\n🏁 === Debug Tests Completed ===');
    console.log('Manual verification result:', manualResult ? '✅ PASS' : '❌ FAIL');
    
  } catch (error) {
    console.error('💥 Debug test failed:', error);
  }
}

runDebugTests(); 