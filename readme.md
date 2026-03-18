# 📝 MiniBlog API

![Node.js](https://img.shields.io/badge/Node.js-v24-green)
![Express](https://img.shields.io/badge/Express-4.x-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue)
![Tests](https://img.shields.io/badge/tests-145%20passing-brightgreen)
![Deploy](https://img.shields.io/badge/deploy-Railway-purple)
![License](https://img.shields.io/badge/license-MIT-yellow)

API REST para gestión de un miniblog con autores y posts. Permite crear, leer, actualizar y eliminar autores y posts, con validaciones de campos, control de unicidad de email y manejo centralizado de errores.

- **Repositorio**: [HRamiroAlbornoz/ProyectoM2_HernanRamiroAlbornoz](https://github.com/HRamiroAlbornoz/ProyectoM2_HernanRamiroAlbornoz)
- **API en producción**: https://proyectom2hernanramiroalbornoz-production.up.railway.app
- **Documentación interactiva (local)**: http://localhost:3000/api/docs

---

## 🛠️ Tecnologías utilizadas

- **Node.js** v24
- **Express** — framework web
- **PostgreSQL** — base de datos relacional
- **Railway** — plataforma de deploy
- **Vitest** + **Supertest** — testing
- **OpenAPI 3.0** + **Swagger UI** — documentación interactiva

---

## 📁 Estructura del proyecto

```
ProyectoM2/
├── src/
│   ├── app.js              # Configuración de Express
│   ├── asyncHandler.js     # Wrapper para funciones async
│   ├── errorHandler.js     # Middleware central de errores
│   ├── errors.js           # Helpers de errores HTTP
│   ├── swagger.js          # Configuración de Swagger UI
│   └── validator.js        # Validaciones y sanitización
├── routes/
│   ├── authors.routes.js   # Endpoints de autores
│   └── posts.routes.js     # Endpoints de posts
├── db/
│   ├── config.js           # Configuración del pool PostgreSQL
│   ├── setup.sql           # Schema y seed de la base de datos
│   └── test-connection.js  # Script de verificación de conexión
├── tests/
│   ├── app.test.js         # Tests de rutas generales
│   ├── authors.test.js     # Tests de endpoints de autores
│   ├── posts.test.js       # Tests de endpoints de posts
│   └── validator.test.js   # Tests unitarios de validaciones
├── .env.example            # Variables de entorno de ejemplo
├── openapi.yaml            # Especificación OpenAPI 3.0
├── server.js               # Punto de entrada de la aplicación
└── vitest.config.js        # Configuración de Vitest
```

---

## 🔗 Endpoints disponibles

### 👤 Authors

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/authors` | Listar todos los autores |
| GET | `/api/authors/:id` | Obtener un autor por ID |
| POST | `/api/authors` | Crear un autor |
| PUT | `/api/authors/:id` | Actualizar un autor |
| DELETE | `/api/authors/:id` | Eliminar un autor |

### 📄 Posts

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/posts` | Listar todos los posts |
| GET | `/api/posts/:id` | Obtener un post por ID |
| GET | `/api/posts/author/:authorId` | Posts de un autor con sus datos |
| POST | `/api/posts` | Crear un post |
| PUT | `/api/posts/:id` | Actualizar un post |
| DELETE | `/api/posts/:id` | Eliminar un post |

---

## 💡 Ejemplos de uso

### Listar todos los autores
```bash
curl https://proyectom2hernanramiroalbornoz-production.up.railway.app/api/authors
```

### Obtener un autor por ID
```bash
curl https://proyectom2hernanramiroalbornoz-production.up.railway.app/api/authors/1
```

### Crear un autor
```bash
curl -X POST https://proyectom2hernanramiroalbornoz-production.up.railway.app/api/authors \
  -H "Content-Type: application/json" \
  -d '{"name": "Hernán Albornoz", "email": "hernan@mail.com", "bio": "Desarrollador backend"}'
```

### Actualizar un autor
```bash
curl -X PUT https://proyectom2hernanramiroalbornoz-production.up.railway.app/api/authors/1 \
  -H "Content-Type: application/json" \
  -d '{"name": "Hernán Albornoz", "email": "hernan@mail.com", "bio": "Bio actualizada"}'
```

### Eliminar un autor
```bash
curl -X DELETE https://proyectom2hernanramiroalbornoz-production.up.railway.app/api/authors/1
```

### Listar todos los posts
```bash
curl https://proyectom2hernanramiroalbornoz-production.up.railway.app/api/posts
```

### Obtener posts de un autor con sus datos
```bash
curl https://proyectom2hernanramiroalbornoz-production.up.railway.app/api/posts/author/1
```

### Crear un post
```bash
curl -X POST https://proyectom2hernanramiroalbornoz-production.up.railway.app/api/posts \
  -H "Content-Type: application/json" \
  -d '{"title": "Mi primer post", "content": "Contenido del post", "author_id": 1, "published": true}'
```

---

## 📚 Documentación interactiva

La documentación OpenAPI está disponible en Swagger UI únicamente en desarrollo local:

**Local**: http://localhost:3000/api/docs

> En producción Swagger UI está deshabilitado. Para explorar los endpoints
> en producción podés usar la especificación OpenAPI incluida en el repositorio
> (`openapi.yaml`) pegándola en [editor.swagger.io](https://editor.swagger.io).

---

## 🚀 Instalación local

### ✅ Requisitos

- Node.js v20 o superior
- PostgreSQL instalado y corriendo localmente, o acceso a una instancia remota

### 📋 Pasos

**1. Clonar el repositorio**
```bash
git clone https://github.com/HRamiroAlbornoz/ProyectoM2_HernanRamiroAlbornoz.git
cd ProyectoM2_HernanRamiroAlbornoz
```

**2. Instalar dependencias**
```bash
npm install
```

**3. Configurar las variables de entorno**

Copiá el archivo de ejemplo y completá los valores:
```bash
cp .env.example .env
```

**4. Crear las tablas y cargar datos de prueba**

Ejecutá el script SQL en tu base de datos:
```bash
psql -U tu_usuario -d miniblog_dev -f db/setup.sql
```

**5. Verificar la conexión**
```bash
npm run db:test
```

**6. Levantar el servidor**
```bash
npm run dev
```

El servidor estará disponible en `http://localhost:3000`.

---

## 🔐 Variables de entorno

| Variable | Descripción | Obligatoria | Ejemplo |
|----------|-------------|-------------|---------|
| `DATABASE_URL` | URL completa de conexión a PostgreSQL | Sí (recomendado) | `postgresql://user:pass@host:5432/db` |
| `DB_HOST` | Host de PostgreSQL | Solo sin `DATABASE_URL` | `localhost` |
| `DB_PORT` | Puerto de PostgreSQL | Solo sin `DATABASE_URL` | `5432` |
| `DB_NAME` | Nombre de la base de datos | Solo sin `DATABASE_URL` | `miniblog_dev` |
| `DB_USER` | Usuario de PostgreSQL | Solo sin `DATABASE_URL` | `postgres` |
| `DB_PASSWORD` | Contraseña de PostgreSQL | Solo sin `DATABASE_URL` | `tu_password` |
| `PORT` | Puerto del servidor Express | No | `3000` |
| `NODE_ENV` | Entorno de ejecución | No | `development` |

> Si `DATABASE_URL` está definida, las variables `DB_*` individuales son ignoradas.

Ejemplo de `.env` para desarrollo local:
```env
DATABASE_URL=postgresql://usuario:password@localhost:5432/miniblog_dev
PORT=3000
NODE_ENV=development
```

Ejemplo de `.env` apuntando a Railway:
```env
DATABASE_URL=postgresql://usuario:password@host-publico.railway.app:puerto/railway
PORT=3000
NODE_ENV=development
```

---

## ⚙️ Scripts disponibles

| Script | Comando | Descripción |
|--------|---------|-------------|
| `npm start` | `node server.js` | Inicia el servidor en producción |
| `npm run dev` | `node --env-file=.env --watch server.js` | Inicia el servidor en desarrollo con hot reload |
| `npm run db:test` | `node --env-file=.env db/test-connection.js` | Verifica la conexión a PostgreSQL |
| `npm test` | `vitest` | Corre los tests en modo watch |
| `npm run test:run` | `vitest run` | Corre los tests una sola vez |
| `npm run test:coverage` | `vitest run --coverage` | Corre los tests con reporte de cobertura |

---

## 🧪 Tests

El proyecto cuenta con 145 tests distribuidos en 4 archivos.

> Los tests usan mocks del pool de PostgreSQL — no requieren una base de datos
> corriendo para ejecutarse. Pueden correrse en cualquier entorno sin configuración adicional.

### Correr todos los tests
```bash
npm run test:run
```

### Modo watch (re-corre al guardar)
```bash
npm test
```

### Con reporte de cobertura
```bash
npm run test:coverage
```

El reporte de cobertura se genera en la carpeta `coverage/`.

### 📊 Distribución de tests

| Archivo | Tipo | Tests |
|---------|------|-------|
| `tests/validator.test.js` | Unitarios | 76 |
| `tests/posts.test.js` | Integración | 33 |
| `tests/authors.test.js` | Integración | 28 |
| `tests/app.test.js` | Integración | 8 |

---

## 🚂 Deploy en Railway

### 🔑 Variables de entorno en Railway

En el dashboard de Railway, configurá las siguientes variables en tu servicio de aplicación:

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | URL interna de conexión a PostgreSQL (Railway la genera automáticamente al vincular los servicios) |
| `NODE_ENV` | Valor: `production` |
| `PORT` | Railway lo asigna automáticamente — no es necesario configurarlo |

### 🔗 Conectar la base de datos

1. En Railway, creá un servicio de **PostgreSQL**
2. En el servicio de la aplicación, vinculalo con la base de datos desde **Variables → Add Reference**
3. Railway inyecta `DATABASE_URL` automáticamente con la URL interna

### 🌐 URLs de conexión

| Variable | Uso |
|----------|-----|
| `DATABASE_URL` | Conexión interna entre servicios en Railway (producción) |
| `DATABASE_PUBLIC_URL` | Conexión externa desde tu máquina local (desarrollo apuntando a Railway) |

### 🗄️ Ejecutar el setup SQL en Railway

Una vez desplegado, podés ejecutar el schema desde tu máquina usando `DATABASE_PUBLIC_URL`:

```bash
psql "postgresql://usuario:password@host-publico.railway.app:puerto/railway" -f db/setup.sql
```

---

## 🤖 Uso de Inteligencia Artificial

Este proyecto fue desarrollado con asistencia de **Claude** (Anthropic) como herramienta de apoyo durante el proceso de desarrollo.

### 🔧 Áreas donde se utilizó IA

- **Generación de tests**: estructura de tests con Vitest y Supertest, casos edge y valores límite
- **Centralización de errores**: diseño del patrón `errors.js`, `errorHandler.js` y `asyncHandler.js`
- **Documentación OpenAPI**: generación y mejora iterativa del archivo `openapi.yaml`
- **Integración de Swagger UI**: configuración de `swagger-ui-express` en el proyecto
- **Refactorización**: extracción de `validator.js`, separación de `app.js` y `server.js`
- **Resolución de problemas**: diagnóstico del problema de hoisting ESM con variables de entorno
- **Deploy en Railway**: configuración de `DATABASE_URL`, SSL y scripts de producción

### 📌 Criterio de uso

La IA fue utilizada como herramienta de apoyo y aceleración del desarrollo. Todas las decisiones de arquitectura, revisión de código y comprensión del funcionamiento fueron responsabilidad del desarrollador.

---

## 📄 Licencia

Este proyecto está bajo la licencia **MIT**.

```
MIT License

Copyright (c) 2026 Hernán Ramiro Albornoz

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 👤 Autor

**Hernán Ramiro Albornoz**

- GitHub: [@HRamiroAlbornoz](https://github.com/HRamiroAlbornoz)
- Repositorio: [ProyectoM2_HernanRamiroAlbornoz](https://github.com/HRamiroAlbornoz/ProyectoM2_HernanRamiroAlbornoz)