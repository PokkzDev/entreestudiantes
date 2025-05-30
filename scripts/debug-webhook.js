const crypto = require('crypto');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Example data from your logs
const testData = {
  dataId: '113276464672',
  requestId: '5ef5db5c-ceb0-4a96-9f13-4a58d8c74b85',
  timestamp: '1748552967',
  receivedSignature: 'b71f29ebd1b6e429801915dbf49545a8f9aec8dc74e06f2d724b625755d885f1',
  rawBody: '{"action":"payment.created","api_version":"v1","data":{"id":"113276464672"},"date_created":"2025-05-30T07:36:58Z","id":121751566176,"live_mode":true,"type":"payment","user_id":"320470378"}'
};

console.log('🔍 Debugging MercadoPago Webhook Signature Verification');
console.log('==================================================');

console.log('Test data:', testData);
console.log('Webhook secret configured:', !!process.env.MERCADOPAGO_WEBHOOK_SECRET);
console.log('Webhook secret length:', process.env.MERCADOPAGO_WEBHOOK_SECRET?.length);
console.log('Webhook secret (first 10 chars):', process.env.MERCADOPAGO_WEBHOOK_SECRET?.substring(0, 10) + '...');

// Test different payload formats
const payloadFormats = [
  {
    name: 'Standard format',
    payload: `id:${testData.dataId};request-id:${testData.requestId};ts:${testData.timestamp};`
  },
  {
    name: 'No trailing semicolon',
    payload: `id:${testData.dataId};request-id:${testData.requestId};ts:${testData.timestamp}`
  },
  {
    name: 'Raw body only',
    payload: testData.rawBody
  },
  {
    name: 'Timestamp + Raw body',
    payload: testData.timestamp + testData.rawBody
  },
  {
    name: 'Alternative format',
    payload: `${testData.dataId}${testData.requestId}${testData.timestamp}`
  },
  {
    name: 'MercadoPago v2 format',
    payload: `${testData.dataId}${testData.timestamp}`
  }
];

console.log('\n🔍 Testing different payload formats:');
console.log('=====================================');

payloadFormats.forEach(({ name, payload }) => {
  console.log(`\n📝 ${name}:`);
  console.log(`Payload: ${payload}`);
  
  const signature = crypto
    .createHmac('sha256', process.env.MERCADOPAGO_WEBHOOK_SECRET)
    .update(payload, 'utf8')
    .digest('hex');
    
  console.log(`Generated signature: ${signature}`);
  console.log(`Expected signature:  ${testData.receivedSignature}`);
  console.log(`Match: ${signature === testData.receivedSignature ? '✅ YES' : '❌ NO'}`);
});

console.log('\n🎯 Summary:');
console.log('===========');
console.log('Looking for webhook signature verification issues...');

// Try the successful webhook from logs
const successfulData = {
  dataId: '113276464672',
  requestId: '5ef5db5c-ceb0-4a96-9f13-4a58d8c74b85',
  timestamp: '1748552967',
  receivedSignature: 'b71f29ebd1b6e429801915dbf49545a8f9aec8dc74e06f2d724b625755d885f1'
};

console.log('\n🎯 Testing the successful webhook signature:');
const successPayload = `id:${successfulData.dataId};request-id:${successfulData.requestId};ts:${successfulData.timestamp};`;
const successSignature = crypto
  .createHmac('sha256', process.env.MERCADOPAGO_WEBHOOK_SECRET)
  .update(successPayload, 'utf8')
  .digest('hex');

console.log(`Success payload: ${successPayload}`);
console.log(`Generated: ${successSignature}`);
console.log(`Expected:  ${successfulData.receivedSignature}`);
console.log(`Match: ${successSignature === successfulData.receivedSignature ? '✅ YES - This worked!' : '❌ NO'}`);

if (successSignature === successfulData.receivedSignature) {
  console.log('\n✅ SUCCESS! The webhook secret and format are correct.');
  console.log('The issue is likely with failed webhooks having different timestamps or request IDs.');
} else {
  console.log('\n❌ Even the "successful" webhook signature doesn\'t match.');
  console.log('This suggests an issue with the webhook secret or payload format.');
} 