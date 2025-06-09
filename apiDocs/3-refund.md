# Reembolsos (Refund)

Permite generar reembolsos y obtener el estado de estos.

## Crear un reembolso

**POST** `/refund/create`

Permite crear una orden de reembolso. Una vez que el receptor del reembolso acepte o rechace el reembolso, Flow notificará vía POST a la página del comercio identificada en `urlCallback` pasando como parámetro `token`.

En esta página, el comercio debe invocar el servicio `refund/getStatus` para obtener el estado del reembolso.

### Request
- **Content-Type:** `application/x-www-form-urlencoded`

| Parámetro             | Tipo    | Requerido | Descripción                                                        |
|----------------------|---------|-----------|--------------------------------------------------------------------|
| apiKey               | string  | Sí        | apiKey del comercio                                                |
| refundCommerceOrder  | string  | Sí        | La orden de reembolso del comercio                                 |
| receiverEmail        | string  | Sí        | Email del receptor del reembolso                                   |
| amount               | number  | Sí        | Monto del reembolso                                                |
| urlCallBack          | string  | Sí        | URL callback del comercio donde Flow comunica el estado del reembolso |
| commerceTrxId        | string  | No        | Identificador del comercio de la transacción original a reembolsar  |
| flowTrxId            | string  | No        | Identificador de Flow de la transacción original a reembolsar       |
| s                    | string  | Sí        | Firma de los parámetros con secretKey                              |

### Respuestas
- **200**: Objeto RefundStatus
- **400**: Error del API
- **401**: Error de negocio

#### Ejemplo de respuesta exitosa (200)
```json
{
  "token": "C93B4FAD6D63ED9A3F25D21E5D6DD0105FA8CAAQ",
  "flowRefundOrder": "122767",
  "date": "2017-07-21 12:33:15",
  "status": "created",
  "amount": "12000.00",
  "fee": "240.00"
}
```

### Estados posibles de un reembolso
- `created`: Solicitud creada
- `accepted`: Reembolso aceptado
- `rejected`: Reembolso rechazado
- `refunded`: Reembolso reembolsado
- `canceled`: Reembolso cancelado

---

## Cancelar un reembolso

**POST** `/refund/cancel`

Permite cancelar una orden de reembolso pendiente.

### Request
- **Content-Type:** `application/x-www-form-urlencoded`

| Parámetro | Tipo   | Requerido | Descripción                                         |
|-----------|--------|-----------|-----------------------------------------------------|
| apiKey    | string | Sí        | apiKey del comercio                                 |
| token     | string | Sí        | Token devuelto al crear el reembolso                |
| s         | string | Sí        | Firma de los parámetros con secretKey               |

### Respuestas
- **200**: Objeto RefundStatus
- **400**: Error del API
- **401**: Error de negocio

#### Ejemplo de respuesta exitosa (200)
```json
{
  "token": "C93B4FAD6D63ED9A3F25D21E5D6DD0105FA8CAAQ",
  "flowRefundOrder": "122767",
  "date": "2017-07-21 12:33:15",
  "status": "created",
  "amount": "12000.00",
  "fee": "240.00"
}
```

---

## Obtener estado de un reembolso

**GET** `/refund/getStatus`

Permite obtener el estado de un reembolso solicitado. Este servicio se debe invocar desde la página del comercio que se señaló en el parámetro `urlCallback` del servicio `refund/create`.

### Request
- **Parámetros de consulta (query):**

| Parámetro | Tipo   | Requerido | Descripción                                         |
|-----------|--------|-----------|-----------------------------------------------------|
| apiKey    | string | Sí        | apiKey del comercio                                 |
| token     | string | Sí        | Token de la solicitud de reembolso enviado por Flow |
| s         | string | Sí        | Firma de los parámetros con secretKey               |

### Respuestas
- **200**: Objeto RefundStatus
- **400**: Error del API
- **401**: Error de negocio

#### Ejemplo de respuesta exitosa (200)
```json
{
  "token": "C93B4FAD6D63ED9A3F25D21E5D6DD0105FA8CAAQ",
  "flowRefundOrder": "122767",
  "date": "2017-07-21 12:33:15",
  "status": "created",
  "amount": "12000.00",
  "fee": "240.00"
}
```

---

### Endpoints
- Producción: `https://www.flow.cl/api/refund/create`, `https://www.flow.cl/api/refund/cancel`, `https://www.flow.cl/api/refund/getStatus`
- Sandbox: `https://sandbox.flow.cl/api/refund/create`, `https://sandbox.flow.cl/api/refund/cancel`, `https://sandbox.flow.cl/api/refund/getStatus`
