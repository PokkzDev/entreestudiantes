# Entre Estudiantes

**Una plataforma web integral para estudiantes universitarios que facilita la compraventa de productos, la oferta de servicios y la conexión directa entre miembros de la comunidad académica.**

## 📋 Resumen Ejecutivo

Entre Estudiantes es una aplicación web moderna desarrollada específicamente para estudiantes universitarios, diseñada para crear un ecosistema digital seguro y confiable donde los estudiantes pueden:

- **Vender productos** (libros, tecnología, materiales académicos, etc.)
- **Ofrecer servicios** (tutorías, diseño, programación, traducción, etc.)
- **Conectar directamente** sin intermediarios ni comisiones
- **Gestionar su presencia digital** académica y profesional

La plataforma aborda la necesidad real de los estudiantes de monetizar sus habilidades, encontrar recursos académicos asequibles y construir redes de apoyo dentro de su comunidad universitaria.

## 🎯 Objetivos del Proyecto

### Objetivo Principal
Crear una plataforma digital que empodere a los estudiantes universitarios para generar ingresos, acceder a recursos académicos y desarrollar habilidades empresariales en un entorno seguro y controlado.

### Objetivos Específicos
1. **Facilitar el intercambio económico** entre estudiantes sin intermediarios
2. **Promover el emprendimiento estudiantil** a través de servicios especializados
3. **Reducir costos académicos** mediante la reutilización de materiales
4. **Fomentar la colaboración** y el apoyo mutuo entre estudiantes
5. **Desarrollar habilidades digitales** y de marketing personal

## 🏗️ Arquitectura Técnica

### Stack Tecnológico

**Frontend:**
- **Next.js 15.3.2** - Framework React con renderizado híbrido (SSR/SSG)
- **React 19** - Biblioteca de interfaz de usuario
- **CSS Modules** - Estilos modulares y encapsulados
- **React Icons** - Iconografía consistente

**Backend:**
- **Next.js API Routes** - Endpoints RESTful integrados
- **NextAuth.js 4.24.11** - Autenticación y gestión de sesiones
- **Prisma ORM 6.7.0** - Mapeo objeto-relacional y migraciones

**Base de Datos:**
- **MySQL** - Base de datos relacional principal
- **Prisma Client** - Cliente de base de datos type-safe

**Servicios Externos:**
- **Cloudinary** - Gestión y optimización de imágenes
- **Resend** - Servicio de correo electrónico transaccional
- **Vercel** - Plataforma de despliegue y hosting

**Seguridad y Autenticación:**
- **bcryptjs** - Hashing de contraseñas
- **JWT** - Tokens de autenticación
- **Rate Limiting** - Protección contra ataques de fuerza bruta
- **CSRF Protection** - Protección contra ataques de falsificación

### Arquitectura de la Aplicación

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Routes    │    │   Database      │
│   (Next.js)     │◄──►│   (Next.js)     │◄──►│   (MySQL)       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   UI Components │    │   Business      │    │   Data Models   │
│   CSS Modules   │    │   Logic         │    │   Prisma Schema │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔧 Funcionalidades Principales

### 1. Sistema de Autenticación Robusto
- **Registro con verificación de email** obligatoria
- **Autenticación dual** (email o nombre de usuario)
- **Recuperación de contraseña** con tokens seguros
- **Validación de contraseñas** con requisitos de seguridad
- **Gestión de sesiones** con opción "Recuérdame"
- **Rate limiting** para prevenir ataques

### 2. Gestión Avanzada de Publicaciones
- **Publicación de productos y servicios** con categorización detallada
- **Gestión de imágenes** (hasta 4 por publicación, optimizadas automáticamente)
- **Estados de publicación** (activo/pausado) para control de visibilidad
- **Edición completa** de publicaciones existentes
- **Eliminación segura** con registro de auditoría
- **Sistema de precios** flexible (fijo o rango)

### 3. Búsqueda y Filtrado Inteligente
- **Búsqueda semántica** por título, descripción y tags
- **Filtros múltiples** por tipo, categoría y palabras clave
- **Categorización jerárquica** con más de 50 categorías específicas
- **Resultados optimizados** con paginación y carga eficiente
- **Interfaz responsive** adaptada a dispositivos móviles

### 4. Sistema de Categorías Especializado

