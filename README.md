# Sistema de Gestión de Licitaciones
Aplicación web full-stack para la gestión del ciclo de vida de licitaciones comerciales, desde su creación y envío de la propuesta hasta el seguimiento de la fecha límite, resolución, facturación y cobro.
El proyecto fue desarrollado como prueba técnica para un perfil de Desarrollador Jr/Mid. La prueba solicita una aplicación funcional que permita redactar una licitación, asociarle productos, adjuntar una propuesta formal, enviarla al cliente mediante correo transaccional, realizar seguimiento de su vencimiento, registrar su resolución y gestionar el cobro, manteniendo trazabilidad mediante auditoría. 
## 1. Descripción General
El sistema permite administrar:
- Clientes
- Usuarios
- Productos
- Licitaciones
- Productos asociados a una licitación
- Documentos de propuesta
- Pagos completos o parciales
- Historial de cambios y transiciones
- Recordatorios automáticos de vencimiento
La aplicación implementa autenticación mediante JWT, control básico por roles, auditoría de cambios y reglas de negocio para controlar las transiciones de estado de una licitación.

#### Flujo principal
```text
Crear cliente
    │
    ▼
Crear productos
    │
    ▼
Crear licitación en borrador
    │
    ├── Asociar productos
    ├── Definir presupuesto máximo
    ├── Definir fecha límite
    └── Adjuntar propuesta
            │
            ▼
       Licitación activa
            │
            ├── Correo automático al cliente
            │
            ├── Seguimiento de fecha límite
            │
            ├── Recordatorio < 48 h
            │
            └── Vencimiento automático
            │
                    │
                    ▼
          ┌───────────────────┐
          │ Resolución        │
          ├───────────────────┤
          │ Finalizada        │
          │ Perdida           │
          └─────────┬─────────┘
                    │
                    ▼
             Por cobrar
                    │
                    ▼
                Cobrada
```
## 2. Arquitectura
El proyecto utiliza una arquitectura desacoplada entre frontend y backend:
```text 
                         ┌──────────────────────┐
                         │       Usuario        │
                         └──────────┬───────────┘
                                    │ HTTPS
                                    ▼
                         ┌──────────────────────┐
                         │ React + Vite         │
                         │ Frontend             │
                         │ Vercel               │
                         └──────────┬───────────┘
                                    │ REST / JWT
                                    ▼
                         ┌──────────────────────┐
                         │ FastAPI              │
                         │ Backend              │
                         │ Render               │
                         └───────┬──────┬───────┘
                                 │      │
                   ┌─────────────┘      └──────────────┐
                   ▼                                   ▼
        ┌────────────────────┐              ┌────────────────────┐
        │ Supabase           │              │ Mailgun            │
        │ PostgreSQL         │              │ Email transaccional│
        │ Storage            │              └────────────────────┘
        └────────────────────┘
                   ▲
                   │
        ┌──────────┴───────────┐
        │ cron-job.org         │
        │ Tareas programadas   │
        └──────────────────────┘
```

## 3. Tech Stack
### 3.1 Tecnologías
#### Frontend
- React 19
- Vite
- React Router DOM
- Zustand
- Axios
- React DatePicker
- Supabase JS
- JavaScript / JSX
- CSS
#### Backend
- Python 3.11+
- FastAPI
- Uvicorn
- Pydantic
- Pydantic Settings
- Supabase Python Client
- python-jose
- Argon2
- HTTPX
- python-multipart
#### Servicios externos
- Supabase
  - PostgreSQL
  - Storage
- Mailgun
  - Email transaccional
- Render
  - Backend
- Vercel
  - Frontend
- cron-job.org
  - Scheduler externo

### 3.2 Componentes
| Componente | Tecnología | Responsabilidad |
|---|---|---|
| Frontend | React 19 + Vite | Interfaz de usuario |
| Routing | React Router | Navegación |
| Estado | Zustand | Estado de autenticación |
| HTTP | Axios | Comunicación con API |
| Backend | FastAPI | API REST y reglas de negocio |
| Base de datos | PostgreSQL / Supabase | Persistencia |
| Storage | Supabase Storage | Documentos de propuestas |
| Email | Mailgun | Correos transaccionales y adjuntos |
| Scheduler | cron-job.org | Ejecución periódica de tareas |
| Hosting frontend | Vercel | Despliegue del frontend |
| Hosting backend | Render | Despliegue de la API |

## 4. Estructura del proyecto
```text
SistemasLicitaciones/
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── endpoints/
│   │   │       ├── cliente_endpoints.py
│   │   │       ├── licitacion_endpoints.py
│   │   │       ├── producto_endpoints.py
│   │   │       └── usuario_endpoints.py
│   │   │
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── security.py
│   │   │   └── time.py
│   │   │
│   │   ├── models/
│   │   │   └── db.py
│   │   │
│   │   ├── schemas/
│   │   │   ├── cliente_schema.py
│   │   │   ├── historial_schema.py
│   │   │   ├── licitacion_schema.py
│   │   │   ├── producto_schema.py
│   │   │   └── usuario_schema.py
│   │   │
│   │   ├── services/
│   │   │   ├── cliente_services.py
│   │   │   ├── licitacion_services.py
│   │   │   ├── mailgun_service.py
│   │   │   ├── producto_services.py
│   │   │   └── usuario_services.py
│   │   │
│   │   ├── tasks/
│   │   │   └── licitacion_tasks.py
│   │   │
│   │   ├── utils/
│   │   │   └── audit_utils.py
│   │   │
│   │   └── main.py
│   │
│   ├── requirements.txt
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── store/
│   │   ├── styles/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   │
│   ├── package.json
│   └── vite.config.js
│
├── render.yaml
├── runtime.txt
└── README.md
```

