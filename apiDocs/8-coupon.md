# API de Cupones de Descuento

Permite crear, editar, eliminar, obtener y listar cupones de descuento para ser aplicados a suscripciones o clientes.

---

## Crear un cupón de descuento

**POST** `/coupon/create`

- **Producción:** https://www.flow.cl/api/coupon/create
- **Sandbox:** https://sandbox.flow.cl/api/coupon/create

Permite crear un cupón de descuento.

### Request Body (application/x-www-form-urlencoded)
| Campo           | Tipo    | Requerido | Descripción                                                                                 |
|-----------------|---------|-----------|---------------------------------------------------------------------------------------------|
| apiKey          | string  | Sí        | apiKey del comercio                                                                         |
| name            | string  | Sí        | Nombre del cupón                                                                            |
| percent_off     | number  | No        | Porcentaje de descuento (0-100, hasta 2 decimales, sin %). Ej: 10.2                         |
| currency        | string  | No        | Moneda del descuento. Solo para cupones de monto                                            |
| amount          | number  | No        | Monto del descuento                                                                         |
| duration        | number  | No        | Duración: 1 definida, 0 indefinida                                                          |
| times           | number  | No        | Si duración definida, número de veces (meses para clientes, períodos para suscripciones)     |
| max_redemptions | number  | No        | Número máximo de aplicaciones del cupón                                                     |
| expires         | string  | No        | Fecha de expiración (yyyy-mm-dd)                                                            |
| s               | string  | Sí        | Firma de los parámetros con su secretKey                                                    |

### Respuestas
- **200**: Objeto Coupon
- **400**: Error del API
- **401**: Error de negocio

#### Ejemplo de respuesta exitosa
```json
{
  "id": 166,
  "name": "Promo10",
  "percent_off": 10,
  "currency": "CLP",
  "amount": 2000,
  "created": "2018-07-13 09:57:53",
  "duration": 1,
  "times": 1,
  "max_redemptions": 50,
  "expires": "2018-12-31 00:00:00",
  "status": 1,
  "redemtions": 21
}
```

---

## Editar un cupón de descuento

**POST** `/coupon/edit`

Permite editar el nombre de un cupón existente.

### Request Body (application/x-www-form-urlencoded)
| Campo    | Tipo   | Requerido | Descripción                              |
|----------|--------|-----------|------------------------------------------|
| apiKey   | string | Sí        | apiKey del comercio                      |
| couponId | string | Sí        | Identificador del cupón                  |
| name     | string | Sí        | Nuevo nombre del cupón                   |
| s        | string | Sí        | Firma de los parámetros con su secretKey |

### Respuestas
- **200**: Objeto Coupon
- **400**: Error del API
- **401**: Error de negocio

---

## Eliminar un cupón de descuento

**POST** `/coupon/delete`

Permite eliminar un cupón de descuento. No elimina los descuentos ya aplicados, solo impide nuevas aplicaciones.

### Request Body (application/x-www-form-urlencoded)
| Campo    | Tipo   | Requerido | Descripción                              |
|----------|--------|-----------|------------------------------------------|
| apiKey   | string | Sí        | apiKey del comercio                      |
| couponId | string | Sí        | Identificador del cupón                  |
| s        | string | Sí        | Firma de los parámetros con su secretKey |

### Respuestas
- **200**: Objeto Coupon
- **400**: Error del API
- **401**: Error de negocio

---

## Obtener un cupón de descuento

**GET** `/coupon/get`

Permite obtener los datos de un cupón de descuento.

### Parámetros (query)
| Campo    | Tipo   | Requerido | Descripción                              |
|----------|--------|-----------|------------------------------------------|
| apiKey   | string | Sí        | apiKey del comercio                      |
| couponId | string | Sí        | Identificador del cupón                  |
| s        | string | Sí        | Firma de los parámetros con su secretKey |

### Respuestas
- **200**: Objeto Coupon
- **400**: Error del API
- **401**: Error de negocio

---

## Listar cupones de descuento

**GET** `/coupon/list`

Permite obtener la lista de cupones de descuento.

### Parámetros (query)
| Campo    | Tipo     | Requerido | Descripción                                                                 |
|----------|----------|-----------|-----------------------------------------------------------------------------|
| apiKey   | string   | Sí        | apiKey del comercio                                                         |
| start    | integer  | No        | Registro de inicio de la página (default: 0)                                |
| limit    | integer  | No        | Registros por página (default: 10, máximo: 100)                             |
| filter   | string   | No        | Filtro por nombre del cupón                                                 |
| status   | integer  | No        | Filtro por estado: 1 Activo, 0 Inactivo                                     |
| s        | string   | Sí        | Firma de los parámetros con su secretKey                                    |

### Respuestas
- **200**: Objeto Coupon (con total, hasMore, data[])
- **400**: Error del API
- **401**: Error de negocio

#### Ejemplo de respuesta exitosa
```json
{
  "total": 200,
  "hasMore": 1,
  "data": [
    { "id": 166, "name": "Promo10", ... },
    { "id": 167, "name": "Bienvenida", ... }
  ]
}
```

---

## Esquema de Objeto Coupon

| Campo           | Tipo    | Descripción                                                                 |
|-----------------|---------|-----------------------------------------------------------------------------|
| id              | number  | Identificador del cupón                                                     |
| name            | string  | Nombre del cupón                                                            |
| percent_off     | number  | Porcentaje de descuento (si aplica)                                         |
| currency        | string  | Moneda (si es cupón de monto)                                               |
| amount          | number  | Monto de descuento (si aplica)                                              |
| created         | string  | Fecha de creación                                                           |
| duration        | number  | 0: indefinida, 1: definida                                                  |
| times           | number  | Número de veces de duración (meses o períodos según aplicación)             |
| max_redemptions | number  | Número máximo de aplicaciones                                               |
| expires         | string  | Fecha de expiración (yyyy-mm-dd hh:mm:ss)                                   |
| status          | number  | Estado: 1 Activo, 0 Inactivo                                                |
| redemtions      | number  | Número de veces que se ha aplicado el cupón                                 |

---

## Errores

| Código | Descripción         |
|--------|---------------------|
| 400    | Error del API       |
| 401    | Error de negocio    |

**Respuesta de error:**
```json
{
  "code": 400,
  "message": "Mensaje de error"
}
```
