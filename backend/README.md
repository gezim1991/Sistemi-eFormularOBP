# e-Aplikim — Backend API

Production-ready Django REST Framework backend për platformën e menaxhimit të formularëve elektronikë.

## Stack

- **Django 5.1** + **Django REST Framework 3.15**
- **PostgreSQL 16**
- **ReportLab** për gjenerim PDF server-side
- **Session auth** me HttpOnly cookies
- **Docker** + **docker-compose**

## Modulet

| App             | Përgjegjësia                                                                  |
| --------------- | ----------------------------------------------------------------------------- |
| `accounts`      | Login/logout, modeli User, role (AK / OPB / ADMIN)                            |
| `institutions`  | Menaxhim institucionesh                                                       |
| `forms`         | Krijim/editim formularësh, workflow, gjenero PDF, shkarko, ngarko, dorëzo OPB |
| `documents`     | Ruajtje skedarësh (PDF i gjeneruar, PDF i firmosur)                           |
| `audit`         | AuditLog — çdo veprim kritik regjistrohet                                     |
| `notifications` | Njoftime për OPB kur AK dorëzon formular                                      |

## Instalim i shpejtë (Development)

### Me Docker (rekomandohet)

```bash
cd backend
cp .env.example .env        # Edito SECRET_KEY
docker compose up --build
```

### Pa Docker

```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
# Krijo databazën PostgreSQL dhe plotëso .env

python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

## Komandat kryesore

```bash
# Migrime
python manage.py migrate

# Krijo super-admin
python manage.py createsuperuser

# Nis server-in
python manage.py runserver

# Testet
python manage.py test apps.forms

# Të gjitha testet
python manage.py test

# Shell interaktiv
python manage.py shell
```

## Variablat e mjedisit (.env)

```env
SECRET_KEY=...                          # I detyrueshëm në production
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_URL=...                        # Ose POSTGRES_* variablat
CORS_ALLOWED_ORIGINS=http://localhost:3000
CSRF_TRUSTED_ORIGINS=http://localhost:3000
STORAGE_BACKEND=local                   # ose 's3'
MAX_UPLOAD_SIZE_MB=10
```

## Endpoints API

### Auth

```
POST   /api/auth/login/          → login me email/password
POST   /api/auth/logout/         → logout
GET    /api/auth/me/             → profili i sesionit aktiv
GET    /api/auth/csrf/           → merr CSRF token
```

### Forms

```
GET    /api/forms/               → listë (filtrohet sipas rolit)
GET    /api/forms/?scope=opb     → formulat e dorëzuara (OPB view)
POST   /api/forms/               → krijo (vetëm AK)
GET    /api/forms/{id}/          → detaje
PATCH  /api/forms/{id}/          → edito (vetëm AK/ADMIN)
DELETE /api/forms/{id}/          → fshi (AK/ADMIN)

POST   /api/forms/{id}/generate-pdf/    → gjenero PDF
GET    /api/forms/{id}/download-pdf/    → shkarko PDF
POST   /api/forms/{id}/upload-signed/   → ngarko PDF të firmosur
POST   /api/forms/{id}/submit-to-opb/  → dorëzo në OPB
POST   /api/forms/{id}/mark-viewed/    → OPB shënon si të parë
GET    /api/forms/opb-summary/          → statistika OPB
```

### Institutions, Users, Audit, Notifications

```
GET/POST/PATCH/DELETE  /api/institutions/
GET/POST/PATCH/DELETE  /api/users/          (vetëm ADMIN)
GET                    /api/audit/          (vetëm ADMIN)
GET                    /api/notifications/
POST                   /api/notifications/{id}/read/
```

## Roli → frontend mapping

| Backend | Frontend     |
| ------- | ------------ |
| `AK`    | `aplikues`   |
| `OPB`   | `opb`        |
| `ADMIN` | `superadmin` |

## Deploy në production

```bash
# Build image
docker build -t eformular-backend .

# Run me production settings
DJANGO_SETTINGS_MODULE=config.settings.production docker compose up
```

Sigurohu që:

- `SECRET_KEY` është i fortë dhe unik
- `DEBUG=False`
- `SESSION_COOKIE_SECURE=True` (HTTPS)
- `STORAGE_BACKEND=s3` + S3 credenciale

## Testet e permissions

```bash
python manage.py test apps.forms.tests
```

Testet e mbulojnë:

- AK nuk sheh formularët e AK tjetër
- OPB nuk krijon formular
- OPB nuk gjeneron PDF
- OPB nuk ngarkon dokument të firmosur
- OPB sheh vetëm `submitted_to_opb` formularë
- OPB mund të shënojë "parë"
- ADMIN sheh audit logs
- Ngarkim pranon vetëm PDF
- Ngarkim refuzon skedarë mbi limitin
