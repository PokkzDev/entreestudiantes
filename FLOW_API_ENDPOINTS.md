# Flow.cl API Endpoints Documentation

This document provides complete API documentation for all Flow.cl payment integration endpoints in EntreEstudiantes.

## 🔧 Base Configuration

All endpoints use the following environment variables:
- `FLOW_API_KEY`: Your Flow.cl API key
- `FLOW_API_SECRET`: Your Flow.cl secret key  
- `FLOW_API_URL`: Flow.cl API URL (sandbox/production)

## 📋 Available Endpoints

### 1. Create Direct Payment

**Endpoint**: `POST /api/flow/create-payment`

Creates a direct payment order and returns a redirect URL.

**Request Body**:
```json
{
  "planId": "premium",           // required: plan identifier
  "paymentMethod": 9,            // optional: payment method ID (default: 9 = all)
  "timeout": 3600                // optional: payment timeout in seconds
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
  "planId": "premium",
  "paymentMethod": 9,
  "timeout": 3600,
  "expiresAt": "2024-01-15T15:30:00.000Z"
}
```

**Payment Methods**:
- `1-8`: Specific payment methods (configured in Flow.cl)
- `9`: All available payment methods

---

### 2. Create Email Payment

**Endpoint**: `POST /api/flow/create-email-payment`

Creates an email-based payment order. Flow.cl sends an email to the customer with payment instructions.

**Request Body**:
```json
{
  "planId": "premium",           // required: plan identifier
  "email": "customer@email.com", // optional: recipient email (defaults to user's email)
  "timeout": 86400,              // optional: payment timeout in seconds
  "forwardDaysAfter": 3,         // optional: days before follow-up email
  "forwardTimes": 2              // optional: number of follow-up emails
}
```

**Response**:
```json
{
  "success": true,
  "message": "Cobro por email enviado a customer@email.com",
  "paymentInfo": {
    "url": "https://sandbox.flow.cl/app/web/pay.php",
    "token": "payment-token",
    "flowOrder": 3567899,
    "commerceOrder": "ENT-EMAIL-1234567890-123",
    "amount": 2990,
    "planId": "premium",
    "email": "customer@email.com",
    "subject": "Plan Premium - EntreEstudiantes (Cobro por Email)",
    "followUp": {
      "forwardDaysAfter": 3,
      "forwardTimes": 2
    },
    "timeout": 86400
  }
}
```

---

### 3. Verify Payment

**Endpoint**: `POST /api/flow/verify`

Verifies a payment status and updates user subscription if approved.

**Request Body**:
```json
{
  "token": "payment-token"       // required: payment token from Flow.cl
}
```

**Response (Success)**:
```json
{
  "success": true,
  "subscriptionUpdated": true,
  "planId": "premium",
  "planName": "Premium",
  "amount": 2990,
  "commerceOrder": "ENT-1234567890-123",
  "flowOrder": 3567899,
  "paymentDetails": {
    "media": "webpay",
    "mediaType": "Crédito",
    "cardLast4Numbers": "9876",
    "installments": 3,
    "authorizationCode": "123456",
    "transferDate": "2024-01-24"
  }
}
```

**Response (Error)**:
```json
{
  "success": false,
  "error": "Pago no aprobado",
  "status": 3,
  "statusMessage": "Pago rechazado",
  "errorCode": "-1",
  "errorMessage": "Tarjeta inválida",
  "detailedError": "Tarjeta inválida (Código: -1)",
  "medioCode": "005"
}
```

---

### 4. Get Payment Status

**Endpoint**: `POST /api/flow/get-payment-status`

Administrative endpoint to check payment status by various identifiers.

**Request Body** (one of):
```json
// By payment token
{
  "token": "payment-token"
}

// By commerce order
{
  "commerceOrder": "ENT-1234567890-123"
}

// By Flow order number
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
    "subject": "Plan Premium - EntreEstudiantes",
    "amount": 2990,
    "currency": "CLP",
    "payer": "customer@email.com",
    "requestDate": "2024-01-15 10:30:00",
    "merchantId": "merchant-id",
    "paymentDetails": {
      "date": "2024-01-15 10:32:11",
      "media": "webpay",
      "mediaType": "Crédito",
      "cardLast4Numbers": "9876",
      "installments": 3,
      "authorizationCode": "123456",
      "fee": 87,
      "balance": 2903,
      "transferDate": "2024-01-18"
    },
    "optional": {
      "userId": "user-id",
      "planId": "premium",
      "planName": "Premium"
    }
  }
}
```

---

### 5. Get Daily Transactions

**Endpoint**: `POST /api/flow/get-transactions`

Administrative endpoint to get paginated daily transaction reports.

**Request Body**:
```json
{
  "date": "2024-01-15",          // required: date in yyyy-mm-dd format
  "start": 0,                    // optional: pagination start (default: 0)
  "limit": 50                    // optional: records per page (max: 100, default: 10)
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
    "transactionsInPage": 45,
    "hasMore": false,
    "totalAmount": 134550,
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
  "transactions": [
    {
      "flowOrder": 3567899,
      "commerceOrder": "ENT-1234567890-123",
      "status": 2,
      "statusMessage": "Pago aprobado",
      "amount": 2990,
      "currency": "CLP",
      "displayAmount": "$2.990 CLP",
      "payer": "customer@email.com",
      "requestDate": "2024-01-15 10:30:00",
      "subject": "Plan Premium - EntreEstudiantes",
      "paymentData": {
        "media": "webpay",
        "mediaType": "Crédito"
      }
    }
    // ... more transactions
  ],
  "pagination": {
    "start": 0,
    "limit": 50,
    "total": 45,
    "hasMore": false,
    "currentPage": 1,
    "totalPages": 1
  }
}
```

