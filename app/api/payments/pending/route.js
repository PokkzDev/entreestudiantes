import { NextResponse } from 'next/server';

export async function GET(request) {
  const url = new URL(request.url);
  const paymentId = url.searchParams.get('payment_id');
  const status = url.searchParams.get('status');
  const externalReference = url.searchParams.get('external_reference');
  
  // Log the payment pending
  console.log('Payment pending:', { paymentId, status, externalReference });
  
  // Redirect to plans page with pending message
  const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/planes?payment=pending&payment_id=${paymentId}`;
  return NextResponse.redirect(redirectUrl);
} 