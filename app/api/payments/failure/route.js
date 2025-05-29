import { NextResponse } from 'next/server';

export async function GET(request) {
  const url = new URL(request.url);
  const paymentId = url.searchParams.get('payment_id');
  const status = url.searchParams.get('status');
  const externalReference = url.searchParams.get('external_reference');
  
  // Log the payment failure
  console.log('Payment failure:', { paymentId, status, externalReference });
  
  // Redirect to plans page with error message
  const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/planes?payment=error&payment_id=${paymentId}`;
  return NextResponse.redirect(redirectUrl);
} 