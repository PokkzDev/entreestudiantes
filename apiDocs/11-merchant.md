# Merchant API

Permite gestionar los comercios asociados en Flow.

---

## Crear un comercio asociado

**POST** `/merchant/create`

Permite crear un nuevo comercio asociado en Flow.

**Request Body** (application/x-www-form-urlencoded):
- `apiKey` (string, requerido): apiKey del comercio
- `id` (string, requerido): Id de comercio asociado
- `name` (string, requerido): Nombre de comercio asociado
- `url` (string, requerido): Url del comercio asociado
- `s` (string, requerido): Firma de los parámetros con su secretKey

**Respuestas**
- **200**: Objeto con información del comercio asociado
  - `id` (string): Id de comercio asociado
  - `name` (string): Nombre de comercio asociado
  - `url` (string): Url del comercio asociado
  - `createdate` (string): Fecha de creación
  - `status` (number): Estado (0: Pendiente, 1: Aprobado, 2: Rechazado)
  - `verifydate` (string|null): Fecha de aprobación/rechazo
- **400**/**401**: Error
  - `code` (number): Código de error
  - `message` (string): Mensaje de error

**Ejemplo de respuesta 200**
```json
{
  "id": "NEG-A",
  "name": "Negocio A",
  "url": "https://flow.cl",
  "createdate": "02-04-2020 11:52",
  "status": "0",
  "verifydate": "02-04-2020 11:52"
}
```

---

## Editar un comercio asociado

**POST** `/merchant/edit`

Permite modificar un comercio asociado previamente creado en Flow.

**Request Body** (application/x-www-form-urlencoded):
- `apiKey` (string, requerido)
- `id` (string, requerido)
- `name` (string, requerido)
- `url` (string, requerido)
- `s` (string, requerido)

**Respuestas**
- **200**: Objeto con información del comercio asociado (igual a crear)
- **400**/**401**: Error (igual a crear)

**Ejemplo de respuesta 200**
```json
{
  "id": "NEG-A",
  "name": "Negocio A",
  "url": "https://flow.cl",
  "createdate": "02-04-2020 11:52",
  "status": "0",
  "verifydate": "02-04-2020 11:52"
}
```

---

## Eliminar un comercio asociado

**POST** `/merchant/delete`

Permite eliminar un comercio asociado previamente creado en Flow.

**Request Body** (application/x-www-form-urlencoded):
- `apiKey` (string, requerido)
- `id` (string, requerido)
- `s` (string, requerido)

**Respuestas**
- **200**: Objeto con información de la operación
  - `status` (string): Estado de la operación
  - `message` (string): Mensaje asociado
- **400**/**401**: Error (igual a crear)

**Ejemplo de respuesta 200**
```json
{
  "status": "ok",
  "message": "Merchant X deleted"
}
```

---

## Obtener un comercio asociado

**GET** `/merchant/get`

Permite obtener la información de un comercio asociado previamente creado en Flow.

**Query Parameters:**
- `apiKey` (string, requerido)
- `id` (string, requerido)
- `s` (string, requerido)

**Respuestas**
- **200**: Objeto con información del comercio asociado (igual a crear)
- **400**/**401**: Error (igual a crear)

**Ejemplo de respuesta 200**
```json
{
  "id": "NEG-A",
  "name": "Negocio A",
  "url": "https://flow.cl",
  "createdate": "02-04-2020 11:52",
  "status": "0",
  "verifydate": "02-04-2020 11:52"
}
```

---

## Listar comercios asociados

**GET** `/merchant/list`

Permite obtener la lista de comercios asociados, con paginación y filtros.

**Query Parameters:**
- `apiKey` (string, requerido)
- `start` (integer, opcional): Registro de inicio (default: 0)
- `limit` (integer, opcional): Registros por página (default: 10, max: 100)
- `filter` (string, opcional): Filtro por nombre
- `status` (integer, opcional): Estado (0: Pendiente, 1: Aprobado, 2: Rechazado)
- `s` (string, requerido)

**Respuestas**
- **200**: Objeto con información de la lista
  - `total` (number): Total de registros
  - `hasMore` (boolean): 1 si hay más páginas, 0 si es la última
  - `data` (array): Arreglo de comercios
- **400**/**401**: Error (igual a crear)

**Ejemplo de respuesta 200**
```json
{
  "total": 200,
  "hasMore": 1,
  "data": [
    { "id": "NEG-A", "name": "Negocio A", ... },
    { "id": "NEG-B", "name": "Negocio B", ... }
  ]
}
```

---

**Entornos:**
- Producción: `https://www.flow.cl/api/merchant/*`
- Sandbox: `https://sandbox.flow.cl/api/merchant/*`
