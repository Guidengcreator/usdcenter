# How to Run УЗД Експерт Locally

This runbook describes how to run the application on Windows using PowerShell. It covers the initial setup, normal daily startup, verification, automated tests, shutdown, and common failures.

## 1. Understand the local services

The application consists of three processes:

| Service | Technology | Local address |
| --- | --- | --- |
| Frontend | React and Vite | `http://localhost:5173` |
| Backend API | Fastify | `http://localhost:3000` |
| Development database | PostgreSQL 17 in Docker | `localhost:5434` |

An isolated PostgreSQL test database is available on `localhost:5433`. It is only required when running backend tests.

## 2. Verify prerequisites

Open PowerShell and run:

```powershell
node --version
npm --version
docker --version
docker compose version
```

Expected versions:

- Node.js `v24.x`
- npm `11.x`
- Docker with the `docker compose` command

Verify that Docker Desktop is running:

```powershell
docker info
```

If this command cannot connect to the Docker engine, start Docker Desktop, wait until it reports that the engine is running, and retry the command.

## 3. Open the project directory

```powershell
Set-Location -LiteralPath 'C:\work\Ultrasound_Expert'
```

Confirm the location and current Git branch:

```powershell
Get-Location
git branch --show-current
git status --short
```

The US-1.3 implementation is currently on:

```text
feature/us-1-3-hours-of-operation
```

## 4. Install JavaScript dependencies

Run this from the project root:

```powershell
npm install
```

This installs dependencies for both npm workspaces:

- `backend/`
- `frontend/`

Dependency versions are locked by `package-lock.json`.

## 5. Start the development database

Start only the PostgreSQL service required by the running application:

```powershell
docker compose -f .\infrastructure\compose.yaml up -d postgres
```

The first run may download the PostgreSQL image and take longer than subsequent runs.

Check its state:

```powershell
docker compose -f .\infrastructure\compose.yaml ps
```

Wait until the `postgres` service reports `healthy` before applying migrations or starting the backend.

If it does not become healthy, inspect its logs:

```powershell
docker compose -f .\infrastructure\compose.yaml logs postgres
```

## 6. Review local development configuration

Local development configuration is committed to the repository so developers do not need to create local `.env` files manually.

The backend development configuration lives in `backend/.env.development` and contains the local database URL, CORS origin, host, and port:

```env
DATABASE_URL=postgres://uzd_expert:uzd_expert@localhost:5434/uzd_expert
CORS_ORIGIN=http://localhost:5173
HOST=127.0.0.1
PORT=3000
```

The frontend development configuration lives in `frontend/.env.development` and contains the local backend API URL:

```env
VITE_API_BASE_URL=http://localhost:3000
```

The backend npm scripts load `backend/.env.development` automatically for local development commands. Vite loads `frontend/.env.development` automatically for the frontend development server.

Do not commit real production credentials to the repository.

## 7. Apply database migrations

From the project root, run:

```powershell
npm run db:migrate -w backend
```

This creates the `clinic_information` table through the committed Drizzle migration. The command is safe to run again; already-applied migrations are not reapplied.

## 8. Seed clinic information

The seed data is checked in at:

```text
backend/src/db/seeds/clinic-information.seed.ts
```

It contains the public clinic name, description, address, phone number, email address, and working hours.

Seed the database:

```powershell
npm run db:seed:clinic -w backend
```

Important: running this seed command again replaces the existing clinic-information record with the values from the checked-in seed file.

Before production deployment, update the seed file only with Product Owner-approved clinic copy.

## 9. Start the backend

```powershell
npm run dev -w backend
```

The backend runs in watch mode and restarts when backend source files change. It should listen on:

```text
http://127.0.0.1:3000
```

Leave this window open while using the application.

## 10. Verify the backend API

Open another PowerShell window and run:

```powershell
Invoke-RestMethod -Uri 'http://localhost:3000/api/v1/clinic-information' -Method Get | ConvertTo-Json -Depth 5
```

Expected response shape:

```json
{
  "data": {
    "clinicName": "УЗД Експерт",
    "description": "Діагностичний центр ультразвукових досліджень.",
    "address": "м. Полтава, вул. Прикладна, 10",
    "phone": "+380 44 123 45 67",
    "email": "info@uzdexpert.ua",
    "workingHours": "Пн-Пт: 09:00-18:00\nСб: 09:00-14:00\nНд: вихідний"
  }
}
```

This is a public endpoint and does not require authentication.

## 11. Start the frontend

Open a separate PowerShell window and return to the project root:

```powershell
Set-Location -LiteralPath 'C:\work\Ultrasound_Expert'
```

Start the frontend development server:

