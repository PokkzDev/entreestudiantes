import { NextResponse } from 'next/server';
import { verifyPayment, parseExternalReference, verifyWebhookSignature } from '@/lib/mercadopago';
import { createSubscriptionSafely } from '@/lib/dbUtils';
import { prisma } from '@/lib/prisma';

// Disable Next.js static optimization—this must run at request time
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

// Common CORS headers for all responses
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Mercadopago-Signature, X-Request-Id',
};

async function handlePOST(request) {
  const rawBody = await request.text();
  let body;
  try {
    body = JSON.parse(rawBody);
  } catch (err) {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON payload' },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  // Debug logging
  console.log('[MP] Webhook received:', {
    body: body,
    headers: {
      'X-Mercadopago-Signature': request.headers.get('X-Mercadopago-Signature'),
      'X-Request-Id': request.headers.get('X-Request-Id'),
      'x-signature': request.headers.get('x-signature'),
      'x-request-id': request.headers.get('x-request-id'),
      'content-type': request.headers.get('content-type')
    },
    hasWebhookSecret: !!process.env.MERCADOPAGO_WEBHOOK_SECRET
  });

  // === 2) Ignore test/test-mode webhooks (but allow them to bypass signature verification) ===
  if (body.live_mode === false) {
    console.log('[MP] Test webhook detected - bypassing signature verification');
    
    // Still process test webhooks but with limited functionality
    const topic = body.type || body.topic;
    if (topic !== 'payment') {
      console.log(`[MP] Test non-payment webhook ("${topic}") ignored`);
      return NextResponse.json(
        { success: true, message: `Test ignored topic: ${topic}` },
        { status: 200, headers: CORS_HEADERS }
      );
    }

    const paymentId = body.data?.id;
    if (!paymentId) {
      return NextResponse.json(
        { success: false, error: 'Missing payment ID in test webhook' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // For test webhooks, just return success without processing
    console.log('[MP] Test webhook processed successfully');
    return NextResponse.json(
      { success: true, message: 'Test webhook processed', test_mode: true },
      { status: 200, headers: CORS_HEADERS }
    );
  }

  // === 1) Signature verification (only for live webhooks) ===
  const signature = request.headers.get('X-Mercadopago-Signature');
  const requestId = request.headers.get('X-Request-Id');
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;

  if (!signature || !requestId || !secret) {
    console.error('[MP] Missing signature, request-id or secret');
    return NextResponse.json(
      { success: false, error: 'Webhook signature not present or misconfigured' },
      { status: 401, headers: CORS_HEADERS }
    );
  }

  const sigValid = verifyWebhookSignature(rawBody, signature, requestId, secret);
  if (!sigValid) {
    console.error('[MP] Invalid webhook signature');
    return NextResponse.json(
      { success: false, error: 'Invalid webhook signature' },
      { status: 401, headers: CORS_HEADERS }
    );
  }

  // === 3) Determine webhook type & payload ID ===
  const topic = body.type || body.topic;
  if (topic !== 'payment') {
    console.log(`[MP] Non-payment webhook ("${topic}") ignored`);
    return NextResponse.json(
      { success: true, message: `Ignored topic: ${topic}` },
      { status: 200, headers: CORS_HEADERS }
    );
  }

  const paymentId = body.data?.id;
  if (!paymentId) {
    return NextResponse.json(
      { success: false, error: 'Missing payment ID' },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  // === 4) Verify the payment with MercadoPago API ===
  const { success, payment, error } = await verifyPayment(paymentId);
  if (!success) {
    console.error('[MP] Payment verification failed:', error);
    return NextResponse.json(
      { success: false, error: 'Payment verification failed' },
      { status: 502, headers: CORS_HEADERS }
    );
  }

  // === 5) Match to your local PaymentIntent ===
  const externalRef = payment.external_reference;
  const refData = parseExternalReference(externalRef);
  if (!refData) {
    console.error('[MP] Invalid external_reference:', externalRef);
    return NextResponse.json(
      { success: false, error: 'Invalid external reference' },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const intent = await prisma.paymentIntent.findUnique({
    where: { externalReference: externalRef },
  });
  if (!intent) {
    console.error('[MP] No PaymentIntent for reference:', externalRef);
    return NextResponse.json(
      { success: false, error: 'Payment intent not found' },
      { status: 404, headers: CORS_HEADERS }
    );
  }

  // === 6) Update local record ===
  await prisma.paymentIntent.update({
    where: { id: intent.id },
    data: {
      status: payment.status,
      mercadoPagoPaymentId: payment.id.toString(),
      updatedAt: new Date(),
    },
  });
  console.log(`[MP] Updated intent #${intent.id} → status=${payment.status}`);

  // === 7) Side-effects for approved vs. failed ===
  if (payment.status === 'approved') {
    const subRes = await createSubscriptionSafely({
      userId: refData.userId,
      planId: refData.planId,
      paymentId: payment.id,
      amount: payment.transaction_amount,
      currency: payment.currency_id,
      context: 'webhook',
    });
    if (!subRes.success) {
      console.error('[MP] Subscription creation failed:', subRes.error);
      // but still return 200 so MP doesn't retry endlessly
    }
  } else if (['cancelled', 'rejected'].includes(payment.status)) {
    await prisma.paymentIntent.update({
      where: { id: intent.id },
      data: { status: 'failed', updatedAt: new Date() },
    });
    console.log(`[MP] Marked intent #${intent.id} as failed`);
  }

  return NextResponse.json(
    { success: true, message: 'Webhook processed' },
    { status: 200, headers: CORS_HEADERS }
  );
}

export async function POST(request) {
  try {
    return await handlePOST(request);
  } catch (err) {
    console.error('[MP] Uncaught error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { status: 'OK', message: 'Webhook endpoint active' },
    { status: 200, headers: CORS_HEADERS }
  );
}

export async function OPTIONS() {
  // Preflight
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
} 