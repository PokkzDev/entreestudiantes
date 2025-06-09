# Suscripciones (Subscription)

Permite gestionar suscripciones de clientes a planes de pago. Incluye creación, consulta, modificación, cancelación, manejo de trial, cupones y cambio de plan.

## Endpoints principales

| Método | Endpoint                              | Descripción                                      |
|--------|----------------------------------------|--------------------------------------------------|
| POST   | /subscription/create                  | Crea una nueva suscripción                       |
| GET    | /subscription/get                     | Obtiene una suscripción por ID                    |
| GET    | /subscription/list                    | Lista suscripciones de un plan                    |
| POST   | /subscription/changeTrial             | Modifica los días de trial                        |
| POST   | /subscription/cancel                  | Cancela una suscripción                           |
| POST   | /subscription/addCoupon               | Agrega un cupón de descuento                      |
| POST   | /subscription/deleteCoupon            | Elimina el cupón de descuento                     |
| POST   | /subscription/addItem                 | Agrega un ítem adicional                          |
| POST   | /subscription/deleteItem              | Elimina un ítem adicional                         |
| POST   | /subscription/changePlan              | Cambia el plan asociado a una suscripción         |
| POST   | /subscription/changePlanPreview       | Previsualiza el cambio de plan                    |
| POST   | /subscription/changePlanCancel        | Cancela un cambio de plan programado              |

---

## 1. Crear una suscripción

**POST** `/subscription/create`

Permite suscribir un cliente a un plan.

**Parámetros requeridos:**
- `apiKey` (string): apiKey del comercio
- `planId` (string): ID del plan
- `customerId` (string): ID del cliente
- `s` (string): firma de los parámetros

**Parámetros opcionales:**
- `subscription_start` (string, yyyy-mm-dd): Fecha de inicio
- `couponId` (number): ID de cupón de descuento
- `trial_period_days` (number): Días de trial
- `periods_number` (number): Número de períodos de duración

**Request Body:** `application/x-www-form-urlencoded`

**Respuesta exitosa (200):** Objeto Subscription (ver ejemplo más abajo)

---

## 2. Obtener una suscripción

**GET** `/subscription/get`

Obtiene los datos de una suscripción por su `subscriptionId`.

**Parámetros requeridos:**
- `apiKey` (string)
- `subscriptionId` (string)
- `s` (string)

**Respuesta exitosa (200):** Objeto Subscription

---

## 3. Listar suscripciones de un plan

**GET** `/subscription/list`

Lista suscripciones de un plan, con paginación y filtros.

**Parámetros requeridos:**
- `apiKey` (string)
- `planId` (string)
- `s` (string)

**Parámetros opcionales:**
- `start` (integer): Registro inicial (default 0)
- `limit` (integer): Registros por página (default 10, max 100)
- `filter` (string): Filtro por nombre del cliente
- `status` (integer): Filtro por estado

**Respuesta exitosa (200):**
- `total` (number): Total de registros
- `hasMore` (boolean): Si hay más páginas
- `data` (array): Lista de suscripciones

---

## 4. Modificar días de trial

**POST** `/subscription/changeTrial`

Modifica los días de trial de una suscripción vigente o no iniciada.

**Parámetros requeridos:**
- `apiKey` (string)
- `subscriptionId` (string)
- `trial_period_days` (number)
- `s` (string)

**Respuesta exitosa (200):** Objeto Subscription

---

## 5. Cancelar una suscripción

**POST** `/subscription/cancel`

Cancela una suscripción inmediatamente (`at_period_end=0`) o al final del período vigente (`at_period_end=1`).

**Parámetros requeridos:**
- `apiKey` (string)
- `subscriptionId` (string)
- `s` (string)

**Parámetro opcional:**
- `at_period_end` (number): 0 = inmediato, 1 = al final del período

**Respuesta exitosa (200):** Objeto Subscription

---

## 6. Agregar o eliminar cupón de descuento

**Agregar cupón:**
- **POST** `/subscription/addCoupon`
- Parámetros: `apiKey`, `subscriptionId`, `couponId`, `s`

**Eliminar cupón:**
- **POST** `/subscription/deleteCoupon`
- Parámetros: `apiKey`, `subscriptionId`, `s`

**Respuesta exitosa (200):** Objeto Subscription

---

## 7. Agregar o eliminar ítem adicional

**Agregar ítem:**
- **POST** `/subscription/addItem`
- Parámetros: `apiKey`, `subscriptionId`, `itemId`, `s`

**Eliminar ítem:**
- **POST** `/subscription/deleteItem`
- Parámetros: `apiKey`, `subscriptionId`, `itemId`, `s`

**Respuesta exitosa (200):**
- `sub_id` (string): ID de la suscripción
- `item_id` (number): ID del ítem
- `success` (boolean)

---

## 8. Cambiar plan de una suscripción

**POST** `/subscription/changePlan`

Cambia el plan asociado a una suscripción. Puede programarse para una fecha futura dentro del ciclo de facturación.

**Parámetros requeridos:**
- `apiKey` (string)
- `subscriptionId` (string)
- `newPlanId` (string)
- `s` (string)

**Parámetro opcional:**
- `startDateOfNewPlan` (string, yyyy-mm-dd)

**Respuesta exitosa (200):** Objeto con detalles del cambio de plan

---

## 9. Previsualizar cambio de plan

**POST** `/subscription/changePlanPreview`

Permite ver el balance y detalles antes de cambiar el plan.

**Parámetros requeridos:**
- `apiKey` (string)
- `subscriptionId` (string)
- `newPlanId` (string)
- `s` (string)

**Parámetro opcional:**
- `startDateOfNewPlan` (string, yyyy-mm-dd)

**Respuesta exitosa (200):** Objeto con balance y detalles de ambos planes

---

## 10. Cancelar cambio de plan programado

**POST** `/subscription/changePlanCancel`

Cancela un cambio de plan programado.

**Parámetros requeridos:**
- `apiKey` (string)
- `subscriptionId` (string)
- `s` (string)

**Respuesta exitosa (200):**
- `success` (boolean)

---

## Ejemplo de respuesta de suscripción

```json
{
  "subscriptionId": "sus_azcyjj9ycd",
  "planId": "MiPlanMensual",
  "plan_name": "Plan mensual",
  "customerId": "cus_eblcbsua2g",
  "created": "2018-06-26 17:29:06",
  "subscription_start": "2018-06-26 17:29:06",
  "subscription_end": "2019-06-25 00:00:00",
  "period_start": "2018-06-26 00:00:00",
  "period_end": "2018-06-26 00:00:00",
  "next_invoice_date": "2018-06-27 00:00:00",
  "trial_period_days": 1,
  "trial_start": "2018-06-26 00:00:00",
  "trial_end": "2018-06-26 00:00:00",
  "cancel_at_period_end": 0,
  "cancel_at": null,
  "periods_number": 12,
  "days_until_due": 3,
  "status": 1,
  "discount_balance": "20000.0000",
  "newPlanId": 12,
  "new_plan_scheduled_change_date": null,
  "in_new_plan_next_attempt_date": null,
  "morose": 0,
  "discount": { ... },
  "invoices": [ ... ]
}
```

---

## Estados de la suscripción (`status`)
- 0: Inactivo (no iniciada)
- 1: Activa
- 2: En período de trial
- 4: Cancelada

## Notas
- Todos los endpoints requieren firma (`s`) generada con la `secretKey`.
- Los objetos de respuesta pueden incluir detalles de descuentos, facturas, y cambios de plan.
- Consultar la documentación oficial de Flow para detalles de seguridad y generación de firmas.
