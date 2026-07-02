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

Local development configuration is committed in `backend/.env.development` and
`frontend/.env.development`. Backend scripts load `backend/.env.development`
automatically, and Vite loads `frontend/.env.development` automatically for the
frontend development server.

Apply migrations:

```powershell
npm run db:migrate -w backend
```

Seed clinic content from the checked-in seed file:

```powershell
npm run db:seed:clinic -w backend
```

The seed data lives in `backend/src/db/seeds/clinic-information.seed.ts` and includes the public clinic name, description, address, phone number, email address, and working hours.

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
