# Flow.cl Testing Guide

This guide explains how to test your Flow.cl integration using the sandbox environment and test cards.

## 🔧 Sandbox Configuration

Ensure your `.env` file has the correct sandbox configuration:

```bash
FLOW_API_URL=https://sandbox.flow.cl/api
FLOW_ENVIRONMENT=sandbox
```

## 💳 Test Cards for Chile

### Valid Test Card (Successful Payment)
- **Card Number**: `4051885600446623`
- **Expiration Year**: Any future year
- **Expiration Month**: Any month
- **CVV**: `123`

### Bank Simulation Credentials
When redirected to the bank simulation:
- **RUT**: `11111111-1`
- **Password**: `123`

## 💳 Test Cards for Peru and Mexico

### Valid Test Card
- **Card Number**: `5293138086430769`
- **Expiration Year**: Any future year
- **Expiration Month**: Any month
- **CVV**: `123`

## 🧪 Testing Scenarios

### 1. Successful Payment Flow

1. **Create Payment**: POST to `/api/flow/create-payment`
   ```json
   {
     "planId": "premium"
   }
   ```

2. **Expected Response**:
   ```json
   {
     "success": true,
     "url": "https://sandbox.flow.cl/app/web/pay.php",
     "token": "payment-token",
     "commerceOrder": "ENT-timestamp-random",
     "amount": 2990,
     "planId": "premium"
   }
   ```

3. **Complete Payment**: 
   - Open the returned URL
   - Use the test card details
   - Complete bank authentication with test credentials

4. **Verify Payment**: POST to `/api/flow/verify`
   ```json
   {
     "token": "payment-token-from-step-2"
   }
   ```

5. **Expected Response**:
   ```json
   {
     "success": true,
     "subscriptionUpdated": true,
     "planId": "premium",
     "planName": "Premium",
     "amount": 2990,
     "commerceOrder": "ENT-timestamp-random"
   }
   ```

### 2. Alternative Payment Methods (Simulated)

The following payment methods have simulators in sandbox:
- **Servipag**: Click "Accept" in simulator
- **Multicaja**: Click "Accept" in simulator  
- **Mach**: Click "Accept" in simulator
- **Cryptocompra**: Click "Accept" in simulator

### 3. Error Scenarios

#### Payment Rejection Testing
To test payment rejections, you can:
1. Use invalid card details (other than the provided test cards)
2. Cancel the payment in the Flow.cl interface
3. Use expired test cards

#### Expected Error Codes and Messages
Your enhanced implementation now handles these error codes:

| Code | Description |
|------|-------------|
| -1   | Tarjeta inválida |
| -2   | Error de conexión |
| -3   | Excede monto máximo |
| -4   | Fecha de expiración inválida |
| -5   | Problema en autenticación |
| -6   | Rechazo general |
| -7   | Tarjeta bloqueada |
| -8   | Tarjeta vencida |
| -9   | Transacción no soportada |
| -10  | Problema en la transacción |
| -11  | Excede límite de reintentos |
| 999  | Error desconocido |

### 4. Webhook Testing

Your webhook endpoint (`/api/flow/webhook`) will receive notifications from Flow.cl. To test:

1. **ngrok for Local Testing** (if testing locally):
   ```bash
   ngrok http 3000
   ```
   Then update your webhook URL in Flow.cl account to the ngrok URL.

2. **Check Server Logs**: Monitor your server console for webhook notifications:
   ```
   Flow.cl webhook received: { token: "...", status: "2" }
   Payment status received: { status: 2, amount: 2990, commerceOrder: "..." }
   Successfully updated subscription for user [userId] to plan [planId]
   ```

## 🔍 Debugging Tools

### 1. Check Payment Status Manually

You can check any payment status using the token:

```bash
curl -X POST https://sandbox.flow.cl/api/payment/getStatusExtended \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "apiKey=YOUR_API_KEY&token=PAYMENT_TOKEN&s=GENERATED_SIGNATURE"
```

### 2. Enhanced Error Logging

Your implementation now uses `getStatusExtended` which provides:
- Basic payment status
- Detailed error codes for failed attempts
- Additional debugging information

### 3. Database Verification

Check that subscriptions are properly updated:

```sql
-- Check user subscription
SELECT subscriptionTier, subscriptionActive, subscriptionEndDate 
FROM User 
WHERE id = 'user-id';

-- Check payment logs
SELECT * FROM PaymentLog 
WHERE userId = 'user-id' 
ORDER BY paymentDate DESC;
```

