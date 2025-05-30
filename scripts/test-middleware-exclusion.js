// Test if the middleware matcher excludes the webhook endpoint correctly
function testMiddlewareMatcher() {
  const matcher = /((?!api\/auth|api\/register|api\/resend-verification|api\/complete-registration|api\/allowed-domains|api\/busqueda|api\/publicacion|api\/check-session|api\/check-verified|api\/payments|api\/verify-turnstile|api\/cron|api\/update-session|_next\/static|_next\/image|favicon\.ico|pageImages|images).*)/;
  
  const testPaths = [
    '/api/payments/webhook',
    '/api/payments/create-preference', 
    '/api/payments/success',
    '/api/payments/failure',
    '/api/auth/signin',
    '/api/register',
    '/configuraciones',
    '/mis-publicaciones',
    '/',
    '/login'
  ];
  
  console.log('Testing middleware matcher pattern:');
  console.log('Pattern:', matcher.source);
  console.log('\nResults (true = middleware WILL run, false = middleware WILL NOT run):');
  
  testPaths.forEach(path => {
    const matches = matcher.test(path);
    console.log(`${path.padEnd(35)} -> ${matches ? 'PROTECTED' : 'EXCLUDED'}`);
  });
}

testMiddlewareMatcher(); 