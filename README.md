# УЗД Експерт

Production-oriented web application for an ultrasound diagnostic center.

For detailed Windows setup, startup, verification, shutdown, and troubleshooting instructions, see [RUN_APP.md](RUN_APP.md).

## Prerequisites

- Node.js 24
- npm 11
- Docker with Docker Compose

## Install

```powershell
npm install
```

## Local database

Start the development and isolated test databases:

```powershell
docker compose -f infrastructure/compose.yaml up -d postgres postgres-test
```

Configure the backend in the current shell:

```powershell
$env:DATABASE_URL = 'postgres://uzd_expert:uzd_expert@localhost:5432/uzd_expert'
$env:CORS_ORIGIN = 'http://localhost:5173'
```

Apply migrations:

```powershell
npm run db:migrate -w backend
```

Seed approved clinic content without hardcoding it in the repository:

```powershell
$env:CLINIC_NAME = 'УЗД Експерт'
$env:CLINIC_DESCRIPTION = '<approved clinic description>'
npm run db:seed:clinic -w backend
```

## Run locally

Start the backend and frontend in separate terminals:

```powershell
npm run dev -w backend
```

```powershell
npm run dev -w frontend
```

The frontend runs at `http://localhost:5173` and the backend at `http://localhost:3000`.

## Verify

```powershell
npm test
npm run typecheck
npm run build
npm audit
```
