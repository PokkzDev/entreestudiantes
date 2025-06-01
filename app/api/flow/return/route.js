import { NextResponse } from 'next/server';

export async function GET(request) {
  console.log('🔄 Flow.cl GET return handler called');
  console.log('📍 Full URL:', request.url);
  console.log('📍 Method:', request.method);
  console.log('📍 Headers:', Object.fromEntries(request.headers.entries()));
  console.log('📍 Timestamp:', new Date().toISOString());
  
  try {
    const url = new URL(request.url);
    const { searchParams } = url;
    let token = searchParams.get('token');
    let status = searchParams.get('status');
    
    // Log all parameters Flow.cl is sending
    const allParams = {};
    for (const [key, value] of searchParams.entries()) {
      allParams[key] = value;
    }
    console.log('📥 All Flow.cl URL parameters received:', allParams);
    
    return await processFlowReturn(request, token, status, allParams);
  } catch (error) {
    console.error('❌ GET Error:', error);
    return await handleFlowError(request, error);
  }
}

export async function POST(request) {
  console.log('📨 Flow.cl POST return handler called');
  console.log('📍 Full URL:', request.url);
  console.log('📍 Method:', request.method);
  console.log('📍 Headers:', Object.fromEntries(request.headers.entries()));
  console.log('📍 Timestamp:', new Date().toISOString());
  
  try {
    const url = new URL(request.url);
    const { searchParams } = url;
    let token = searchParams.get('token');
    let status = searchParams.get('status');
    
    // Log all URL parameters
    const urlParams = {};
    for (const [key, value] of searchParams.entries()) {
      urlParams[key] = value;
    }
    console.log('📥 Flow.cl URL parameters:', urlParams);
    
    // Also check for parameters in POST body
    let bodyParams = {};
    try {
      const contentType = request.headers.get('content-type');
      console.log('📨 Content-Type:', contentType);
      
      if (contentType && contentType.includes('application/x-www-form-urlencoded')) {
        const body = await request.text();
        console.log('📨 Raw POST body:', body);
        console.log('📨 Body length:', body.length);
        
        if (body && body.trim()) {
          const formData = new URLSearchParams(body);
          for (const [key, value] of formData.entries()) {
            bodyParams[key] = value;
          }
          console.log('📥 Flow.cl POST body parameters:', bodyParams);
          
          // Use body parameters if they exist, otherwise fall back to URL parameters
          token = bodyParams.token || token;
          status = bodyParams.status || status;
        } else {
          console.log('📨 Empty POST body received');
        }
      } else {
        console.log('📨 Non-form content type or missing content type');
      }
    } catch (bodyError) {
      console.error('❌ Error parsing POST body:', bodyError);
    }
    
    // Combine all parameters for logging
    const allParams = { ...urlParams, ...bodyParams };
    console.log('📥 All Flow.cl parameters (URL + Body):', allParams);
    
    return await processFlowReturn(request, token, status, allParams);
  } catch (error) {
    console.error('❌ POST Error:', error);
    return await handleFlowError(request, error);
  }
}

