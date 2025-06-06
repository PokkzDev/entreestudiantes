# Liquidaciones (Settlement)

## Buscar liquidaciones en un rango de fechas

Este método permite obtener los encabezados de liquidaciones dentro de un rango de fechas, con opción de filtrar por moneda. Para obtener la liquidación completa (encabezado y detalles), utilice el servicio `/settlement/getByIdv2`.

**GET** `/settlement/search`

**Servidores:**
- Producción: `https://www.flow.cl/api/settlement/search`
- Sandbox: `https://sandbox.flow.cl/api/settlement/search`

### Parámetros de consulta (query parameters)
| Nombre        | Tipo    | Requerido | Descripción                                      |
|-------------- |---------|-----------|--------------------------------------------------|
| apiKey        | string  | Sí        | apiKey del comercio                              |
| startDate     | string  | Sí        | Fecha inicio de rango (formato yyyy-mm-dd)       |
| endDate       | string  | Sí        | Fecha fin de rango (formato yyyy-mm-dd)          |
| currency      | string  | No        | Moneda de liquidación                            |
| s             | string  | Sí        | Firma de los parámetros con su secretKey         |

### Respuestas
- **200**: Arreglo de objetos SettlementBase
- **400**: Error del API
- **401**: Error de negocio

#### Ejemplo de respuesta 200
```json
[
  {
    "id": 1001,
    "date": "2018-06-15",
    "taxId": "9999999-9",
    "name": "John Doe",
    "email": "johndoe@flow.cl",
    "currency": "CLP",
    "initial_balance": 0,
    "final_balance": 0,
    "transferred": 0,
    "billed": 0
  }
]
```

#### Ejemplo de respuesta 400/401
```json
{
  "code": 400,
  "message": "Error del Api"
}
```

---

## Obtener liquidación por identificador (formato nuevo)

Este método permite obtener el objeto Settlement correspondiente a un identificador específico, incluyendo encabezado, resumen y detalles.

**GET** `/settlement/getByIdv2`

**Servidores:**
- Producción: `https://www.flow.cl/api/settlement/getByIdv2`
- Sandbox: `https://sandbox.flow.cl/api/settlement/getByIdv2`

### Parámetros de consulta (query parameters)
| Nombre        | Tipo    | Requerido | Descripción                                      |
|-------------- |---------|-----------|--------------------------------------------------|
| apiKey        | string  | Sí        | apiKey del comercio                              |
| id            | string  | Sí        | Identificador de la liquidación                  |
| s             | string  | Sí        | Firma de los parámetros con su secretKey         |

### Respuestas
- **200**: Objeto SettlementV2
- **400**: Error del API
- **401**: Error de negocio

#### Ejemplo de respuesta 200
```json
{
  "id": 1001,
  "date": "2018-06-15",
  "taxId": "9999999-9",
  "name": "John Doe",
  "email": "johndoe@flow.cl",
  "currency": "CLP",
  "initial_balance": 0,
  "final_balance": 0,
  "transferred": 0,
  "billed": 0,
  "summary": {
    "transferred": [],
    "commission": [],
    "payment": [],
    "credit": [],
    "debit": [],
    "billed": []
  },
  "detail": {
    "payment": [],
    "debit": [],
    "credit": []
  }
}
```

#### Ejemplo de respuesta 400/401
```json
{
  "code": 400,
  "message": "Error del Api"
}
```

---

**Notas:**
- La firma (`s`) debe generarse con la secretKey del comercio.
- Para obtener detalles completos de una liquidación, primero consulte `/settlement/search` para obtener los IDs y luego utilice `/settlement/getByIdv2`.