```powershell
npm run dev -w frontend
```

Leave this window open. Vite should report that the frontend is available at:

```text
http://localhost:5173
```

## 12. Open and verify the application

Open the site in your browser:

```powershell
Start-Process 'http://localhost:5173'
```

Verify the following:

1. The page opens without a login prompt.
2. The clinic-information section is visible.
3. The clinic name and description match the database values.
4. The browser console contains no failed API or CORS requests.
5. The page remains readable at a narrow mobile width and a normal desktop width.

## 13. Normal daily startup after the first setup

Migrations and seeding are normally required only during initial setup or after relevant changes. For routine startup:

1. Start Docker Desktop.
2. Open PowerShell in the project root.
3. Start PostgreSQL:

   ```powershell
   docker compose -f .\infrastructure\compose.yaml up -d postgres
   ```

4. In the backend terminal, run:

   ```powershell
   Set-Location -LiteralPath 'C:\work\Ultrasound_Expert'
   npm run dev -w backend
   ```

5. In a second terminal, run:

   ```powershell
   Set-Location -LiteralPath 'C:\work\Ultrasound_Expert'
   npm run dev -w frontend
   ```

6. Open `http://localhost:5173`.

## 14. Run automated verification

### Start the isolated test database

```powershell
docker compose -f .\infrastructure\compose.yaml up -d postgres-test
```

Wait until `postgres-test` is healthy:

```powershell
docker compose -f .\infrastructure\compose.yaml ps
```

### Run all tests

```powershell
npm test
```

The backend integration tests use the isolated database on port `5433`. The tests apply their own migrations and clean their clinic-information records.

### Run strict TypeScript checks

```powershell
npm run typecheck
```

### Build production assets

```powershell
npm run build
```

### Audit dependencies

```powershell
npm audit
```

### Stop the isolated test database

```powershell
docker compose -f .\infrastructure\compose.yaml stop postgres-test
```

## 15. Stop the application

1. In the frontend terminal, press `Ctrl+C`.
2. In the backend terminal, press `Ctrl+C`.
3. Stop PostgreSQL:

   ```powershell
   docker compose -f .\infrastructure\compose.yaml stop postgres
   ```

Stopping the container preserves development database data in the Docker volume.

To remove stopped application containers and the Compose network while preserving database data:

```powershell
docker compose -f .\infrastructure\compose.yaml down
```

## 16. Troubleshooting

### Docker cannot connect to the engine

Symptom:

```text
Cannot connect to the Docker daemon
```

Action:

1. Start Docker Desktop.
2. Wait until Docker reports that it is running.
3. Retry `docker info`.

### Backend reports `DATABASE_URL is required`

The backend could not find `DATABASE_URL`. Confirm that `backend/.env.development` exists and contains:

```env
DATABASE_URL=postgres://uzd_expert:uzd_expert@localhost:5434/uzd_expert
```

Then restart the backend:

```powershell
npm run dev -w backend
```

### Backend cannot connect to PostgreSQL

Check that PostgreSQL is running and healthy:

```powershell
docker compose -f .\infrastructure\compose.yaml ps
docker compose -f .\infrastructure\compose.yaml logs postgres
```

Confirm that `DATABASE_URL` uses the development port `5434`, not the test database port `5433` or another application's port `5432`.

### API returns `CLINIC_INFORMATION_NOT_FOUND`

The migration succeeded, but no clinic record exists. Rerun the checked-in clinic seed:

```powershell
npm run db:seed:clinic -w backend
```

### Browser reports a CORS error

Stop the backend and verify that `backend/.env.development` contains:

```env
CORS_ORIGIN=http://localhost:5173
```

The value must match the frontend origin exactly. Restart the backend after editing `backend/.env.development`.

### A local port is already in use

Inspect the default ports:

```powershell
Get-NetTCPConnection -LocalPort 3000,5173,5432,5433,5434 -ErrorAction SilentlyContinue |
  Select-Object LocalAddress,LocalPort,State,OwningProcess
```

Stop the conflicting application or change the relevant local configuration deliberately. Do not change application ports without updating the corresponding backend, frontend, CORS, and Docker settings.

### Reset the development database

Only use this when all local development data may be deleted.

```powershell
docker compose -f .\infrastructure\compose.yaml down -v
```

Warning: the `-v` option permanently deletes the local PostgreSQL volume. Afterward, repeat the database startup, migration, and seed steps.

For US-1.2 specifically, you do not need to delete the volume. The migration backfills the new contact columns so existing US-1.1 data can stay in place.

For US-1.3, you also do not need to delete the volume. The migration backfills the new working-hours column for existing clinic-information rows.
