# Introducción

¡Bienvenido a la documentación de referencia del API REST de Flow!

REST es un protocolo de servicio web que permite un desarrollo rápido mediante el uso de la tecnología HTTP y JSON.

La API REST de Flow proporciona un amplio conjunto de operaciones y recursos para:

- **Payments (Pagos)**
- **Customer (Clientes, cobros, cargos automáticos)**
- **Refunds (Reembolsos)**
- **Subscriptions (Suscripciones, cobros recurrentes)**
- **Subscriptions Items (Ítems adicionales de suscripciones)**
- **Coupons (Cupones de descuento para suscripciones)**
- **Settlement (Liquidaciones de pagos, reembolsos y comisiones)**
- **Merchants (Gestión de comercios asociados)**

## Versionamiento

La API se encuentra en constante crecimiento, añadiendo nuevos servicios y/o mejorando funcionalidades existentes para que nuestros clientes puedan sacar el mayor provecho posible a sus integraciones. Por lo mismo, cada vez que se hacen cambios en la API se considera que son compatibles con las versiones anteriores.

FLOW considera los siguientes cambios como compatibles con versiones anteriores:

- Añadir nuevos servicios
- Añadir nuevos parámetros opcionales a servicios existentes
- Añadir nuevas propiedades a respuestas de servicios existentes
- Modificar el orden de las propiedades en respuestas existentes

Instamos a nuestros clientes a considerar estos aspectos en sus integraciones para evitar inconvenientes con nuevas versiones.

Para más información sobre los cambios, puede revisar el changelog del API y suscribirse a nuestra lista de correos para enterarse de anuncios de la API.

## Acceso al API

Si tienes una cuenta en Flow, puedes acceder al API REST mediante los siguientes endpoints:

| Site        | Base URL for Rest Endpoints         |
|-------------|-------------------------------------|
| Producción  | https://www.flow.cl/api             |
| Sandbox     | https://sandbox.flow.cl/api         |

El endpoint de Producción permite generar transacciones reales. El endpoint Sandbox permite probar la integración sin afectar datos reales.

## Autenticación y Seguridad

El API soporta como método de autenticación el **APIKey** y como seguridad, los datos enviados deben estar firmados con su **SecretKey**. Así, Flow verifica que los datos enviados le pertenecen y que no fueron adulterados durante la transmisión. Además, los datos viajan encriptados mediante SSL.

Tanto su ApiKey como su SecretKey se obtienen desde su cuenta de Flow:

| Sitio      | Mi cuenta Flow                                      |
|------------|-----------------------------------------------------|
| Producción | https://www.flow.cl/app/web/misDatos.php            |
| Sandbox    | https://sandbox.flow.cl/app/web/misDatos.php        |

### ¿Cómo firmar con su SecretKey?

Se deben firmar todos los parámetros menos el parámetro `s` (donde va la firma). Primero, ordene los parámetros alfabéticamente por nombre. Luego, concatene los parámetros en un string de la forma:

`nombre_parametro valor nombre_parametro valor ...`

**Ejemplo:**

Si sus parámetros son:

- `apiKey = XXXX-XXXX-XXXX`
- `currency = CLP`
- `amount = 5000`

El string ordenado para firmar sería:

`amount5000apiKeyXXXX-XXXX-XXXXcurrencyCLP`

El string concatenado se debe firmar con la función HMAC usando el algoritmo sha256 y su secretKey como llave.

**Ejemplo PHP:**

```php
$params = array(
  "apiKey" => "1F90971E-8276-4715-97FF-2BLG5030EE3B",
  "token" => "AJ089FF5467367"
);
$keys = array_keys($params);
sort($keys);
$toSign = "";
foreach($keys as $key) {
  $toSign .= $key . $params[$key];
};
$signature = hash_hmac('sha256', $toSign, $secretKey);
```

**Otros lenguajes:**

- **Java:**
  ```java
  String sign = hmacSHA256(secretKey, string_to_sign);
  ```
- **Ruby:**
  ```ruby
  OpenSSL::HMAC.hexdigest(OpenSSL::Digest.new('sha256'), secret_key, string_to_sign)
  ```
- **Javascript:**
  ```js
  var sign = CryptoJS.HmacSHA256(stringToSign, secretKey);
  ```

## Consumiendo servicios método GET

Una vez obtenida la firma de los parámetros, agregue el parámetro `s` con el valor del hash obtenido.

**Ejemplo PHP:**

```php
$url = 'https://www.flow.cl/api/payment/getStatus';
$params["s"] = $signature;
$url = $url . "?" . http_build_query($params);
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, TRUE);
$response = curl_exec($ch);
// Manejo de errores...
```

## Consumiendo servicios método POST

De igual forma, agregue el parámetro `s` con el valor del hash obtenido.

**Ejemplo PHP:**