## 5. Instalación local
### Requisitos
- Python 3.11+
- Node.js 18+
- npm
- Cuenta de Supabase
- Cuenta de Mailgun para pruebas de correo
- Git
### 5.1 Clonar el repositorio
```bash
git clone <URL_DEL_REPOSITORIO>
cd SistemasLicitaciones
```

### 5.2 Configurar backend
Entrar al backend:
```bash
cd backend
```

Crear entorno virtual:
#### Windows
```cmd
python -m venv venv
venv\Scripts\activate
```
#### Linux / macOS
```bash
python3 -m venv venv
source venv/bin/activate
```

Instalar dependencias:
```bash
pip install -r requirements.txt
```
### 5.3 Ejecutar backend
Desde `backend/`:
```bash
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API local:
```text
http://localhost:8000
```

Health check:
```text
http://localhost:8000/health
```

Swagger:
```text
http://localhost:8000/docs
```
FastAPI genera automáticamente la documentación interactiva de la API.


### 5.4 Configurar frontend
Abrir otra terminal:
```bash
cd frontend
```

Instalar dependencias:
```bash
npm install
```

Crear:
```text
frontend/.env.local
```

Añadir las variables:
```env
VITE_API_URL=http://localhost:8000/api
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable-key>
```

Para levantar el frontend ejecutar:
```bash
npm run dev
```

URL Frontend:
```text
http://localhost:5173
```

## 6. Gestión de documentos
Los documentos de propuesta se almacenan en:
```text
Supabase Storage
    └── bucket: propuestas
```

La ruta utiliza una estructura similar a:
```text
licitaciones/{licitacion_id}/{nombre_archivo}
```

Al subir el archivo:
1. El frontend envía el archivo mediante `multipart/form-data`.
2. FastAPI recibe el `UploadFile`.
3. El backend normaliza el nombre del archivo.
4. El archivo se sube al bucket `propuestas`.
5. Se obtiene una URL pública.
6. La URL se almacena en `licitaciones.documento_url`.
7. Se registra el cambio en auditoría.
8. Si la licitación estaba en `borrador`, se activa y se envía el correo.

## 7. Correos transaccionales
El sistema utiliza **Mailgun** para enviar correos reales.
### Correo inicial
Cuando una licitación pasa a activa, el cliente recibe:
- Número de licitación
- Presupuesto máximo
- Fecha límite
- Total de productos
- Listado de productos
- Documento de propuesta como adjunto

### Recordatorio vencimiento
Cuando faltan menos de 48 horas:
- Se envía un segundo correo.
- Incluye el resumen de la licitación.
- Incluye nuevamente el documento de propuesta como adjunto.
- Solo se envía una vez por licitación gracias al campo `recordatorio_vencimiento_enviado`.
El correo de la propuesta utiliza `multipart/form-data` con el parámetro `attachment` para enviar el archivo a Mailgun.

## 8. Automatización con cron-job.org
Actualmente las tareas programadas se ejecutan mediante un cron externo.
Endpoint:
```text
POST /api/licitaciones/tareas/procesar-licitaciones
```

URL de producción:
```text
https://sistemaslicitaciones.onrender.com/api/licitaciones/tareas/procesar-licitaciones
```

El endpoint está protegido mediante el header:
```text
X-Cron-Secret: <CRON_SECRET>
```

En cada ejecución se procesan dos tareas:
```text
1. marcar_licitaciones_vencidas()
2. enviar_recordatorios_vencimiento()
```

### Ejemplo
```bash
curl -X POST \
  "https://sistemaslicitaciones.onrender.com/api/licitaciones/tareas/procesar-licitaciones" \
  -H "X-Cron-Secret: TU_CLAVE"
```

La frecuencia puede configurarse en cron-job.org. Para este proyecto por ejemplo, se puede configurar una ejecución cada 10 minutos.

### ¿Por qué un cron externo?
La aplicación necesita tareas periódicas para:
- Detectar licitaciones vencidas.
- Enviar recordatorios próximos al vencimiento.
- Es un servicio que se puede implementar gratuitamente en producción.

El scheduler externo permite ejecutar estas tareas sin mantener un worker persistente separado en el hosting del backend.

## 9. Despliegue
### Frontend — Vercel
El frontend se despliega como aplicación Vite.
URL de producción:
```text
https://sistemas-licitaciones.vercel.app
```

### Backend — Render
El backend se ejecuta con Uvicorn.
Comando de inicio:
```bash
python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

URL de producción:
```text
https://sistemaslicitaciones.onrender.com
```

Health check:
```text
https://sistemaslicitaciones.onrender.com/health
```

Swagger: 
```text
https://sistemaslicitaciones.onrender.com/docs
```
