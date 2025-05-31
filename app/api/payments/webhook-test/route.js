import { NextResponse } from 'next/server';

// Force this route to be dynamic
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-signature, x-request-id',
};

export async function POST(request) {
  console.log('🧪 ==================== WEBHOOK TEST POST ====================');
  console.log('🧪 Timestamp:', new Date().toISOString());
  console.log('🧪 Method:', request.method);
  console.log('🧪 URL:', request.url);
  console.log('🧪 Headers:', Object.fromEntries(request.headers.entries()));
  
  try {
    const body = await request.text();
    console.log('🧪 Raw body:', body);
    
    if (body) {
      try {
        const parsed = JSON.parse(body);
        console.log('🧪 Parsed JSON:', JSON.stringify(parsed, null, 2));
      } catch (e) {
        console.log('🧪 Body is not valid JSON');
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Test webhook received successfully',
      timestamp: new Date().toISOString(),
      receivedData: body ? true : false
    });
    
  } catch (error) {
    console.error('🧪 Test webhook error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

export async function GET() {
  console.log('🧪 Test webhook GET request');
  return NextResponse.json({ 
    status: 'test webhook endpoint active',
    methods: ['GET', 'POST'],
    timestamp: new Date().toISOString()
  });
}

export async function OPTIONS() {
  console.log('🧪 Test webhook OPTIONS request');
  return new NextResponse(null, {
    status: 200,
    headers: CORS_HEADERS,
  });
} 