## 📋 Testing Checklist

- [ ] **Environment Setup**
  - [ ] Sandbox credentials configured
  - [ ] Webhook URL accessible
  - [ ] Database connection working

- [ ] **Payment Creation**
  - [ ] Create payment endpoint works
  - [ ] Correct redirect URL returned
  - [ ] Payment appears in Flow.cl dashboard

- [ ] **Payment Completion**
  - [ ] Test card payment works
  - [ ] Bank simulation completes
  - [ ] Webhook received and processed

- [ ] **Payment Verification**
  - [ ] Verify endpoint returns correct status
  - [ ] User subscription updated in database
  - [ ] Payment logged correctly

- [ ] **Error Handling**
  - [ ] Invalid payments rejected properly
  - [ ] Error codes displayed correctly
  - [ ] Failed payments logged with details

- [ ] **Alternative Payment Methods**
  - [ ] Servipag simulation works
  - [ ] Other payment methods functional

## 🚀 Production Deployment

When ready for production:

1. **Update Environment Variables**:
   ```bash
   FLOW_API_URL=https://www.flow.cl/api
   FLOW_ENVIRONMENT=production
   # Update API_KEY and API_SECRET with production credentials
   ```

2. **Update Webhook URL**: Change to your production domain in Flow.cl account

3. **SSL Certificate**: Ensure your domain has a valid SSL certificate

4. **Test with Real Cards**: Use real payment methods for final testing

5. **Database Migration**: Run the database migration to add the new flowOrder field:
   ```bash
   npx prisma db push
   ```

## 🆕 New Features Added

### Enhanced Error Handling
- **Extended Status Services**: Uses `getStatusExtended` for detailed payment information
- **Specific Error Codes**: Maps Flow.cl error codes to Spanish descriptions
- **Payment Media Details**: Shows card type, last 4 digits, installments, etc.

### New API Endpoint: `/api/flow/get-payment-status`
Utility endpoint for administrators to check payment status:

```javascript
// By token
POST /api/flow/get-payment-status
{
  "token": "payment-token"
}

// By commerce order
POST /api/flow/get-payment-status
{
  "commerceOrder": "ENT-1234567890-123"
}

// By Flow order number
POST /api/flow/get-payment-status
{
  "flowOrder": "3567899"
}
```

**Response**:
```json
{
  "success": true,
  "paymentInfo": {
    "flowOrder": 3567899,
    "commerceOrder": "ENT-1234567890-123",
    "status": 2,
    "statusMessage": "Pago aprobado",
    "amount": 2990,
    "currency": "CLP",
    "payer": "test@entreestudiantes.cl",
    "paymentDetails": {
      "media": "webpay",
      "mediaType": "Crédito",
      "cardLast4Numbers": "9876",
      "installments": 3,
      "authorizationCode": "123456",
      "transferDate": "2024-01-24"
    }
  }
}
```

### New API Endpoint: `/api/flow/get-transactions`
Administrative endpoint for daily transaction reports:

```javascript
POST /api/flow/get-transactions
{
  "date": "2024-01-15",
  "start": 0,
  "limit": 50
}
```

**Response**:
```json
{
  "success": true,
  "date": "2024-01-15",
  "summary": {
    "totalTransactions": 45,
    "currentPage": 1,
    "totalPages": 1,
    "approvedAmount": 89700,
    "statusSummary": {
      "2": {
        "count": 30,
        "amount": 89700,
        "statusMessage": "Pago aprobado"
      },
      "3": {
        "count": 15,
        "amount": 44850,
        "statusMessage": "Pago rechazado"
      }
    }
  },
  "transactions": [...],
  "pagination": {
    "start": 0,
    "limit": 50,
    "total": 45,
    "hasMore": false
  }
}
```

### New API Endpoint: `/api/flow/create-email-payment`
Creates email-based payment orders:

```javascript
POST /api/flow/create-email-payment
{
  "planId": "premium",
  "email": "customer@example.com",
  "timeout": 86400,
  "forwardDaysAfter": 3,
  "forwardTimes": 2
}
```

**Response**:
```json
{
  "success": true,
  "message": "Cobro por email enviado a customer@example.com",
  "paymentInfo": {
    "token": "payment-token",
    "flowOrder": 3567899,
    "commerceOrder": "ENT-EMAIL-1234567890-123",
    "amount": 2990,
    "email": "customer@example.com",
    "followUp": {
      "forwardDaysAfter": 3,
      "forwardTimes": 2
    },
    "timeout": 86400
  }
}
```