---

### 6. Webhook Handler

**Endpoint**: `POST /api/flow/webhook`

Internal endpoint that receives notifications from Flow.cl when payments are processed.

**Flow.cl sends**:
```
Content-Type: application/x-www-form-urlencoded
token=payment-token&status=2&s=signature
```

**Response**:
```json
{
  "success": true
}
```

This endpoint automatically:
- Validates webhook signature
- Retrieves payment details from Flow.cl
- Updates user subscription for approved payments
- Logs payment information to database
- Always returns success to prevent Flow.cl retries

---

### 7. Create Refund

**Endpoint**: `POST /api/flow/create-refund`

Administrative endpoint to create refund orders for processed payments.

**Request Body**:
```json
{
  "receiverEmail": "customer@email.com",  // required: refund recipient email
  "amount": 2990,                         // required: refund amount in CLP cents
  "commerceTrxId": "ENT-1234567890-123",  // optional: original commerce order ID
  "flowTrxId": "3567899",                 // optional: original Flow transaction ID
  "reason": "Customer request"            // optional: reason for refund
}
```

**Response**:
```json
{
  "success": true,
  "message": "Reembolso creado para customer@email.com",
  "refundInfo": {
    "token": "refund-token",
    "flowRefundOrder": 122767,
    "refundCommerceOrder": "REF-1234567890-123",
    "status": "created",
    "amount": 2990,
    "fee": 240,
    "date": "2024-01-15 12:33:15",
    "receiverEmail": "customer@email.com",
    "originalTransaction": {
      "commerceTrxId": "ENT-1234567890-123",
      "flowTrxId": null
    },
    "originalPaymentInfo": {
      "userId": "user-id",
      "userEmail": "customer@email.com",
      "planId": "premium",
      "originalAmount": 2990
    }
  }
}
```

---

### 8. Cancel Refund

**Endpoint**: `POST /api/flow/cancel-refund`

Administrative endpoint to cancel pending refunds.

**Request Body**:
```json
{
  "token": "refund-token"    // required: refund token from create-refund
}
```

**Response**:
```json
{
  "success": true,
  "message": "Reembolso cancelado exitosamente",
  "refundInfo": {
    "token": "refund-token",
    "flowRefundOrder": 122767,
    "status": "cancelled",
    "amount": 2990,
    "fee": 240,
    "date": "2024-01-15 12:33:15",
    "cancelledBy": "admin@entreestudiantes.cl"
  }
}
```

---

### 9. Get Refund Status

**Endpoint**: `POST /api/flow/get-refund-status`

Check the status of a refund by its token.

**Request Body**:
```json
{
  "token": "refund-token"    // required: refund token
}
```

**Response**:
```json
{
  "success": true,
  "refundInfo": {
    "token": "refund-token",
    "flowRefundOrder": 122767,
    "status": "accepted",
    "statusMessage": "Reembolso aceptado",
    "amount": 2990,
    "fee": 240,
    "date": "2024-01-15 12:33:15"
  }
}
```

---

### 10. Refund Webhook Handler

**Endpoint**: `POST /api/flow/refund-webhook`

Internal endpoint that receives refund status notifications from Flow.cl.

**Flow.cl sends**:
```
Content-Type: application/x-www-form-urlencoded
token=refund-token&s=signature
```

**Response**:
```json
{
  "success": true
}
```

This endpoint automatically:
- Validates webhook signature
- Retrieves refund details from Flow.cl
- Updates refund status in database
- Logs refund status changes
- Handles different refund statuses (accepted, rejected, completed, etc.)
- Always returns success to prevent Flow.cl retries

---

## 🔐 Authentication

All endpoints require user authentication via NextAuth.js session.

Administrative endpoints (`get-transactions`, `get-payment-status`) may require additional role-based permissions (implement as needed).

## 🎯 Payment Status Codes

| Code | Description |
|------|-------------|
| 1    | Pago pendiente |
| 2    | Pago aprobado |
| 3    | Pago rechazado |
| 4    | Pago cancelado |
| 5    | Pago reversado |

## 🔄 Refund Status Codes

| Status | Description |
|--------|-------------|
| created   | Reembolso creado |
| pending   | Reembolso pendiente |
| accepted  | Reembolso aceptado |
| rejected  | Reembolso rechazado |
| cancelled | Reembolso cancelado |
| completed | Reembolso completado |
| expired   | Reembolso expirado |

## ❌ Error Codes

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

## 🛡️ Security Features

- **Signature Validation**: All requests to/from Flow.cl are cryptographically signed
- **Authentication**: User session validation on all endpoints
- **Input Validation**: Comprehensive parameter validation
- **Error Handling**: Secure error messages without sensitive data exposure
- **Audit Logging**: All payment operations are logged for debugging and compliance

## 🧪 Testing

See `FLOW_TESTING_GUIDE.md` for comprehensive testing instructions including:
- Sandbox test cards
- Payment flow testing
- Error scenario testing
- Webhook testing with ngrok 