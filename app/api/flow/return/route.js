import { NextResponse } from 'next/server';
import crypto from 'crypto';

// Flow.cl configuration
const FLOW_CONFIG = {
  apiKey: process.env.FLOW_API_KEY,
  secretKey: process.env.FLOW_API_SECRET,
  apiUrl: process.env.FLOW_API_URL || 'https://sandbox.flow.cl/api'
};

// Generate Flow.cl signature
function generateSignature(params, secretKey) {
  // Sort parameters by key (alphabetically)
  const sortedKeys = Object.keys(params).sort();
  
  // Concatenate as: keyvalue keyvalue (without separators)
  const stringToSign = sortedKeys
    .map(key => `${key}${params[key]}`)
    .join('');
  
  // Create HMAC SHA256 signature
  return crypto
    .createHmac('sha256', secretKey)
    .update(stringToSign)
    .digest('hex');
}

// Get payment status from Flow.cl API
async function getPaymentStatus(token) {
  try {
    const statusParams = {
      apiKey: FLOW_CONFIG.apiKey,
      token
    };

    const signature = generateSignature(statusParams, FLOW_CONFIG.secretKey);
    statusParams.s = signature;

    // Try extended status first (more reliable)
    console.log('🔍 Trying Flow.cl extended status API...');
    let flowResponse = await fetch(`${FLOW_CONFIG.apiUrl}/payment/getStatusExtended`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(statusParams)
    });

    if (!flowResponse.ok) {
      console.log('⚠️ Extended status failed, trying regular status API...');
      // Fallback to regular status endpoint
      flowResponse = await fetch(`${FLOW_CONFIG.apiUrl}/payment/getStatus`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(statusParams)
      });
    }

    if (!flowResponse.ok) {
      const errorText = await flowResponse.text();
      console.error('Flow.cl status check failed:', errorText);
      return null;
    }

    const paymentStatus = await flowResponse.json();
    console.log('📊 Flow.cl payment status response:', paymentStatus);
    
    // Check if there's an error in the response
    if (paymentStatus.code && paymentStatus.message) {
      console.error('Flow.cl API error:', paymentStatus);
      return null;
    }
    
    // Convert Flow.cl status to our status
    switch (paymentStatus.status) {
      case 1: return 'pending';
      case 2: return 'success';
      case 3: return 'failed';
      case 4: return 'cancelled';
      case 5: return 'refunded';
      default: return null; // Return null to trigger fallback logic
    }
  } catch (error) {
    console.error('Error checking payment status:', error);
    return null;
  }
}

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
    // Check for Server Actions errors and handle them gracefully
    const origin = request.headers.get('origin');
    const forwardedHost = request.headers.get('x-forwarded-host');
    
    if (origin && forwardedHost && origin !== `https://${forwardedHost}`) {
      console.log('🔍 Cross-origin request detected:', { origin, forwardedHost });
      console.log('🔄 This is normal for Flow.cl integration through Cloudflare tunneling');
    }
    
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
      
      // Handle specific Server Actions error
      if (bodyError.message && bodyError.message.includes('Invalid Server Actions request')) {
        console.log('🔧 Server Actions error detected - likely cross-origin issue');
        console.log('🔄 Continuing with URL parameters only');
        // Continue processing with URL parameters only
      } else {
        throw bodyError;
      }
    }
    
    // Combine all parameters for logging
    const allParams = { ...urlParams, ...bodyParams };
    console.log('📥 All Flow.cl parameters (URL + Body):', allParams);
    
    return await processFlowReturn(request, token, status, allParams);
  } catch (error) {
    console.error('❌ POST Error:', error);
    
    // Handle Server Actions error specifically
    if (error.message && error.message.includes('Invalid Server Actions request')) {
      console.log('🔧 Handling Server Actions cross-origin error gracefully');
      
      // Extract token from URL if available as fallback
      try {
        const url = new URL(request.url);
        const token = url.searchParams.get('token');
        const status = url.searchParams.get('status') || 'unknown';
        
        console.log('🔄 Fallback processing with URL params:', { token, status });
        
        if (token) {
          return await processFlowReturn(request, token, status, { token, status });
        }
      } catch (fallbackError) {
        console.error('❌ Fallback processing failed:', fallbackError);
      }
    }
    
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
  
  // Handle status parameter - if not provided, check with Flow.cl API
  let finalStatus = status;
  if (!status || status === 'null' || status === 'undefined') {
    if (token && token !== 'null' && token !== 'undefined') {
      console.log('🔍 No status provided, checking payment status with Flow.cl API...');
      const checkedStatus = await getPaymentStatus(token);
      if (checkedStatus) {
        finalStatus = checkedStatus;
        console.log('📊 Payment status from Flow.cl API:', checkedStatus);
      } else {
        console.log('⚠️ Could not get status from Flow.cl API');
        // CRITICAL FIX: Do NOT default to success when status is unknown
        // This was causing failed sandbox payments to be treated as successful
        // Instead, set to 'unknown' and let the verification endpoint handle it properly
        finalStatus = 'unknown';
        console.log('🚨 Setting status to "unknown" - verification endpoint will determine actual status');
      }
    } else {
      console.log('⚠️ No token and no status - setting as cancelled');
      finalStatus = 'cancelled';
    }
  } else {
    console.log('📊 Status received from Flow.cl:', status);
  }
  
  redirectUrl.searchParams.set('status', finalStatus);
  
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
  
  // Check if origin is null, which can cause issues with Next.js redirects
  const origin = request.headers.get('origin');
  console.log('🔍 Request origin:', origin);
  
  if (origin === 'null' || !origin) {
    console.log('⚠️ Origin is null, using HTML redirect instead of NextResponse.redirect');
    
    // Use HTML response with JavaScript redirect as a workaround for null origin
    const htmlResponse = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Procesando pago...</title>
        <meta http-equiv="refresh" content="3; url=${finalUrl}">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            color: #1e293b;
            text-align: center;
            padding: 2rem;
          }
          .container {
            background: white;
            padding: 3rem 2rem;
            border-radius: 20px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
            max-width: 400px;
            width: 100%;
          }
          .spinner {
            width: 40px;
            height: 40px;
            border: 3px solid #e2e8f0;
            border-top: 3px solid #6366f1;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 1.5rem;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          h1 {
            margin: 0 0 1rem 0;
            color: #1e293b;
            font-size: 1.5rem;
          }
          p {
            margin: 0.5rem 0;
            color: #64748b;
            line-height: 1.6;
          }
          .countdown {
            font-weight: bold;
            color: #6366f1;
          }
          a {
            color: #6366f1;
            text-decoration: none;
            font-weight: 600;
          }
          a:hover {
            text-decoration: underline;
          }
        </style>
        <script>
          let countdown = 3;
          
          function updateCountdown() {
            const countdownEl = document.getElementById('countdown');
            if (countdownEl) {
              countdownEl.textContent = countdown;
            }
            
            if (countdown <= 0) {
              console.log('Flow.cl return redirect (countdown complete)');
              try {
                window.location.replace('${finalUrl}');
              } catch (e) {
                console.error('Redirect failed:', e);
                window.location.href = '${finalUrl}';
              }
            } else {
              countdown--;
              setTimeout(updateCountdown, 1000);
            }
          }
          
          document.addEventListener('DOMContentLoaded', function() {
            console.log('Flow.cl return redirect page loaded');
            updateCountdown();
          });
        </script>
      </head>
      <body>
        <div class="container">
          <div class="spinner"></div>
          <h1>Procesando tu pago...</h1>
          <p>Tu pago ha sido procesado exitosamente.</p>
          <p>Serás redirigido automáticamente en <span id="countdown" class="countdown">3</span> segundos.</p>
          <p>Si no eres redirigido automáticamente, <a href="${finalUrl}">haz clic aquí</a>.</p>
        </div>
      </body>
      </html>
    `;
    
    return new NextResponse(htmlResponse, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  }
  
  // For normal origins, use standard redirect
  const response = NextResponse.redirect(finalUrl, { status: 307 });
  
  // Add headers to help with the redirect
  response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  
  return response;
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
        <title>Redirigiendo...</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            color: #1e293b;
            text-align: center;
            padding: 2rem;
          }
          .container {
            background: white;
            padding: 3rem 2rem;
            border-radius: 20px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
            max-width: 400px;
            width: 100%;
          }
          .spinner {
            width: 40px;
            height: 40px;
            border: 3px solid #e2e8f0;
            border-top: 3px solid #6366f1;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 1.5rem;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          h1 {
            margin: 0 0 1rem 0;
            color: #1e293b;
            font-size: 1.5rem;
          }
          p {
            margin: 0.5rem 0;
            color: #64748b;
            line-height: 1.6;
          }
          a {
            color: #6366f1;
            text-decoration: none;
            font-weight: 600;
          }
          a:hover {
            text-decoration: underline;
          }
        </style>
        <script>
          console.log('Flow.cl return redirect fallback');
          setTimeout(function() {
            try {
              window.location.href = '/planes?status=error&error=redirect_failed&message=fallback_redirect';
            } catch (e) {
              console.error('Redirect failed:', e);
              document.body.innerHTML = '<div class="container"><p>Error de redirección. Por favor <a href="/planes">haz clic aquí</a> para continuar.</p></div>';
            }
          }, 2000);
        </script>
      </head>
      <body>
        <div class="container">
          <div class="spinner"></div>
          <h1>Redirigiendo...</h1>
          <p>Procesando la respuesta de Flow.cl...</p>
          <p>Si no eres redirigido automáticamente, <a href="/planes">haz clic aquí</a> para continuar.</p>
        </div>
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