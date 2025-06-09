# API Customer (Clientes)

Permite crear, editar, eliminar y consultar clientes para efectuar cargos recurrentes o suscribirlos a planes de suscripción en Flow.

---

## Identificador de Cliente

Una vez creado un cliente, Flow lo identificará por un hash denominado `customerId`, ejemplo:

```
cus_onoolldvec
```

---

## Crear un cliente

**POST** `/customer/create`

Crea un nuevo cliente. El servicio retorna el objeto cliente creado.

**Request Body** (application/x-www-form-urlencoded):
- `apiKey` (string, requerido): apiKey del comercio
- `name` (string, requerido): Nombre del cliente (nombre y apellido)
- `email` (string, requerido): Email del cliente
- `externalId` (string, requerido): Identificador externo del cliente
- `s` (string, requerido): Firma de los parámetros con su secretKey

**Response 200** (application/json):
- `customerId` (string): Identificador del cliente
- `created` (string): Fecha de creación (yyyy-mm-dd hh:mm:ss)
- `email` (string): Email del cliente
- `name` (string): Nombre del cliente
- `pay_mode` (string): Modo de pago (`auto` o `manual`)
- `creditCardType` (string): Marca de la tarjeta registrada
- `last4CardDigits` (string): Últimos 4 dígitos de la tarjeta
- `externalId` (string): Identificador externo
- `status` (string): Estado (`0` Eliminado, `1` Activo)
- `registerDate` (string): Fecha de registro de tarjeta

**Errores:**
- 400/401: `{ code, message }`

**Ejemplo de respuesta:**
```json
{
  "customerId": "cus_onoolldvec",
  "created": "2017-07-21 12:33:15",
  "email": "customer@gmail.com",
  "name": "Pedro Raul Perez",
  "pay_mode": "auto",
  "creditCardType": "Visa",
  "last4CardDigits": "4425",
  "externalId": "14233531-8",
  "status": "1",
  "registerDate": "2017-07-21 14:22:01"
}
```

---

## Editar un cliente

**POST** `/customer/edit`

Permite editar los datos de un cliente.

**Request Body:**
- `apiKey`, `customerId`, `name`, `email`, `externalId`, `s`

**Response:** Igual a crear cliente.

---

## Eliminar un cliente

**POST** `/customer/delete`

Elimina un cliente (no debe tener suscripciones activas ni importes pendientes).

**Request Body:**
- `apiKey`, `customerId`, `s`

**Response:** Igual a crear cliente.

---

## Obtener datos de un cliente

**GET** `/customer/get`

Obtiene los datos de un cliente por `customerId`.

**Query Params:**
- `apiKey`, `customerId`, `s`

**Response:** Igual a crear cliente.

---

## Listar clientes

**GET** `/customer/list`

Obtiene la lista paginada de clientes, con filtros opcionales.

**Query Params:**
- `apiKey`, `start`, `limit`, `filter`, `status`, `s`

**Response 200:**
- `total` (number): Total de registros
- `hasMore` (boolean): Si hay más páginas
- `data` (array): Lista de clientes

---

## Registrar tarjeta de crédito

**POST** `/customer/register`

Envía a un cliente a registrar su tarjeta de crédito. Responde con la URL y token para redirigir al cliente.

**Request Body:**
- `apiKey`, `customerId`, `url_return`, `s`

**Response 200:**
- `url` (string): URL de registro
- `token` (string): Token de la transacción

---

## Estado de registro de tarjeta

**GET** `/customer/getRegisterStatus`

Obtiene el resultado del registro de la tarjeta de crédito de un cliente.

**Query Params:**
- `apiKey`, `token`, `s`

**Response 200:**
- `status` (string): 1 registrado, 0 no registrado
- `customerId`, `creditCardType`, `last4CardDigits`

---

## Eliminar registro de tarjeta de crédito

**POST** `/customer/unRegister`

Elimina el registro de la tarjeta de crédito de un cliente.

**Request Body:**
- `apiKey`, `customerId`, `s`

**Response:** Igual a crear cliente.

---

## Cargo automático a cliente

**POST** `/customer/charge`

Efectúa un cargo automático en la tarjeta registrada de un cliente.

**Request Body:**
- `apiKey`, `customerId`, `amount`, `subject`, `commerceOrder`, `currency`, `optionals`, `s`

**Response 200:**
- `flowOrder`, `commerceOrder`, `requestDate`, `status`, `subject`, `currency`, `amount`, `payer`, `optional`, `pending_info`, `paymentData`, `merchantId`

---

## Enviar cobro a cliente

**POST** `/customer/collect`

Envía un cobro a un cliente (cargo automático o link/email).

**Request Body:**
- `apiKey`, `customerId`, `commerceOrder`, `subject`, `amount`, `urlConfirmation`, `urlReturn`, `currency`, `paymentMethod`, `byEmail`, `forward_days_after`, `forward_times`, `ignore_auto_charging`, `optionals`, `timeout`, `s`

**Response 200:**
- `type`, `commerceOrder`, `flowOrder`, `url`, `token`, `status`, `paymenResult`

---

## Cobro masivo a clientes

**POST** `/customer/batchCollect`

Envía de forma masiva un lote de cobros a clientes.

**Request Body:**
- `apiKey`, `urlCallBack`, `urlConfirmation`, `urlReturn`, `batchRows`, `byEmail`, `forward_days_after`, `forward_times`, `timeout`, `s`

**Response 200:**
- `token`, `receivedRows`, `acceptedRows`, `rejectedRows`

---

## Estado de lote de cobros

**GET** `/customer/getBatchCollectStatus`

Consulta el estado de un lote de cobros enviados por batchCollect.

**Query Params:**
- `apiKey`, `token`, `s`

**Response 200:**
- `token`, `createdDate`, `processedDate`, `status`, `collectRows`

---

## Reversa de cargo

**POST** `/customer/reverseCharge`

Reversa un cargo efectuado en la tarjeta de crédito de un cliente (dentro de 24 horas).

**Request Body:**
- `apiKey`, `commerceOrder` o `flowOrder`, `s`

**Response 200:**
- `status` (string): 0 no efectuada, 1 efectuada
- `message` (string): Mensaje de resultado

---

## Listar cargos de un cliente

**GET** `/customer/getCharges`

Lista paginada de los cargos efectuados a un cliente.

**Query Params:**
- `apiKey`, `customerId`, `start`, `limit`, `filter`, `fromDate`, `status`, `s`

**Response 200:**
- `total`, `hasMore`, `data`

---

## Listar intentos de cargos fallidos

**GET** `/customer/getChargeAttemps`

Lista paginada de intentos de cargos fallidos a un cliente.

**Query Params:**
- `apiKey`, `customerId`, `start`, `limit`, `filter`, `fromDate`, `commerceOrder`, `s`

**Response 200:**
- `total`, `hasMore`, `data`

---

## Listar suscripciones de un cliente

**GET** `/customer/getSubscriptions`

Lista paginada de las suscripciones de un cliente.

**Query Params:**
- `apiKey`, `customerId`, `start`, `limit`, `filter`, `s`

**Response 200:**
- `total`, `hasMore`, `data`

---

> Para todos los endpoints, los errores 400 y 401 retornan `{ code, message }`.

---

**Ambientes:**
- Producción: `https://www.flow.cl/api/customer/...`
- Sandbox: `https://sandbox.flow.cl/api/customer/...`

---

**Nota:** Para detalles de firma y ejemplos de integración, consulte la documentación oficial de Flow.