```php
$url = 'https://www.flow.cl/api/payment/create';
$params["s"] = $signature;
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, TRUE);
curl_setopt($ch, CURLOPT_POST, TRUE);
curl_setopt($ch, CURLOPT_POSTFIELDS, $params);
$response = curl_exec($ch);
// Manejo de errores...
```

## Notificaciones de Flow a su comercio

Para todas las transacciones asíncronas, Flow envía notificaciones a sus páginas de callback mediante POST (`content-type: application/x-www-form-urlencoded`), enviando como parámetro un token. Con este token, el comercio debe invocar el servicio correspondiente para obtener los datos.

**Ejemplo:**

- En `payment/create`, el parámetro `urlConfirmation` es la URL donde Flow notificará el estado del pago. El comercio recibirá el token y deberá invocar `payment/getStatus` para obtener el resultado.

| Servicio                | Url callback     | Método para obtener el resultado         |
|-------------------------|------------------|------------------------------------------|
| payment/create          | urlConfirmation  | payment/getStatus                        |
| payment/createEmail     | urlConfirmation  | payment/getStatus                        |
| refund/create           | urlCallback      | refund/getStatus                         |
| customer/register       | url_return       | customer/getRegisterStatus               |
| customer/collect        | urlConfirmation  | payment/getStatus                        |
| customer/batchCollect   | urlCallback      | customer/getBatchCollectStatus           |
| customer/batchCollect   | urlConfirmation  | payment/getStatus                        |

## Códigos de error de intentos de pago

Al utilizar los servicios extendidos `payment/getStatusExtended` y `payment/getStatusByFlowOrderExtended` se puede obtener la información de error en el último intento de pago. Los códigos existentes son:

| Código | Descripción                                 |
|--------|---------------------------------------------|
| -1     | Tarjeta inválida                            |
| -11    | Excede límite de reintentos de rechazos     |
| -2     | Error de conexión                           |
| -3     | Excede monto máximo                         |
| -4     | Fecha de expiración inválida                 |
| -5     | Problema en autenticación                   |
| -6     | Rechazo general                             |
| -7     | Tarjeta bloqueada                           |
| -8     | Tarjeta vencida                             |
| -9     | Transacción no soportada                    |
| -10    | Problema en la transacción                  |
| 999    | Error desconocido                           |

## Paginación

Todos los servicios que retornan listas entregan los resultados paginados. Los parámetros son:

- `start`: número de registro de inicio de la página (por omisión 0)
- `limit`: número de registros por página (por omisión 10, máximo 100)

La respuesta incluye:

```json
{
  "total": número de registros totales,
  "hasMore": 1 si hay más páginas, 0 si no,
  "data": [{}] // arreglo con los registros
}
```

Si `hasMore` es 1, sume el valor de `limit` a `start` y vuelva a invocar el servicio hasta que `hasMore` sea 0.

## Clientes API

Disponemos de los siguientes clientes API Rest para facilitar la integración con Flow:

- **PHP:** [https://github.com/flowcl/PHP-API-CLIENT](https://github.com/flowcl/PHP-API-CLIENT)

## Postman

Disponemos de colecciones de Postman para probar los distintos servicios del API. Estas colecciones incluyen el algoritmo de firmado pre-programado.

Para utilizarlas, cree un Environment con las siguientes variables:

- `apiKey`: apiKey obtenida de su cuenta Flow
- `secretKey`: secretKey obtenida de su cuenta Flow
- `Hosting`: sandbox.flow.cl para ambiente sandbox o www.flow.cl para ambiente productivo

Colecciones disponibles:

- Flow Payment
- Flow Customer
- Flow Plans
- Flow Subscription
- Flow Coupon
- Flow Invoices
- Flow Refund
- Flow Settlements
- Flow Merchant

## Realizar pruebas en nuestro ambiente Sandbox

Puede realizar pruebas en el ambiente Sandbox para los distintos medios de pago.

### Tarjetas de prueba Chile

| Dato                    | Valor                |
|-------------------------|----------------------|
| N° tarjeta de crédito   | 4051885600446623     |
| Año de expiración       | Cualquiera           |
| Mes de expiración       | Cualquiera           |
| CVV                     | 123                  |

En la simulación del banco usar:

| Dato | Valor         |
|------|--------------|
| Rut  | 11111111-1   |
| Clave| 123          |

Para los medios de pago Servipag, Multicaja, Mach, Cryptocompra, se presentan simuladores de pago donde solo debe hacer clic en aceptar.

### Tarjetas de prueba Perú y México

| Dato                  | Valor                |
|-----------------------|----------------------|
| N° tarjeta de crédito | 5293138086430769     |
| Año de expiración     | Cualquiera           |
| Mes de expiración     | Cualquiera           |
| CVV                   | 123                  |
