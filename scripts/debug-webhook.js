const crypto = require('crypto');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

console.log('🔍 Debugging MercadoPago Webhook Signature Verification');
console.log('='.repeat(60));

console.log('Webhook secret configured:', !!process.env.MERCADOPAGO_WEBHOOK_SECRET);
console.log('Webhook secret length:', process.env.MERCADOPAGO_WEBHOOK_SECRET?.length);
console.log('Webhook secret (first 10 chars):', process.env.MERCADOPAGO_WEBHOOK_SECRET?.substring(0, 10) + '...');

// Test data from your actual failed webhooks
const failedWebhooks = [
  {
    name: 'Failed Merchant Order #1',
    dataId: '31367983066',
    requestId: '07f41112-ac63-44e0-87b9-6f103290f8a8',
    timestamp: '1748552967',
    receivedSignature: '708bd01e5c46181f342d6ecc0e8178defdee14e91b6465f76c0e2d587ad315c0',
    webhookType: 'merchant_order',
    rawBodyLength: 96
  },
  {
    name: 'Failed Merchant Order #2',
    dataId: '31367983066',
    requestId: '91f9adb9-1d70-4bb2-ac15-b00b718a9302',
    timestamp: '1748528291',
    receivedSignature: 'ef89997cf776267b2ca242977bde86e17c8322374431209a639aa461db63d532',
    webhookType: 'merchant_order',
    rawBodyLength: 96
  },
  {
    name: 'Successful Payment Webhook',
    dataId: '112807368887',
    requestId: 'd89cbc46-8d27-4e3f-b396-8122e941660e',
    timestamp: '1748552977',
    receivedSignature: '3ea0a4ea639cbc6ba4b9a206730d2985bc7bce6a0aa732ab9b827c282ed0d467',
    webhookType: 'payment',
    rawBodyLength: 188
  }
];

console.log('\n🧪 Testing webhook signatures with different payload formats:');
console.log('='.repeat(60));

failedWebhooks.forEach((webhook, index) => {
  console.log(`\n${index + 1}. ${webhook.name}`);
  console.log('-'.repeat(40));
  console.log(`Data ID: ${webhook.dataId}`);
  console.log(`Request ID: ${webhook.requestId}`);
  console.log(`Timestamp: ${webhook.timestamp}`);
  console.log(`Webhook Type: ${webhook.webhookType}`);
  console.log(`Raw Body Length: ${webhook.rawBodyLength}`);
  console.log(`Expected Signature: ${webhook.receivedSignature}`);
  
  // Test different payload formats
  const payloadFormats = [
    {
      name: 'Standard format',
      payload: `id:${webhook.dataId};request-id:${webhook.requestId};ts:${webhook.timestamp};`
    },
    {
      name: 'No trailing semicolon',
      payload: `id:${webhook.dataId};request-id:${webhook.requestId};ts:${webhook.timestamp}`
    },
    {
      name: 'Merchant order format (if merchant_order)',
      payload: webhook.webhookType === 'merchant_order' ? `id:${webhook.dataId};ts:${webhook.timestamp};` : null
    },
    {
      name: 'Simplified merchant order (if merchant_order)',
      payload: webhook.webhookType === 'merchant_order' ? `${webhook.dataId}${webhook.timestamp}` : null
    },
    {
      name: 'Alternative format',
      payload: `${webhook.dataId}${webhook.requestId}${webhook.timestamp}`
    }
  ];

  payloadFormats.forEach(({ name, payload }) => {
    if (!payload) return; // Skip null payloads
    
    const signature = crypto
      .createHmac('sha256', process.env.MERCADOPAGO_WEBHOOK_SECRET)
      .update(payload, 'utf8')
      .digest('hex');
    
    const match = signature === webhook.receivedSignature;
    const status = match ? '✅ MATCH' : '❌ NO MATCH';
    
    console.log(`\n  📝 ${name}:`);
    console.log(`     Payload: ${payload}`);
    console.log(`     Generated: ${signature}`);
    console.log(`     Status: ${status}`);
    
    if (match) {
      console.log(`     🎯 SOLUTION FOUND! Use this format for ${webhook.webhookType} webhooks`);
    }
  });
});

console.log('\n' + '='.repeat(60));
console.log('🔍 Summary and Recommendations:');
console.log('='.repeat(60));

if (!process.env.MERCADOPAGO_WEBHOOK_SECRET) {
  console.log('❌ MERCADOPAGO_WEBHOOK_SECRET is not configured');
  console.log('   Please add it to your .env file');
} else {
  console.log('✅ MERCADOPAGO_WEBHOOK_SECRET is configured');
  console.log('\n📋 Next steps:');
  console.log('1. Check if any of the payload formats above show MATCH');
  console.log('2. If a format matches, the webhook secret is correct');
  console.log('3. If no format matches, check your webhook secret in MercadoPago dashboard');
  console.log('4. Make sure you\'re using the webhook secret from the correct environment (production/sandbox)');
}

console.log('\n🔗 Useful links:');
console.log('- MercadoPago Webhook Documentation: https://www.mercadopago.com/developers/en/docs/your-integrations/notifications/webhooks');
console.log('- Webhook Configuration: https://www.mercadopago.com/developers/panel/webhooks'); 