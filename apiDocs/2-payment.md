# API de Pagos - Flow

## Creación de transacciones de pagos y cobros por email

Utilice el servicio `payment/create` para crear links de pagos o `payment/createEmail` para crear cobros por email.

---

## Obtener estado de una orden de pago

### `GET /payment/getStatus`
Obtiene el estado de un pago. Se utiliza en la página callback del comercio para recibir notificaciones de pagos. Flow enviará vía POST una llamada a la página del comercio, pasando como parámetro un token que deberá utilizarse en este servicio.

**Parámetros (query):**
- `apiKey` (string, requerido): apiKey del comercio
- `token` (string, requerido): token de la transacción enviado por Flow
- `s` (string, requerido): firma de los parámetros con su secretKey

**Respuesta 200:**
```json
{
  "flowOrder": 3567899,
  "commerceOrder": "sf12377",
  "requestDate": "2017-07-21 12:32:11",
  "status": 1,
  "subject": "game console",
  "currency": "CLP",
  "amount": 12000,
  "payer": "pperez@gamil.com",
  "optional": { "RUT": "7025521-9", "ID": "899564778" },
  "pending_info": { "media": "Multicaja", "date": "2017-07-21 10:30:12" },
  "paymentData": { "date": "2017-07-21 12:32:11", "media": "webpay", "conversionDate": "2017-07-21", "conversionRate": 1.1, "amount": 12000, "currency": "CLP", "fee": 551, "balance": 11499, "transferDate": "2017-07-24" },
  "merchantId": "string"
}
```

**Estados posibles:**
- 1: pendiente de pago
- 2: pagada
- 3: rechazada
- 4: anulada

**Errores:**
- 400: error del Api
- 401: error interno de negocio

---

## Obtener estado de pago por commerceId

### `GET /payment/getStatusByCommerceId`
Permite obtener el estado de un pago en base al commerceId.

**Parámetros (query):**
- `apiKey` (string, requerido)
- `commerceId` (string, requerido)
- `s` (string, requerido)

**Respuesta:** igual a `/payment/getStatus`

---

## Obtener estado de pago por flowOrder

### `GET /payment/getStatusByFlowOrder`
Permite obtener el estado de un pago en base al número de orden Flow.

**Parámetros (query):**
- `apiKey` (string, requerido)
- `flowOrder` (number, requerido)
- `s` (string, requerido)

**Respuesta:** igual a `/payment/getStatus`

---

## Listar pagos recibidos en un día

### `GET /payment/getPayments`
Obtiene la lista paginada de pagos recibidos en un día.

**Parámetros (query):**
- `apiKey` (string, requerido)
- `date` (string, requerido, formato yyyy-mm-dd)
- `start` (integer, opcional, default 0)
- `limit` (integer, opcional, default 10, máximo 100)
- `s` (string, requerido)

**Respuesta 200:**
```json
{
  "total": 200,
  "hasMore": 1,
  "data": "[{item list 1}{item list 2}{item list n..}]"
}
```

---

## Obtener estado extendido de una orden de pago

### `GET /payment/getStatusExtended`
Retorna el estado extendido de una orden de pago, incluyendo tipo de pago, últimos 4 dígitos de la tarjeta y último intento de pago.

**Parámetros (query):**
- `apiKey` (string, requerido)
- `token` (string, requerido)
- `s` (string, requerido)

**Respuesta 200:**
```json
{
  "flowOrder": 3567899,
  "commerceOrder": "sf12377",
  "requestDate": "2017-07-21 12:32:11",
  "status": 1,
  "subject": "game console",
  "currency": "CLP",
  "amount": 12000,
  "payer": "pperez@gamil.com",
  "optional": { "RUT": "7025521-9", "ID": "899564778" },
  "pending_info": { "media": "Multicaja", "date": "2017-07-21 10:30:12" },
  "paymentData": { "date": "2017-07-21 12:32:11", "media": "webpay", "conversionDate": "2017-07-21", "conversionRate": 1.1, "amount": 12000, "currency": "CLP", "fee": 551, "balance": 11499, "transferDate": "2017-07-24", "mediaType": "Crédito", "cardLast4Numbers": "9876", "taxes": 1, "installments": 3, "autorizationCode": "123456" },
  "merchantId": "string",
  "lastError": { "code": "01", "message": "Tarjeta inválida", "medioCode": "005" }
}
```

---

## Obtener estado extendido por flowOrder

### `GET /payment/getStatusByFlowOrderExtended`
Igual a `/payment/getStatusExtended` pero usando `flowOrder` como parámetro.

**Parámetros (query):**
- `apiKey` (string, requerido)
- `flowOrder` (number, requerido)
- `s` (string, requerido)

**Respuesta:** igual a `/payment/getStatusExtended`

---

## Listar transacciones realizadas en un día

### `GET /payment/getTransactions`
Obtiene la lista paginada de transacciones realizadas en un día.

**Parámetros (query):**
- `apiKey` (string, requerido)
- `date` (string, requerido, formato yyyy-mm-dd)
- `start` (integer, opcional, default 0)
- `limit` (integer, opcional, default 10, máximo 100)
- `s` (string, requerido)

**Respuesta 200:**
```json
{
  "total": 200,
  "hasMore": 1,
  "data": "[{item list 1}{item list 2}{item list n..}]"
}
```

---

## Generar una orden de pago

### `POST /payment/create`
Crea una orden de pago y recibe como respuesta la URL para redirigir al pagador y el token de la transacción.

**Body (application/x-www-form-urlencoded):**
- `apiKey` (string, requerido)
- `commerceOrder` (string, requerido)
- `subject` (string, requerido)
- `currency` (string, opcional)
- `amount` (number, requerido)
- `email` (string, requerido)
- `paymentMethod` (integer, opcional, 9 para todos los medios)
- `urlConfirmation` (string, requerido)
- `urlReturn` (string, requerido)
- `optional` (string, opcional, JSON)
- `timeout` (integer, opcional)
- `merchantId` (string, opcional)
- `payment_currency` (string, opcional)
- `s` (string, requerido)

**Respuesta 200:**
```json
{
  "url": "https://api.flow.cl",
  "token": "33373581FC32576FAF33C46FC6454B1FFEBD7E1H",
  "flowOrder": 8765456
}
```

**Nota:** Para formar el link de pago: `url + "?token=" + token`

---

## Servidores
- Producción: https://www.flow.cl/api
- Sandbox: https://sandbox.flow.cl/api

---

## Estados de pago
- 1: pendiente de pago
- 2: pagada
- 3: rechazada
- 4: anulada

---

## Ejemplo de error
```json
{
  "code": 400,
  "message": "Mensaje de error"
}
```

---

Para más detalles, consulte la documentación oficial de Flow.
