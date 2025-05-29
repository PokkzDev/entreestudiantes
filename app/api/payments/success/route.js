import { NextResponse } from 'next/server';
import { redirect } from 'next/navigation';

export async function GET(request) {
  const url = new URL(request.url);
  const paymentId = url.searchParams.get('payment_id');
  const status = url.searchParams.get('status');
  const externalReference = url.searchParams.get('external_reference');
  
  // Log the payment success
  console.log('Payment success:', { paymentId, status, externalReference });
  
  // Redirect to plans page with success message
  const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/planes?payment=success&payment_id=${paymentId}`;
  return NextResponse.redirect(redirectUrl);
} 