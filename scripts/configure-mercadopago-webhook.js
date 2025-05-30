const mercadopago = require('mercadopago');

// Configurar MercadoPago
mercadopago.configure({
  access_token: process.env.MERCADOPAGO_ACCESS_TOKEN,
});

async function configureWebhook() {
  console.log('🔧 Configurando webhook de MercadoPago...\n');
  
  // Tu URL base (cambia esto por tu dominio real)
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tu-dominio.com';
  const webhookUrl = `${baseUrl}/api/payments/webhook`;
  
  console.log('📍 URL del webhook que se configurará:', webhookUrl);
  
  try {
    // Primero, obtener webhooks existentes
    console.log('\n🔍 Obteniendo webhooks existentes...');
    
    const existingWebhooks = await mercadopago.webhooks.list();
    console.log('Webhooks existentes:', existingWebhooks.body);
    
    // Configuración del webhook
    const webhookConfig = {
      url: webhookUrl,
      events: [
        'payment' // Eventos de pago
      ]
    };
    
    console.log('\n🆕 Creando nuevo webhook...');
    console.log('Configuración:', JSON.stringify(webhookConfig, null, 2));
    
    const webhook = await mercadopago.webhooks.create(webhookConfig);
    
    console.log('✅ Webhook creado exitosamente!');
    console.log('ID del webhook:', webhook.body.id);
    console.log('URL configurada:', webhook.body.url);
    console.log('Eventos:', webhook.body.events);
    
    return webhook.body;
    
  } catch (error) {
    console.error('❌ Error configurando webhook:', error.message);
    if (error.response) {
      console.error('Respuesta de la API:', error.response.data);
    }
    return null;
  }
}

async function testWebhookEndpoint() {
  console.log('\n🧪 Probando endpoint de webhook...');
  
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tu-dominio.com';
  const webhookUrl = `${baseUrl}/api/payments/webhook`;
  
  try {
    // Probar con GET primero
    console.log('🔍 Probando GET request...');
    const getResponse = await fetch(webhookUrl, {
      method: 'GET'
    });
    
    console.log(`GET response: ${getResponse.status} ${getResponse.statusText}`);
    
    // Probar con POST
    console.log('🔍 Probando POST request...');
    const postResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'test',
        data: { id: 'test-123' }
      })
    });
    
    console.log(`POST response: ${postResponse.status} ${postResponse.statusText}`);
    
    if (postResponse.status === 405) {
      console.log('\n❌ ERROR 405 detectado!');
      console.log('Posibles soluciones:');
      console.log('1. Verificar que el archivo route.js exporta una función POST');
      console.log('2. Asegurar que el servidor Next.js está corriendo');
      console.log('3. Verificar configuración de proxy/CDN');
    } else if (postResponse.ok) {
      console.log('✅ Endpoint funcionando correctamente');
    }
    
  } catch (error) {
    console.error('❌ Error probando endpoint:', error.message);
  }
}

// Configuración paso a paso
async function setupWebhooks() {
  console.log('🚀 CONFIGURACIÓN DE WEBHOOKS MERCADOPAGO\n');
  
  // Verificar variables de entorno
  if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
    console.error('❌ MERCADOPAGO_ACCESS_TOKEN no está configurado');
    console.log('Configura esta variable en tu archivo .env.local');
    return;
  }
  
  if (!process.env.NEXT_PUBLIC_SITE_URL) {
    console.warn('⚠️ NEXT_PUBLIC_SITE_URL no está configurado');
    console.log('Usando URL por defecto. Configura tu dominio real en .env.local');
  }
  
  // Probar endpoint primero
  await testWebhookEndpoint();
  
  // Configurar webhook
  const webhook = await configureWebhook();
  
  if (webhook) {
    console.log('\n📋 RESUMEN DE CONFIGURACIÓN:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Webhook ID: ${webhook.id}`);
    console.log(`URL: ${webhook.url}`);
    console.log(`Eventos: ${webhook.events.join(', ')}`);
    console.log('\n📝 PASOS SIGUIENTES:');
    console.log('1. Copia la URL del webhook en el dashboard de MercadoPago');
    console.log('2. Prueba el webhook usando el simulador de MercadoPago');
    console.log('3. Verifica los logs en tu aplicación');
  }
}

setupWebhooks().catch(console.error); 