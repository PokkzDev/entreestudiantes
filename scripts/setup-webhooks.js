#!/usr/bin/env node

/**
 * MercadoPago Webhook Management Script
 * 
 * This script helps you register, list, and manage webhooks with MercadoPago.
 * 
 * Usage:
 * node scripts/setup-webhooks.js list
 * node scripts/setup-webhooks.js create
 * node scripts/setup-webhooks.js delete <webhook_id>
 */

import fetch from 'node-fetch';
import { config } from 'dotenv';

// Load environment variables
config();

const MERCADOPAGO_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;
const WEBHOOK_URL = `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/webhook`;

if (!MERCADOPAGO_ACCESS_TOKEN) {
  console.error('❌ MERCADOPAGO_ACCESS_TOKEN not found in environment variables');
  process.exit(1);
}

async function listWebhooks() {
  try {
    console.log('📋 Listing existing webhooks...');
    
    const response = await fetch('https://api.mercadopago.com/v1/webhooks', {
      headers: {
        'Authorization': `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.length === 0) {
      console.log('📭 No webhooks found');
      return;
    }
    
    console.log(`📄 Found ${data.length} webhook(s):`);
    data.forEach((webhook, index) => {
      console.log(`\n${index + 1}. Webhook ID: ${webhook.id}`);
      console.log(`   URL: ${webhook.url}`);
      console.log(`   Events: ${webhook.events.join(', ')}`);
      console.log(`   Status: ${webhook.status}`);
      console.log(`   Created: ${webhook.date_created}`);
    });
    
  } catch (error) {
    console.error('❌ Error listing webhooks:', error.message);
  }
}

async function createWebhook() {
  try {
    console.log('🔧 Creating new webhook...');
    console.log(`📍 Webhook URL: ${WEBHOOK_URL}`);
    
    const webhookData = {
      url: WEBHOOK_URL,
      events: ['payment']
    };
    
    const response = await fetch('https://api.mercadopago.com/v1/webhooks', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(webhookData)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('❌ Error creating webhook:', data);
      return;
    }
    
    console.log('✅ Webhook created successfully!');
    console.log(`🆔 Webhook ID: ${data.id}`);
    console.log(`📍 URL: ${data.url}`);
    console.log(`📅 Events: ${data.events.join(', ')}`);
    console.log(`🔄 Status: ${data.status}`);
    
    // Test the webhook
    console.log('\n🧪 Testing webhook endpoint...');
    await testWebhookEndpoint();
    
  } catch (error) {
    console.error('❌ Error creating webhook:', error.message);
  }
}

async function deleteWebhook(webhookId) {
  try {
    console.log(`🗑️ Deleting webhook ${webhookId}...`);
    
    const response = await fetch(`https://api.mercadopago.com/v1/webhooks/${webhookId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`
      }
    });
    
    if (response.ok) {
      console.log('✅ Webhook deleted successfully!');
    } else {
      const error = await response.json();
      console.error('❌ Error deleting webhook:', error);
    }
    
  } catch (error) {
    console.error('❌ Error deleting webhook:', error.message);
  }
}

async function testWebhookEndpoint() {
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'GET'
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Webhook endpoint is accessible');
      console.log(`📊 Response: ${JSON.stringify(data)}`);
    } else {
      console.log('❌ Webhook endpoint is not accessible');
      console.log(`🔍 Status: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error('❌ Error testing webhook endpoint:', error.message);
  }
}

// Main script execution
const command = process.argv[2];
const webhookId = process.argv[3];

console.log('🚀 MercadoPago Webhook Manager\n');

switch (command) {
  case 'list':
    await listWebhooks();
    break;
    
  case 'create':
    await createWebhook();
    break;
    
  case 'delete':
    if (!webhookId) {
      console.error('❌ Please provide a webhook ID to delete');
      console.log('Usage: node scripts/setup-webhooks.js delete <webhook_id>');
      process.exit(1);
    }
    await deleteWebhook(webhookId);
    break;
    
  case 'test':
    await testWebhookEndpoint();
    break;
    
  default:
    console.log('Usage:');
    console.log('  node scripts/setup-webhooks.js list        # List all webhooks');
    console.log('  node scripts/setup-webhooks.js create      # Create a new webhook');
    console.log('  node scripts/setup-webhooks.js delete <id> # Delete a webhook');
    console.log('  node scripts/setup-webhooks.js test        # Test webhook endpoint');
    break;
} 