**Productos (8 categorías principales):**
- Libros y apuntes (4 subcategorías)
- Tecnología (5 subcategorías)
- Papelería y oficina (4 subcategorías)
- Mobiliario y decoración (3 subcategorías)
- Moda y accesorios (3 subcategorías)
- Arte y manualidades (2 subcategorías)
- Deporte y outdoor (3 subcategorías)
- Alimentación y bebidas (3 subcategorías)

**Servicios (7 categorías principales):**
- Tutorías académicas (8 subcategorías)
- Diseño y multimedia (6 subcategorías)
- Traducción y redacción (5 subcategorías)
- Desarrollo y tecnología (6 subcategorías)
- Asesoría y desarrollo profesional (5 subcategorías)
- Bienestar y estilo de vida (4 subcategorías)
- Eventos y logística (3 subcategorías)

### 5. Gestión de Medios Avanzada
- **Subida de imágenes** con validación de formato y tamaño
- **Optimización automática** vía Cloudinary
- **Galería de imágenes** con visualización en carrusel
- **Eliminación automática** de imágenes huérfanas
- **Soporte para múltiples formatos** (JPG, PNG, WEBP)

### 6. Panel de Usuario Integral
- **Gestión de perfil** con foto personalizable
- **Historial de publicaciones** con métricas básicas
- **Configuraciones de cuenta** centralizadas
- **Cambio de contraseña** con validación robusta
- **Eliminación de cuenta** con registro de auditoría

### 7. Sistema de Contacto Directo
- **Múltiples métodos** (WhatsApp, email, teléfono)
- **Enlaces automáticos** para facilitar la comunicación
- **Sin intermediarios** ni comisiones
- **Privacidad protegida** del contacto

## 📊 Modelo de Datos

### Entidades Principales

**Usuario (User)**
```sql
- id: String (CUID)
- username: String (único)
- name: String
- email: String (único)
- password: String (hasheada)
- image: String (URL Cloudinary)
- bio: Text
- isVerified: Boolean
- verificationToken: String
- resetPasswordToken: String
- resetPasswordTokenExpiry: DateTime
- nameChangeCount: Int
- usernameChangeCount: Int
- createdAt: DateTime
- updatedAt: DateTime
```

**Publicación (Publicacion)**
```sql
- id: String (CUID)
- title: String
- description: Text
- type: String (producto/servicio)
- price: Decimal(10,2)
- images: Text (URLs separadas por comas)
- category: String
- contactMethod: String
- contactInfo: String
- status: String (activo/inactivo)
- location: String
- tags: String
- views: Int
- featured: Boolean
- authorId: String (FK)
- createdAt: DateTime
- updatedAt: DateTime
```

**Logs de Auditoría**
- `DeletedAccountLog`: Registro de cuentas eliminadas
- `DeletedPublicationLog`: Registro de publicaciones eliminadas

## 🔒 Características de Seguridad

### Autenticación y Autorización
- **Hashing de contraseñas** con bcryptjs y salt rounds
- **Tokens JWT** para gestión de sesiones
- **Verificación de email** obligatoria para activación
- **Tokens de recuperación** con expiración temporal
- **Validación de entrada** en frontend y backend

### Protección de Datos
- **Rate limiting** por IP para prevenir ataques
- **Validación de archivos** (tipo, tamaño, formato)
- **Sanitización de inputs** para prevenir XSS
- **Logs de auditoría** para eliminaciones
- **Eliminación segura** de datos sensibles

### Privacidad
- **Datos mínimos** requeridos para registro
- **Control de visibilidad** de publicaciones
- **Eliminación completa** de datos al cerrar cuenta
- **No tracking** de usuarios sin consentimiento

## 🎨 Experiencia de Usuario (UX/UI)

### Diseño Responsive
- **Mobile-first** approach
- **Breakpoints optimizados** para tablets y desktop
- **Navegación intuitiva** con menús adaptativos
- **Carga progresiva** de imágenes

### Interfaz Moderna
- **Design system** consistente
- **Paleta de colores** accesible
- **Tipografía** legible y jerárquica
- **Iconografía** coherente con React Icons

### Accesibilidad
- **Contraste adecuado** para legibilidad
- **Navegación por teclado** funcional
- **Etiquetas semánticas** para screen readers
- **Mensajes de error** claros y descriptivos

## 📈 Métricas y Analíticas

### Métricas de Usuario
- Número de registros completados
- Tasa de verificación de email
- Retención de usuarios activos
- Tiempo promedio de sesión

