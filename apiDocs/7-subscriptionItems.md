# subscription_items

Permite asociar ítems adicionales a suscripciones.

---

## Crear un ítem adicional de suscripción

**POST** `/subscription_item/create`

- **Producción:** https://www.flow.cl/api/subscription_item/create
- **Sandbox:** https://sandbox.flow.cl/api/subscription_item/create

### Request Body (application/x-www-form-urlencoded)
- `apiKey` (string, requerido): apiKey del comercio
- `name` (string, requerido): Nombre del ítem adicional
- `currency` (string, requerido): Moneda del ítem adicional
- `amount` (number, requerido): Monto del ítem adicional (negativo = descuento, positivo = recargo)
- `s` (string, requerido): Firma de los parámetros con secretKey

### Respuestas
- **200**: Objeto ItemAdditional
- **400**: Error del API
- **401**: Error de negocio

#### Ejemplo de respuesta 200
```json
{
  "id": 166,
  "name": "Seguro adicional",
  "amount": 5000,
  "currency": "CLP",
  "associatedSubscriptionsCount": 1,
  "status": 1,
  "created": "2018-07-13 09:57:53"
}
```

---

## Obtener un ítem adicional de suscripción

**GET** `/subscription_item/get`

- **Producción:** https://www.flow.cl/api/subscription_item/get
- **Sandbox:** https://sandbox.flow.cl/api/subscription_item/get

### Parámetros (query)
- `apiKey` (string, requerido): apiKey del comercio
- `itemId` (string, requerido): Identificador del ítem adicional
- `s` (string, requerido): Firma de los parámetros con secretKey

### Respuestas
- **200**: Objeto ItemAdditional
- **400**: Error del API
- **401**: Error de negocio

#### Ejemplo de respuesta 200
```json
{
  "id": 166,
  "name": "Seguro adicional",
  "amount": 5000,
  "currency": "CLP",
  "associatedSubscriptionsCount": 1,
  "status": 1,
  "created": "2018-07-13 09:57:53"
}
```

---

## Editar un ítem adicional de suscripción

**POST** `/subscription_item/edit`

- **Producción:** https://www.flow.cl/api/subscription_item/edit
- **Sandbox:** https://sandbox.flow.cl/api/subscription_item/edit

### Request Body (application/x-www-form-urlencoded)
- `apiKey` (string, requerido): apiKey del comercio
- `itemId` (string, requerido): Identificador del ítem adicional
- `name` (string, opcional): Nombre del ítem adicional
- `amount` (number, opcional): Monto del ítem adicional
- `changeType` (string, requerido si se envía name o amount):
  - `to_future`: Solo para suscripciones futuras
  - `all`: Actualiza para suscripciones actuales y futuras
- `s` (string, requerido): Firma de los parámetros con secretKey

### Respuestas
- **200**: Objeto ItemAdditional
- **400**: Error del API
- **401**: Error de negocio

#### Ejemplo de respuesta 200
```json
{
  "id": 166,
  "name": "Seguro adicional",
  "amount": 5000,
  "currency": "CLP",
  "associatedSubscriptionsCount": 1,
  "status": 1,
  "created": "2018-07-13 09:57:53"
}
```

---

## Eliminar un ítem adicional de suscripción

**POST** `/subscription_item/delete`

- **Producción:** https://www.flow.cl/api/subscription_item/delete
- **Sandbox:** https://sandbox.flow.cl/api/subscription_item/delete

### Request Body (application/x-www-form-urlencoded)
- `apiKey` (string, requerido): apiKey del comercio
- `itemId` (string, requerido): Identificador del ítem adicional
- `changeType` (string, requerido):
  - `to_future`: Solo elimina para suscripciones futuras
  - `all`: Elimina para suscripciones actuales y futuras
- `s` (string, requerido): Firma de los parámetros con secretKey

### Respuestas
- **200**: Objeto ItemAdditional
- **400**: Error del API
- **401**: Error de negocio

#### Ejemplo de respuesta 200
```json
{
  "id": 166,
  "name": "Seguro adicional",
  "amount": 5000,
  "currency": "CLP",
  "associatedSubscriptionsCount": 1,
  "status": 1,
  "created": "2018-07-13 09:57:53"
}
```

---

## Listar ítems adicionales de suscripción

**GET** `/subscription_item/list`

- **Producción:** https://www.flow.cl/api/subscription_item/list
- **Sandbox:** https://sandbox.flow.cl/api/subscription_item/list

### Parámetros (query)
- `apiKey` (string, requerido): apiKey del comercio
- `start` (integer, opcional): Número de registro de inicio de la página (default: 0)
- `limit` (integer, opcional): Registros por página (default: 10, máximo: 100)
- `filter` (string, opcional): Filtro por nombre del ítem
- `status` (integer, opcional): Estado del ítem (1 = Activo, 0 = Inactivo)
- `s` (string, requerido): Firma de los parámetros con secretKey

### Respuestas
- **200**: Objeto con lista paginada de ítems
- **400**: Error del API
- **401**: Error de negocio

#### Ejemplo de respuesta 200
```json
{
  "total": 200,
  "hasMore": 1,
  "data": [
    { "id": 166, "name": "Seguro adicional", "amount": 5000, "currency": "CLP", "associatedSubscriptionsCount": 1, "status": 1, "created": "2018-07-13 09:57:53" }
    // ...otros ítems
  ]
}
```

---

### Estados posibles
- `status`: 1 = Activo, 0 = Inactivo

### Notas
- El campo `amount` puede ser negativo (descuento) o positivo (recargo).
- El campo `s` es la firma de los parámetros usando la secretKey del comercio.