### Enhanced `/api/flow/create-payment`
Now supports additional parameters:

```javascript
POST /api/flow/create-payment
{
  "planId": "premium",
  "paymentMethod": 9,  // 9 = all methods, or specific method ID
  "timeout": 3600      // Payment expires in 1 hour
}
```

**Response**:
```json
{
  "success": true,
  "url": "https://sandbox.flow.cl/app/web/pay.php",
  "token": "payment-token",
  "flowOrder": 3567899,
  "commerceOrder": "ENT-1234567890-123",
  "amount": 2990,
  "paymentMethod": 9,
  "timeout": 3600,
  "expiresAt": "2024-01-15T15:30:00.000Z"
}
```

### Enhanced Logging
All payment operations now log detailed information:
- Payment media type (Webpay, Multicaja, etc.)
- Card details (last 4 digits, installments)
- Specific error codes and messages
- Flow order numbers
- Email payment tracking and follow-ups

## 🔄 Testing Refunds

### 1. Creating Refunds

Test refund creation using a completed payment:

```javascript
POST /api/flow/create-refund
{
  "receiverEmail": "customer@email.com",
  "amount": 1495,  // Half refund for testing
  "commerceTrxId": "ENT-1234567890-123",
  "reason": "Customer request - testing"
}
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Reembolso creado para customer@email.com",
  "refundInfo": {
    "token": "refund-token",
    "flowRefundOrder": 122767,
    "status": "created",
    "amount": 1495,
    "fee": 30
  }
}
```

### 2. Checking Refund Status

```javascript
POST /api/flow/get-refund-status
{
  "token": "refund-token-from-step-1"
}
```

### 3. Cancelling Refunds

```javascript
POST /api/flow/cancel-refund
{
  "token": "refund-token-from-step-1"
}
```

### 4. Refund Webhook Testing

The refund webhook (`/api/flow/refund-webhook`) receives notifications when:
- Customer accepts/rejects the refund
- Refund is completed
- Refund expires

**Monitor server logs for refund updates**:
```
Refund status received: { token: "...", status: "accepted", amount: 1495 }
Refund accepted: 122767 - Amount: 1495
```

### 5. Database Verification

Check refund logs in database:

```sql
-- Check refund logs
SELECT * FROM RefundLog 
ORDER BY createdAt DESC;

-- Check refund for specific payment
SELECT r.*, p.commerceOrder as originalPayment
FROM RefundLog r
LEFT JOIN PaymentLog p ON r.originalCommerceOrder = p.commerceOrder
WHERE r.receiverEmail = 'customer@email.com';
```

### Refund Testing Checklist

- [ ] **Refund Creation**
  - [ ] Create refund for completed payment
  - [ ] Validate required parameters
  - [ ] Check original payment lookup
  - [ ] Verify refund appears in Flow.cl dashboard

- [ ] **Refund Status**
  - [ ] Check refund status endpoint
  - [ ] Verify status transitions
  - [ ] Test webhook notifications

- [ ] **Refund Management**
  - [ ] Cancel pending refunds
  - [ ] Admin access controls
  - [ ] Refund reason tracking

- [ ] **Database Integration**
  - [ ] Refund logs created correctly
  - [ ] Original payment linkage
  - [ ] Status updates via webhook

## 📊 New Database Schema

The RefundLog table tracks all refund operations:

```sql
CREATE TABLE RefundLog (
  id VARCHAR(30) PRIMARY KEY,
  refundCommerceOrder VARCHAR(191) UNIQUE,
  flowRefundOrder VARCHAR(191),
  token VARCHAR(191) UNIQUE,
  receiverEmail VARCHAR(191),
  amount INTEGER,
  fee INTEGER,
  status VARCHAR(191),
  originalCommerceOrder VARCHAR(191),
  originalFlowOrder VARCHAR(191),
  reason TEXT,
  createdBy VARCHAR(30),
  cancelledBy VARCHAR(30),
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  cancelledAt DATETIME
);
```

## 📞 Support

If you encounter issues:
1. Check server logs for detailed error messages
2. Verify signatures are generated correctly
3. Ensure webhook URL is accessible from Flow.cl servers
4. Contact Flow.cl support if API issues persist

## 🔗 Useful Links

- [Flow.cl API Documentation](https://www.flow.cl/docs/api.html)
- [Flow.cl Merchant Dashboard](https://sandbox.flow.cl/app/web/misDatos.php)
- [Postman Collections](https://www.flow.cl/docs/api.html#postman) 