### Métricas de Contenido
- Publicaciones creadas por categoría
- Tasa de conversión de borradores
- Interacciones por publicación
- Búsquedas más frecuentes

### Métricas de Rendimiento
- Tiempo de carga de páginas
- Optimización de imágenes
- Eficiencia de consultas de base de datos
- Uptime de la aplicación

## 🚀 Flujos de Usuario Principales

### 1. Onboarding de Usuario
```
Registro → Verificación Email → Completar Perfil → Explorar Plataforma
```

### 2. Publicación de Producto/Servicio
```
Seleccionar Tipo → Elegir Categoría → Añadir Detalles → Subir Imágenes → 
Configurar Contacto → Confirmar → Publicar
```

### 3. Búsqueda y Descubrimiento
```
Aplicar Filtros → Ver Resultados → Seleccionar Publicación → 
Ver Detalles → Contactar Vendedor
```

### 4. Gestión de Publicaciones
```
Acceder Panel → Ver Mis Publicaciones → Editar/Pausar/Eliminar → 
Monitorear Rendimiento
```

## 🌟 Valor e Impacto

### Para Estudiantes Vendedores
- **Ingresos adicionales** sin comisiones
- **Desarrollo de habilidades** empresariales
- **Construcción de portafolio** digital
- **Networking** dentro de la comunidad universitaria

### Para Estudiantes Compradores
- **Acceso a recursos** académicos asequibles
- **Servicios especializados** de calidad
- **Confianza** en transacciones entre pares
- **Soporte académico** personalizado

### Para la Institución Educativa
- **Fomento del emprendimiento** estudiantil
- **Reducción de costos** académicos para estudiantes
- **Fortalecimiento** de la comunidad universitaria
- **Desarrollo de competencias** digitales

## 🔄 Roadmap de Desarrollo

### Fase 1 (Completada) - MVP
- ✅ Sistema de autenticación
- ✅ Publicación básica de productos/servicios
- ✅ Búsqueda y filtrado
- ✅ Gestión de imágenes
- ✅ Panel de usuario

### Fase 2 (En desarrollo)
- 🔄 Sistema de mensajería interna
- 🔄 Notificaciones push
- 🔄 Métricas avanzadas
- 🔄 Sistema de reputación

### Fase 3 (Planificada)
- 📋 Integración con sistemas universitarios
- 📋 API pública para desarrolladores
- 📋 Aplicación móvil nativa
- 📋 Sistema de pagos integrado

## 🛠️ Instalación y Desarrollo

### Requisitos Previos
- Node.js 18+ 
- MySQL 8.0+
- Cuenta en Cloudinary
- Cuenta en Resend

### Configuración Local
```bash
# Clonar repositorio
git clone [repository-url]
cd entreestudiantes

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local

# Ejecutar migraciones
npx prisma migrate dev

# Iniciar servidor de desarrollo
npm run dev
```

### Variables de Entorno Requeridas
```env
DATABASE_URL="mysql://user:password@localhost:3306/entreestudiantes"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
RESEND_API_KEY="your-resend-key"
```

## 📊 Estadísticas del Proyecto

- **Líneas de código**: ~15,000+
- **Componentes React**: 25+
- **Rutas API**: 20+
- **Modelos de datos**: 4 principales
- **Categorías de productos/servicios**: 50+
- **Idiomas soportados**: Español (extensible)
- **Tiempo de desarrollo**: 6 meses
- **Desarrolladores**: 1 (escalable)

## 🤝 Contribución y Colaboración

### Oportunidades de Investigación
- **Análisis de comportamiento** de usuarios universitarios
- **Optimización de algoritmos** de búsqueda y recomendación
- **Estudios de impacto** económico en comunidades estudiantiles
- **Desarrollo de IA** para categorización automática

### Colaboración Académica
- **Tesis de grado** en áreas de tecnología y emprendimiento
- **Proyectos de investigación** en economía digital estudiantil
- **Estudios de usabilidad** y experiencia de usuario
- **Análisis de datos** para insights académicos

## 📞 Contacto y Soporte

**Desarrollador Principal**: [Tu nombre]
**Email**: [tu-email@universidad.edu]
**Universidad**: [Nombre de tu universidad]
**Programa**: [Tu programa académico]

---

**Entre Estudiantes** - Conectando el talento estudiantil con las oportunidades del mañana.

*Desarrollado con ❤️ para la comunidad universitaria*


