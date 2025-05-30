# 🚀 Instrucciones de Deploy - Webhook MercadoPago

## ✅ Cambios realizados y commiteados

Los siguientes cambios han sido aplicados y están listos para deploy:

### 📝 Archivos modificados:
- `app/api/payments/webhook/route.js` - Mejoras en el manejo de simulaciones
- `app/api/payments/webhook-test/route.js` - Nuevo endpoint de prueba
- `scripts/test-production-webhook.js` - Script de diagnóstico

### 🔧 Mejoras implementadas:
1. **Mejor manejo de simulaciones**: El webhook ahora detecta y maneja correctamente las simulaciones de MercadoPago (payment ID "123456")
2. **Logging mejorado**: Más información de debugging para identificar problemas
3. **Endpoint de prueba**: `/api/payments/webhook-test` para diagnósticos
4. **Manejo robusto de errores**: Mejor gestión de casos edge

## 🚀 Pasos para deployar al servidor

### Opción 1: Deploy automático con PM2
```bash
npm run deploy
```

### Opción 2: Deploy completo (reinicia todo)
```bash
npm run deploy:fresh
```

### Opción 3: Deploy manual
```bash
# En el servidor de producción:
git pull origin main
npm run build
pm2 restart entreestudiantes
```

## 🧪 Verificación post-deploy

Después del deploy, ejecuta el script de verificación:
```bash
node scripts/test-production-webhook.js
```

**Resultado esperado:**
- GET request: 200 ✅
- POST request: 200 ✅ (ya no debería ser 400)
- Test endpoint: 200 ✅

## 🎯 Prueba en MercadoPago

Una vez deployado, vuelve a probar la simulación en el dashboard de MercadoPago:

1. Ve a tu dashboard de MercadoPago
2. Navega a Webhooks
3. Encuentra tu webhook: `https://entreestudiantes.cl/api/payments/webhook`
4. Ejecuta la simulación
5. **Debería funcionar ahora** ✅

## 📊 Logs para monitoring

Después del deploy, puedes monitorear los logs con:
```bash
npm run logs
# o
pm2 logs entreestudiantes
```

## 🚨 Si algo sale mal

### Rollback rápido:
```bash
git checkout HEAD~1
npm run deploy
```

### Verificar estado del servidor:
```bash
npm run pm2:status
```

### Reiniciar servicio:
```bash
npm run pm2:restart
```

## ✅ Checklist post-deploy

- [ ] Deploy ejecutado sin errores
- [ ] Script de verificación pasando (200 OK)
- [ ] MercadoPago webhook simulation funcionando
- [ ] Logs del servidor mostrando actividad del webhook
- [ ] Endpoint de prueba respondiendo correctamente

---

**Nota:** Los cambios locales ya funcionan perfectamente. El problema era que la versión en producción no tenía las mejoras más recientes. 