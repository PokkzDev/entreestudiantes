/**
 * MercadoPago Configuration Helper
 * This file helps debug and verify MercadoPago configuration
 */

export function getMercadoPagoConfig() {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  const publicKey = process.env.MERCADOPAGO_PUBLIC_KEY;
  const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  
  if (!accessToken) {
    throw new Error('MERCADOPAGO_ACCESS_TOKEN is not configured');
  }
  
  if (!publicKey) {
    throw new Error('MERCADOPAGO_PUBLIC_KEY is not configured');
  }
  
  const isTestEnvironment = accessToken.includes('TEST');
  const isPublicKeyTest = publicKey.includes('TEST');
  
  // Verify that both tokens are from the same environment
  if (isTestEnvironment !== isPublicKeyTest) {
    throw new Error(
      `Token environment mismatch: Access token is ${isTestEnvironment ? 'TEST' : 'PRODUCTION'} ` +
      `but public key is ${isPublicKeyTest ? 'TEST' : 'PRODUCTION'}. ` +
      'Both tokens must be from the same environment.'
    );
  }
  
  return {
    environment: isTestEnvironment ? 'test' : 'production',
    hasAccessToken: !!accessToken,
    hasPublicKey: !!publicKey,
    hasWebhookSecret: !!webhookSecret,
    accessTokenPrefix: accessToken.substring(0, 12) + '...',
    publicKeyPrefix: publicKey.substring(0, 12) + '...',
    isConfigurationValid: true
  };
}

export function validateMercadoPagoSetup() {
  try {
    const config = getMercadoPagoConfig();
    console.log('✅ MercadoPago Configuration:', config);
    return config;
  } catch (error) {
    console.error('❌ MercadoPago Configuration Error:', error.message);
    throw error;
  }
}

export function getEnvironmentWarnings() {
  const config = getMercadoPagoConfig();
  const warnings = [];
  
  if (config.environment === 'test') {
    warnings.push({
      type: 'warning',
      message: 'You are using MercadoPago TEST environment. Payments will not be real.'
    });
  }
  
  if (!config.hasWebhookSecret) {
    warnings.push({
      type: 'warning', 
      message: 'MERCADOPAGO_WEBHOOK_SECRET is not configured. Webhook signature verification is disabled.'
    });
  }
  
  if (process.env.NODE_ENV === 'production' && config.environment === 'test') {
    warnings.push({
      type: 'error',
      message: 'PRODUCTION environment is using TEST MercadoPago tokens! This should be changed before going live.'
    });
  }
  
  return warnings;
} 