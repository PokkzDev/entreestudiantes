# Planes de Suscripción

Permite crear, obtener, editar, eliminar y listar planes de suscripción.

---

## Crear un Plan de Suscripción

**POST** `/plans/create`

Crea un nuevo plan de suscripción.

**Request Body:** `application/x-www-form-urlencoded`
- `apiKey` (string, requerido): apiKey del comercio
- `planId` (string, requerido): Identificador del Plan (sin espacios, ej: PlanMensual)
- `name` (string, requerido): Nombre del Plan
- `currency` (string, opcional): Moneda del Plan, por omisión CLP
- `amount` (number, requerido): Monto del Plan
- `interval` (number, requerido): Frecuencia de cobros (1 diario, 2 semanal, 3 mensual, 4 anual)
- `interval_count` (number, opcional): Número de intervalos de frecuencia (por omisión 1)
- `trial_period_days` (number, opcional): Días de trial (por omisión 0)
- `days_until_due` (number, opcional): Días para considerar vencido el importe (por omisión 3)
- `periods_number` (number, opcional): Número de períodos de duración del plan
- `urlCallback` (string, opcional): URL de notificación de pagos
- `charges_retries_number` (number, opcional): Número de reintentos de cargo (por omisión 3)
- `currency_convert_option` (number, opcional): Momento de conversión de moneda (1 al pago, 2 al importe)
- `s` (string, requerido): Firma de los parámetros

**Response 200:**
```json
{
  "planId": "myPlan01",
  "name": "Plan junior",
  "currency": "CLP",
  "amount": 20000,
  "interval": 3,
  "interval_count": 1,
  "created": "2017-07-21 12:33:15",
  "trial_period_days": 15,
  "days_until_due": 3,
  "periods_number": 12,
  "urlCallback": "https://www.comercio.cl/flow/suscriptionResult.php",
  "charges_retries_number": 3,
  "currency_convert_option": 0,
  "status": 1,
  "public": 1
}
```

---

## Obtener datos de un Plan

**GET** `/plans/get`

Obtiene los datos de un plan de suscripción.

**Query Params:**
- `apiKey` (string, requerido)
- `planId` (string, requerido)
- `s` (string, requerido)

**Response 200:** igual a la respuesta de creación de plan.

---

## Editar un Plan de Suscripción

**POST** `/plans/edit`

Permite editar los datos de un plan. Si el plan tiene clientes suscritos, sólo se puede modificar `trial_period_days`.

**Request Body:** igual a creación, pero todos los campos son opcionales excepto `apiKey`, `planId` y `s`.

**Response 200:** igual a la respuesta de creación de plan.

---

## Eliminar un Plan de Suscripción

**POST** `/plans/delete`

Elimina un plan de suscripción (no permite nuevas suscripciones, pero las activas siguen vigentes).

**Request Body:**
- `apiKey` (string, requerido)
- `planId` (string, requerido)
- `s` (string, requerido)

**Response 200:** igual a la respuesta de creación de plan.

---

## Listar Planes de Suscripción

**GET** `/plans/list`

Obtiene una lista paginada de planes de suscripción.

**Query Params:**
- `apiKey` (string, requerido)
- `start` (integer, opcional): Registro de inicio (por omisión 0)
- `limit` (integer, opcional): Registros por página (por omisión 10, máximo 100)
- `filter` (string, opcional): Filtro por nombre
- `status` (integer, opcional): 1-Activo, 0-Eliminado
- `s` (string, requerido)

**Response 200:**
```json
{
  "total": 200,
  "hasMore": 1,
  "data": [
    { /* plan 1 */ },
    { /* plan 2 */ }
  ]
}
```

---

## Errores

**400 Error del Api**
```json
{
  "code": 400,
  "message": "Mensaje de error"
}
```

**401 Error de negocio**
```json
{
  "code": 401,
  "message": "Mensaje de error"
}
```

---

## Notas
- Los endpoints tienen versiones de producción y sandbox:
  - Producción: `https://www.flow.cl/api/plans/...`
  - Sandbox: `https://sandbox.flow.cl/api/plans/...`
- El campo `s` es la firma de los parámetros usando la `secretKey` del comercio.
- El campo `public` indica si el plan es visible públicamente (`1`) o privado (`0`).
- El campo `status` indica si el plan está activo (`1`) o eliminado (`0`).
