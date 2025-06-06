# Invoice API

Permite obtener y gestionar los importes (invoices) generados por suscripciones.

---

## Obtener datos de un Invoice

**GET** `/invoice/get`

- **Production:** `https://www.flow.cl/api/invoice/get`
- **Sandbox:** `https://sandbox.flow.cl/api/invoice/get`

### Parámetros (query)
- `apiKey` (string, requerido): apiKey del comercio
- `invoiceId` (number, requerido): Identificador del Invoice
- `s` (string, requerido): Firma de los parámetros con secretKey

### Respuestas
- **200**: Objeto Invoice
- **400/401**: Error del API o de negocio

#### Ejemplo de respuesta 200
```json
{
  "id": 1034,
  "subscriptionId": "sus_azcyjj9ycd",
  "customerId": "cus_eblcbsua2g",
  "created": "2018-06-26 17:29:06",
  "subject": "PlanPesos - período 2018-06-27 / 2018-06-27",
  "currency": "CLP",
  "amount": 20000,
  "period_start": "2018-06-27 00:00:00",
  "period_end": "2018-07-26 00:00:00",
  "attemp_count": 0,
  "attemped": 1,
  "next_attemp_date": "2018-07-27 00:00:00",
  "due_date": "2018-06-30 00:00:00",
  "status": 0,
  "error": 0,
  "errorDate": "2018-06-30 00:00:00",
  "errorDescription": "The minimum amount is 350 CLP",
  "items": [{}],
  "payment": { ... },
  "outsidePayment": { ... },
  "paymentLink": "https://www.flow.cl/app/web/pay.php?token=...",
  "chargeAttemps": [{}]
}
```

---

## Cancelar un Invoice pendiente

**POST** `/invoice/cancel`

- **Production:** `https://www.flow.cl/api/invoice/cancel`
- **Sandbox:** `https://sandbox.flow.cl/api/invoice/cancel`

### Parámetros (form-urlencoded)
- `apiKey` (string, requerido)
- `invoiceId` (number, requerido)
- `s` (string, requerido)

### Respuestas
- **200**: Objeto Invoice cancelado
- **400/401**: Error del API o de negocio

---

## Registrar pago por fuera (outsidePayment)

**POST** `/invoice/outsidePayment`

- **Production:** `https://www.flow.cl/api/invoice/outsidePayment`
- **Sandbox:** `https://sandbox.flow.cl/api/invoice/outsidePayment`

### Parámetros (form-urlencoded)
- `apiKey` (string, requerido)
- `invoiceId` (number, requerido)
- `date` (string, requerido): Fecha del pago ("yyyy-mm-dd")
- `comment` (string, opcional): Descripción del pago
- `s` (string, requerido)

### Respuestas
- **200**: Objeto Invoice actualizado
- **400/401**: Error del API o de negocio

---

## Obtener invoices vencidos

**GET** `/invoice/getOverDue`

- **Production:** `https://www.flow.cl/api/invoice/getOverDue`
- **Sandbox:** `https://sandbox.flow.cl/api/invoice/getOverDue`

### Parámetros (query)
- `apiKey` (string, requerido)
- `start` (integer, opcional): Registro de inicio (default: 0)
- `limit` (integer, opcional): Registros por página (default: 10, max: 100)
- `filter` (string, opcional): Filtro por asunto
- `planId` (string, opcional): Filtrar por plan
- `s` (string, requerido)

### Respuestas
- **200**: Lista paginada de invoices vencidos
- **400/401**: Error del API o de negocio

#### Ejemplo de respuesta 200
```json
{
  "total": 200,
  "hasMore": 1,
  "data": "[{item list 1}{item list 2}{item list n..}]"
}
```

---

## Reintentar cobro de un invoice vencido

**POST** `/invoice/retryToCollect`

- **Production:** `https://www.flow.cl/api/invoice/retryToCollect`
- **Sandbox:** `https://sandbox.flow.cl/api/invoice/retryToCollect`

### Parámetros (form-urlencoded)
- `apiKey` (string, requerido)
- `invoiceId` (number, requerido)
- `s` (string, requerido)

### Respuestas
- **200**: Objeto Invoice actualizado
- **400/401**: Error del API o de negocio

---

## Descripción de campos relevantes

- `id`: Identificador del importe
- `subscriptionId`: ID de la suscripción
- `customerId`: ID del cliente
- `created`: Fecha de creación
- `subject`: Descripción
- `currency`: Moneda
- `amount`: Monto
- `period_start` / `period_end`: Fechas de período
- `attemp_count`: Intentos de cobro
- `attemped`: 1=Se cobrará, 0=No se cobrará
- `next_attemp_date`: Próximo intento
- `due_date`: Fecha de morosidad
- `status`: 0=impago, 1=pagado, 2=anulado
- `error`: 0=Sin error, 1=Con error
- `errorDate` / `errorDescription`: Info de error
- `items`: Items del invoice
- `payment`: Objeto de pago (si existe)
- `outsidePayment`: Pago por fuera (si existe)
- `paymentLink`: Link de pago (si no está pagado)
- `chargeAttemps`: Intentos de cobro fallidos

---

## Respuestas de error

- **400**: Error del API
  - `code`: Código de error
  - `message`: Mensaje de error
- **401**: Error de negocio
  - `code`: Código de error
  - `message`: Mensaje de error
