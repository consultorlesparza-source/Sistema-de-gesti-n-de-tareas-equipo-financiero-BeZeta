# Sistema de Gestión de Tareas y KPIs — BeZeta (Gerencia de Finanzas)

Sistema web a medida para que el equipo financiero de BeZeta registre sus tareas, el
Gerente de Finanzas asigne fechas de entrega y el sistema monitoree el cumplimiento.
Diseño completo en [`SISTEM~1.docx`](SISTEM~1.docx).

## Estado del proyecto

- **Fase 1 — MVP (en construcción):** usuarios y roles, cargos, catálogo de tareas,
  tareas con máquina de estados, subida de evidencia. ✅ Backend y frontend funcionando
  end-to-end (login, mis tareas, enviar a revisión, validar).
- **Fase 2 — Automatización:** generación mensual automática y motor de notificaciones
  por correo (creación, aviso 3 días, vencimiento). Pendiente.
- **Fase 3 — KPI y reportes:** tablero de indicadores y exportación. Pendiente.

## Stack

- **Backend:** Python 3.12 + Django 6 + Django REST Framework + SimpleJWT.
- **Base de datos:** SQLite en desarrollo (por defecto) / PostgreSQL en producción
  (configurable vía `DATABASE_URL`).
- **Frontend:** React 19 + TypeScript + Vite + React Router + Axios.

## Estructura

```
backend/
  config/            # settings, urls, wsgi/asgi del proyecto Django
  usuarios/          # modelo de usuario (roles: gerente, colaborador, direccion)
  cargos/            # descriptores de cargo (RGI-BZ-xxx)
  catalogo_tareas/   # plantillas de tareas por cargo (periodicidad, peso KPI)
  tareas/            # instancias de tareas del periodo + máquina de estados + historial
  evidencias/        # archivos de respaldo por tarea
  notificaciones/    # registro de correos enviados (Fase 2)

frontend/
  src/api/           # cliente axios (JWT + refresh) y funciones por recurso
  src/context/        # AuthContext (sesión, login/logout)
  src/components/      # Layout, ProtectedRoute, EstadoBadge
  src/pages/          # LoginPage, HomePage, TareasColaboradorPage, TareasGerentePage
```

## Cómo correr el backend en local

```powershell
cd backend
..\venv\Scripts\Activate.ps1        # o crear el venv si no existe: python -m venv ..\venv
pip install -r requirements.txt
copy .env.example .env              # y completar valores si es necesario
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

La API queda disponible en `http://127.0.0.1:8000/api/`, el admin en
`http://127.0.0.1:8000/admin/`.

## Cómo correr el frontend en local

```powershell
cd frontend
npm install
copy .env.example .env    # VITE_API_URL, por defecto http://127.0.0.1:8000/api
npm run dev
```

Se abre en `http://localhost:5173/`. Requiere que el backend esté corriendo (ver
arriba) y que `CORS_ALLOWED_ORIGINS` en el backend incluya `http://localhost:5173`
(ya viene por defecto).

## Autenticación (API)

- `POST /api/auth/token/` → `{ "email": "...", "password": "..." }` devuelve
  `access` y `refresh` (JWT).
- `POST /api/auth/token/refresh/`
- `GET /api/usuarios/me/` → usuario autenticado.

## Endpoints principales

| Recurso | Ruta | Notas |
|---|---|---|
| Usuarios | `/api/usuarios/` | Solo Gerente gestiona; `me/` para cualquier rol |
| Cargos | `/api/cargos/` | Gerente gestiona; resto solo lectura |
| Catálogo de tareas | `/api/catalogo-tareas/` | Gerente gestiona; resto solo lectura |
| Tareas | `/api/tareas/` | Colaborador ve solo las suyas; Gerente ve todas |
| — enviar a revisión | `POST /api/tareas/{id}/enviar-a-revision/` | Colaborador propietario, requiere evidencia |
| — validar | `POST /api/tareas/{id}/validar/` | Solo Gerente: `entregado` / `parcial` / `no_logrado` |
| Evidencias | `/api/evidencias/` | Sin `DELETE`; solo se anula (`anulada=true`) |

## Deploy en Render + Supabase

La base de datos de producción es **Supabase** (Postgres administrado), no el Postgres
de Render. El repo incluye [`render.yaml`](render.yaml) (Blueprint) que crea el backend
(Django) y el frontend (sitio estático); la base de datos se conecta por variable de
entorno.

### Base de datos (Supabase)

1. En Supabase: **Project Settings → Database → Connect**.
2. Copia la connection string de **"Session pooler"** (⚠️ no "Direct connection": es IPv6
   y Render no la puede alcanzar; tampoco "Transaction pooler": no soporta prepared
   statements y rompe cosas del ORM). Formato:
   `postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres`
3. Esa URL completa va en la variable `DATABASE_URL` del backend en Render.

### Backend + frontend (Render)

1. **New +** → **Blueprint** → selecciona este repositorio → **Apply**. Te va a pedir
   completar `DATABASE_URL` (pega la connection string de Supabase), `CORS_ALLOWED_ORIGINS`
   y `VITE_API_URL` — deja estas dos últimas en blanco por ahora, ninguna URL existe todavía.
2. Cuando ambos servicios terminen de desplegar, anota sus URLs reales desde el
   dashboard de Render (arriba de cada servicio, con forma
   `https://<nombre-del-servicio>.onrender.com` — Render le agrega un sufijo
   aleatorio solo si el nombre ya está tomado por otra cuenta).
3. Cruza las URLs entre los dos servicios (**Environment** → editar variable → **Save Changes**,
   lo que dispara un redeploy automático):
   - En **bezeta-tareas-backend**: `CORS_ALLOWED_ORIGINS` = URL del frontend (sin `/` final).
   - En **bezeta-tareas-frontend**: `VITE_API_URL` = URL del backend + `/api` (ej.
     `https://bezeta-tareas-backend.onrender.com/api`).
4. Crea el superusuario de producción: en **bezeta-tareas-backend** → **Shell** →
   `python manage.py createsuperuser`.

**Si ya creaste el servicio manualmente (sin Blueprint):** el error típico es
`Could not open requirements file` porque Render busca `requirements.txt` en la raíz
del repo. En **Settings** del servicio, configura:
- **Root Directory:** `backend`
- **Build Command:** `pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate`
- **Start Command:** `gunicorn config.wsgi:application`
- Variables de entorno: `SECRET_KEY`, `DEBUG=False`, `DATABASE_URL` (connection string de
  Supabase, ver arriba), `CORS_ALLOWED_ORIGINS`.

**Limitación conocida:** el disco de Render es efímero (Fase 1). Los archivos de
evidencia subidos se guardan en `MEDIA_ROOT` local y **se pierden en cada deploy**.
Antes de usar esto en producción real hay que migrar a almacenamiento de objetos
(S3 / Google Cloud Storage), tal como recomienda la sección 7 del documento de diseño.

## Roles

- **gerente**: acceso total, valida estados finales de las tareas.
- **colaborador**: ve y gestiona solo sus propias tareas; puede llevar la tarea hasta
  "en revisión".
- **direccion**: solo lectura sobre catálogo/tareas (reportes y KPI, a completar en Fase 3).
