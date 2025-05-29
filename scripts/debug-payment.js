#!/usr/bin/env node

/**
 * Payment Debug Script
 * 
 * This script helps debug payment and subscription issues by checking
 * payment status, subscription records, and user account status.
 * 
 * Usage:
 * node scripts/debug-payment.js <payment_id>
 * node scripts/debug-payment.js <payment_id> --fix-subscription
 */

import { PrismaClient } from '@prisma/client';
import { verifyPayment, checkPaymentProcessed } from '../lib/mercadopago.js';
import { config } from 'dotenv';

// Load environment variables
config();

const prisma = new PrismaClient();

async function debugPayment(paymentId, shouldFix = false) {
  try {
    console.log(`🔍 Debugging payment: ${paymentId}\n`);

    // 1. Verify payment with MercadoPago
    console.log('1️⃣ Checking MercadoPago payment status...');
    const paymentResult = await verifyPayment(paymentId);
    
    if (!paymentResult.success) {
      console.error(`❌ Payment verification failed: ${paymentResult.error}`);
      return;
    }

    const payment = paymentResult.payment;
    console.log(`✅ Payment found: ${payment.status} - $${payment.transaction_amount} ${payment.currency_id}`);
    console.log(`📧 External Reference: ${payment.external_reference}\n`);

    // 2. Check if payment has been processed
    console.log('2️⃣ Checking local database records...');
    const processedResult = await checkPaymentProcessed(paymentId, prisma);
    
    if (processedResult.processed) {
      console.log('✅ Payment has been processed:');
      console.log(`   User: ${processedResult.subscription.user.email}`);
      console.log(`   Plan: ${processedResult.subscription.planId}`);
      console.log(`   Status: ${processedResult.subscription.status}`);
      console.log(`   Created: ${processedResult.subscription.createdAt}\n`);
    } else {
      console.log('⚠️  Payment not processed in local database\n');
    }

    // 3. Check payment intent
    console.log('3️⃣ Checking payment intent...');
    const paymentIntent = await prisma.paymentIntent.findFirst({
      where: {
        externalReference: payment.external_reference
      }
    });

    if (paymentIntent) {
      console.log('✅ Payment intent found:');
      console.log(`   Status: ${paymentIntent.status}`);
      console.log(`   MercadoPago Payment ID: ${paymentIntent.mercadoPagoPaymentId}`);
      console.log(`   Created: ${paymentIntent.createdAt}\n`);
    } else {
      console.log('⚠️  Payment intent not found\n');
    }

    // 4. Check user status
    if (processedResult.subscription) {
      console.log('4️⃣ Checking user account status...');
      const user = await prisma.user.findUnique({
        where: { id: processedResult.subscription.userId },
        select: {
          email: true,
          accountTier: true,
          subscriptionStatus: true,
          tierStartDate: true,
          tierEndDate: true
        }
      });

      if (user) {
        console.log('✅ User account:');
        console.log(`   Email: ${user.email}`);
        console.log(`   Tier: ${user.accountTier}`);
        console.log(`   Status: ${user.subscriptionStatus}`);
        console.log(`   Start: ${user.tierStartDate}`);
        console.log(`   End: ${user.tierEndDate}\n`);
      }
    }

    // 5. Fix subscription if requested and needed
    if (shouldFix && payment.status === 'approved' && !processedResult.processed) {
      console.log('🔧 Attempting to fix subscription...');
      // This would implement the subscription creation logic
      console.log('⚠️  Fix functionality not implemented yet - please use the manual verification endpoint');
    }

  } catch (error) {
    console.error('❌ Error debugging payment:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Parse command line arguments
const paymentId = process.argv[2];
const shouldFix = process.argv.includes('--fix-subscription');

if (!paymentId) {
  console.error('❌ Usage: node scripts/debug-payment.js <payment_id> [--fix-subscription]');
  process.exit(1);
}

debugPayment(paymentId, shouldFix); 