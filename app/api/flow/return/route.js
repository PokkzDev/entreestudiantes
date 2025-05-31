import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const status = searchParams.get('status');
    
    // Build redirect URL with parameters
    const redirectUrl = new URL('/planes', request.url);
    
    if (token) {
      redirectUrl.searchParams.set('token', token);
    }
    
    if (status) {
      redirectUrl.searchParams.set('status', status);
    } else {
      // Default to success if no status provided
      redirectUrl.searchParams.set('status', 'success');
    }
    
    console.log('Flow.cl return redirect:', redirectUrl.toString());
    
    return NextResponse.redirect(redirectUrl.toString());
  } catch (error) {
    console.error('Error in Flow.cl return handler:', error);
    // Fallback redirect to planes page
    return NextResponse.redirect(new URL('/planes?status=error', request.url));
  }
}

export async function POST(request) {
  // Flow.cl might send POST requests, handle the same way as GET
  return GET(request);
} 