#!/usr/bin/env node

/**
 * Simple webhook test script without external dependencies
 * 
 * Usage:
 * node scripts/test-webhook-simple.js
 */

const https = require('https');
const http = require('http');
const url = require('url');

// Get the webhook URL from command line or use default
const WEBHOOK_URL = process.argv[2] || 'http://localhost:3000/api/payments/webhook';

async function testWebhookEndpoint() {
  console.log('🧪 Testing webhook endpoint...');
  console.log(`📍 URL: ${WEBHOOK_URL}`);
  
  const parsedUrl = url.parse(WEBHOOK_URL);
  const isHttps = parsedUrl.protocol === 'https:';
  const client = isHttps ? https : http;
  
  // Test GET request
  console.log('\n1️⃣ Testing GET request...');
  try {
    await makeRequest(client, parsedUrl, 'GET');
    console.log('✅ GET request successful');
  } catch (error) {
    console.log('❌ GET request failed:', error.message);
  }
  
  // Test POST request
  console.log('\n2️⃣ Testing POST request...');
  const testPayload = {
    action: "payment.updated",
    api_version: "v1",
    data: {"id":"1234561"},
    date_created: "2021-11-01T02:02:02Z",
    id: "123456",
    live_mode: false,
    type: "payment",
    user_id: 320470378
  };
  
  try {
    await makeRequest(client, parsedUrl, 'POST', JSON.stringify(testPayload));
    console.log('✅ POST request successful');
  } catch (error) {
    console.log('❌ POST request failed:', error.message);
  }
}

function makeRequest(client, parsedUrl, method, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
      path: parsedUrl.path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'WebhookTester/1.0'
      }
    };
    
    if (data) {
      options.headers['Content-Length'] = Buffer.byteLength(data);
    }
    
    const req = client.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        console.log(`   Status: ${res.statusCode} ${res.statusMessage}`);
        console.log(`   Response: ${responseData}`);
        
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(responseData);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (data) {
      req.write(data);
    }
    
    req.end();
  });
}

// Run the test
testWebhookEndpoint().catch(console.error); 