async function processFlowReturn(request, token, status, allParams) {
  // Build redirect URL with more robust handling
  const url = new URL(request.url);
  const protocol = url.protocol || 'http:';
  const host = url.host || request.headers.get('host') || 'localhost:3000';
  
  // More robust baseUrl detection - prioritize the current request's host/port
  let baseUrl;
  
  // First priority: use the same host/port as the incoming request
  const requestHost = request.headers.get('host');
  const requestProtocol = request.headers.get('x-forwarded-proto') || url.protocol.replace(':', '') || 'http';
  
  if (requestHost) {
    baseUrl = `${requestProtocol}://${requestHost}`;
    console.log('🌐 Using request host for baseUrl:', baseUrl);
  } else if (process.env.NEXT_PUBLIC_APP_URL && process.env.NEXT_PUBLIC_APP_URL !== 'null' && process.env.NEXT_PUBLIC_APP_URL.trim() !== '') {
    baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    console.log('🌐 Using NEXT_PUBLIC_APP_URL for baseUrl:', baseUrl);
  } else if (process.env.NEXTAUTH_URL && process.env.NEXTAUTH_URL !== 'null' && process.env.NEXTAUTH_URL.trim() !== '') {
    baseUrl = process.env.NEXTAUTH_URL;
    console.log('🌐 Using NEXTAUTH_URL for baseUrl:', baseUrl);
  } else {
    // Fallback to constructing from request URL
    baseUrl = `${protocol}//${host}`;
    console.log('🌐 Using fallback baseUrl:', baseUrl);
  }
  
  // Clean up baseUrl
  baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
  
  console.log('🌐 Determined baseUrl:', baseUrl);
  
  // Validate baseUrl before proceeding
  try {
    new URL(baseUrl); // This will throw if invalid
  } catch (urlError) {
    console.error('❌ Invalid baseUrl detected:', baseUrl, urlError);
    // Fallback to constructing from request headers
    const hostHeader = request.headers.get('host');
    const protoHeader = request.headers.get('x-forwarded-proto') || 'http';
    baseUrl = `${protoHeader}://${hostHeader || 'localhost:3000'}`;
    console.log('🔄 Using fallback baseUrl:', baseUrl);
  }
  
  // Construct the final redirect URL
  const redirectPath = '/planes';
  const redirectUrl = new URL(redirectPath, baseUrl);
  
  // Handle different Flow.cl response scenarios
  if (token && token !== 'null' && token !== 'undefined') {
    console.log('✅ Token received from Flow.cl:', token.substring(0, 10) + '...');
    redirectUrl.searchParams.set('token', token);
  } else {
    console.log('⚠️ No token received from Flow.cl - this might be normal for sandbox or cancelled payments');
  }
  
  // Handle status parameter
  if (status && status !== 'null' && status !== 'undefined') {
    console.log('📊 Status received from Flow.cl:', status);
    redirectUrl.searchParams.set('status', status);
  } else {
    console.log('⚠️ No status received from Flow.cl - setting default');
    redirectUrl.searchParams.set('status', 'unknown');
  }
  
  // If we have no token but got some other parameters, it might be a cancellation or error
  if (!token && Object.keys(allParams).length === 0) {
    console.log('⚠️ No parameters received - likely a direct access or cancellation');
    redirectUrl.searchParams.set('status', 'cancelled');
    redirectUrl.searchParams.set('message', 'cancelled_or_direct_access');
  } else if (!token && status) {
    console.log('ℹ️ Status without token - this is normal for some Flow.cl scenarios');
    // Add a flag to indicate this came from Flow.cl but without token
    redirectUrl.searchParams.set('flow_return', 'true');
  }
  
  const finalUrl = redirectUrl.toString();
  console.log('🎯 Final redirect URL:', finalUrl);
  
  // Final validation
  if (!finalUrl || finalUrl.includes('null') || finalUrl.includes('undefined')) {
    throw new Error('Final URL contains invalid values');
  }
  
  console.log('✅ Redirecting user to planes page');
  return NextResponse.redirect(finalUrl, { status: 307 });
}

async function handleFlowError(request, error) {
  console.error('❌ Error in Flow.cl return handler:', error);
  console.error('🔍 Request URL:', request.url);
  console.error('🔍 Error details:', {
    name: error.name,
    message: error.message,
    stack: error.stack
  });
  
  // More robust error handling with absolute fallback
  try {
    const hostHeader = request.headers.get('host') || 'localhost:3000';
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const fallbackUrl = `${protocol}://${hostHeader}/planes?status=error&error=redirect_failed&message=flow_return_error`;
    
    console.log('🆘 Using error fallback URL:', fallbackUrl);
    return NextResponse.redirect(fallbackUrl, { status: 307 });
    
  } catch (fallbackError) {
    console.error('💥 Fallback redirect also failed:', fallbackError);
    
    // Return HTML response with JavaScript redirect as last resort
    const htmlResponse = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Redirecting...</title>
        <script>
          console.log('Flow.cl return redirect fallback');
          try {
            window.location.href = '/planes?status=error&error=redirect_failed&message=fallback_redirect';
          } catch (e) {
            console.error('Redirect failed:', e);
            document.body.innerHTML = '<p>Redirect failed. Please <a href="/planes">click here</a> to continue.</p>';
          }
        </script>
      </head>
      <body>
        <p>Redirecting from Flow.cl... If you are not redirected automatically, <a href="/planes">click here</a>.</p>
      </body>
      </html>
    `;
    
    return new NextResponse(htmlResponse, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
      },
    });
  }
} 