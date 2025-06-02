# Obtener Estado de Pago

Este método se utiliza para obtener el estado de un pago. Se debe utilizar en la página callback del comercio para recibir notificaciones de pagos. Cada vez que el pagador efectúe un pago, Flow enviará vía POST una llamada a la página del comercio, pasando como parámetro un token que deberá utilizarse en este servicio.

## Endpoint

`GET /payment/getStatus`

### Servidores

*   **Production server (uses live data):** `https://www.flow.cl/api/payment/getStatus`
*   **Sandbox server (uses test data):** `https://sandbox.flow.cl/api/payment/getStatus`

## Parámetros Query (Query Parameters)

| Parámetro | Requerido | Tipo   | Descripción                                      |
| :-------- | :-------- | :----- | :----------------------------------------------- |
| `apiKey`  | Sí        | string | apiKey del comercio                              |
| `token`   | Sí        | string | token de la transacción enviado por Flow         |
| `s`       | Sí        | string | la firma de los parámetros efectuada con su secretKey |

## Respuestas (Responses)

### 200 OK - El objeto PaymentStatus

**Schema de Respuesta:** `application/json`

| Campo           | Tipo                                | Descripción                                                                                                                                    |
| :-------------- | :---------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------- |
| `flowOrder`     | integer                             | El número de la orden de Flow                                                                                                                  |
| `commerceOrder` | string                              | El número de la orden del comercio                                                                                                             |
| `requestDate`   | string `<yyyy-mm-dd hh:mm:ss>`      | La fecha de creación de la orden                                                                                                               |
| `status`        | integer                             | El estado de la orden: <br/> `1` pendiente de pago <br/> `2` pagada <br/> `3` rechazada <br/> `4` anulada                                          |
| `subject`       | string                              | El concepto de la orden                                                                                                                        |
| `currency`      | string                              | La moneda                                                                                                                                      |
| `amount`        | number `<float>`                    | El monto de la orden                                                                                                                           |
| `payer`         | string                              | El email del pagador                                                                                                                           |
| `optional`      | string (Nullable)                   | Datos opcionales enviados por el comercio en el request de creación de pago en el parámetro `optional` en formato JSON. Puede ser `null`.      |
| `pending_info`  | object                              | Información para un pago pendiente cuando se generó un cupón de pago. Si no existen datos es que no se generó un cupón de pago.               |
| `paymentData`   | object                              | Los datos del pago                                                                                                                             |
| `merchantId`    | string (Nullable)                   | Id de comercio asociado. Solo aplica si usted es comercio integrador. Puede ser `null`.                                                        |

#### Objeto `pending_info`

Si el pago está pendiente y se generó un cupón, este objeto contendrá:

| Campo   | Tipo   | Descripción                  |
| :------ | :----- | :--------------------------- |
| `media` | string | El medio del cupón de pago (ej: "Multicaja") |
| `date`  | string | Fecha de generación del cupón |

#### Objeto `paymentData`

Contiene los detalles del pago realizado.

| Campo            | Tipo             | Descripción                                  |
| :--------------- | :--------------- | :------------------------------------------- |
| `date`           | string           | Fecha del pago                               |
| `media`          | string           | Medio de pago utilizado (ej: "webpay")       |
| `conversionDate` | string           | Fecha de conversión (si aplica)              |
| `conversionRate` | number `<float>` | Tasa de conversión (si aplica)               |
| `amount`         | number `<float>` | Monto pagado                                 |
| `currency`       | string           | Moneda del pago                              |
| `fee`            | number `<float>` | Comisión de Flow                             |
| `balance`        | number `<float>` | Saldo para el comercio (monto - comisión)    |
| `transferDate`   | string           | Fecha estimada de transferencia al comercio |

---

### 400 Bad Request - Error del API

**Schema de Respuesta:** `application/json`

| Campo     | Tipo   | Descripción      |
| :-------- | :----- | :--------------- |
| `code`    | number | Código de error  |
| `message` | string | Mensaje de error |

---

### 401 Unauthorized - Error interno de negocio

**Schema de Respuesta:** `application/json`

| Campo     | Tipo   | Descripción      |
| :-------- | :----- | :--------------- |
| `code`    | number | Código de error  |
| `message` | string | Mensaje de error |

## Ejemplos de Respuesta (Response Samples)

### 200 OK

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
  "optional": {
    "RUT": "7025521-9",
    "ID": "899564778"
  },
  "pending_info": {
    "media": "Multicaja",
    "date": "2017-07-21 10:30:12"
  },
  "paymentData": {
    "date": "2017-07-21 12:32:11",
    "media": "webpay",
    "conversionDate": "2017-07-21",
    "conversionRate": 1.1,
    "amount": 12000,
    "currency": "CLP",
    "fee": 551,
    "balance": 11499,
    "transferDate": "2017-07-24"
  },
  "merchantId": "string"
}

400 Bad Request (Ejemplo Genérico)
{
  "code": 101,
  "message": "apiKey inválido o no encontrado"
}

401 Unauthorized (Ejemplo Genérico)
{
  "code": 205,
  "message": "Firma inválida"
}