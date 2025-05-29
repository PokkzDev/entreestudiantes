import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { pathname, userAgent, ip, timestamp } = await request.json();
    
    // Log security event (in production, you'd want to use a proper logging service)
    console.warn('SECURITY ALERT - Suspicious request blocked:', {
      pathname,
      userAgent,
      ip,
      timestamp: timestamp || new Date().toISOString()
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error logging security event:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
} 