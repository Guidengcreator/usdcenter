# Lightsail Production Deployment Runbook

This runbook describes the first affordable production deployment for `УЗД Эксперт`.

The deployment uses:

- Amazon Lightsail VPS,
- Docker Compose,
- Caddy for HTTPS, frontend static files, and `/api` reverse proxying,
- Fastify backend container,
- PostgreSQL container,
- scheduled PostgreSQL dumps,
- Lightsail instance snapshots.

This is intentionally simpler and cheaper than a fully managed AWS deployment.

## 1. Expected Monthly Cost

Start with the Lightsail Linux instance that has 2 GB memory if possible. The 1 GB
bundle may work for very light usage, but running Docker, Node.js, PostgreSQL,
and builds on one machine is tight.

Approximate starting budget:

| Item | Approximate cost |
| --- | ---: |
| Lightsail Linux VPS, 2 GB memory | 12 USD/month |
| Domain name | varies |
| Lightsail snapshots/storage | small additional cost |
| Total expected starting cost | about 12-20 USD/month |

## 2. Production Topology

```text
Browser
  -> HTTPS :443
  -> Caddy container
       -> static React files
       -> /api/* proxy to backend:3000
  -> Fastify backend container
  -> PostgreSQL container on private Docker network
```

Only ports `80`, `443`, and restricted `22` should be reachable from the
internet. PostgreSQL must not be exposed publicly.

## 3. Create the Lightsail Server

1. Open Amazon Lightsail.
2. Create a Linux/Unix instance.
3. Choose Ubuntu LTS.
4. Choose the 2 GB memory bundle for the first production deployment.
5. Name the instance, for example `uzd-expert-production`.
6. Create and attach a static IP address.
7. Configure firewall rules:
   - SSH `22`: only your IP address.
   - HTTP `80`: anywhere.
   - HTTPS `443`: anywhere.
8. Enable automatic instance snapshots.

## 4. Point the Domain to the Server

Create DNS records at your DNS provider:

```text
A     example.com      <Lightsail static IPv4>
A     www.example.com  <Lightsail static IPv4>
```

Use the real clinic domain instead of `example.com`.

Wait for DNS propagation before expecting HTTPS certificate issuance to work.

## 5. Install Server Dependencies

You can connect with either the Lightsail browser SSH terminal or Windows
Terminal/PowerShell.

### Option A: Lightsail Browser SSH

Use this for quick manual setup.

1. Open Amazon Lightsail.
2. Go to **Instances**.
3. Click the terminal icon or **Connect using SSH** for the Ubuntu instance.
4. Run the server commands below in the browser terminal.

### Option B: Windows Terminal or PowerShell

Use this when you want deployment commands to be easier to repeat, automate, or
delegate later.

1. Open the Lightsail console.
2. Open the Ubuntu instance.
3. Go to the **Connect** tab.
4. Download the SSH key for the instance or for the instance region.
5. Save the key on your Windows machine, for example:

   ```text
   C:\Users\<your-windows-user>\.ssh\uzd-expert-lightsail.pem
   ```

6. Open Windows Terminal or PowerShell.
7. Connect to the server:

   ```powershell
   ssh -i C:\Users\<your-windows-user>\.ssh\uzd-expert-lightsail.pem ubuntu@<lightsail-static-ip>
   ```

Replace `<your-windows-user>` with your Windows username and
`<lightsail-static-ip>` with the static IP attached to the Lightsail instance.

If SSH warns that the key file permissions are too open, restrict the file to
your Windows user:

```powershell
icacls C:\Users\<your-windows-user>\.ssh\uzd-expert-lightsail.pem /inheritance:r
icacls C:\Users\<your-windows-user>\.ssh\uzd-expert-lightsail.pem /grant:r "$($env:USERNAME):(R)"
```

Optional: create a shortcut in:

```text
C:\Users\<your-windows-user>\.ssh\config
```

Add:

```sshconfig
Host uzd-expert-prod
  HostName <lightsail-static-ip>
  User ubuntu
  IdentityFile C:\Users\<your-windows-user>\.ssh\uzd-expert-lightsail.pem
```

Then connect with:

```powershell
ssh uzd-expert-prod
```

### Install Docker and Git

After connecting to the server through either option, run:

```bash
sudo apt update
sudo apt install -y ca-certificates curl git
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker "$USER"
```

Log out and log in again so your user can run Docker commands without `sudo`.

Verify:

```bash
docker --version
docker compose version
```

## 6. Copy the Application to the Server

Clone the repository into `/opt/uzd-expert`:

```bash
sudo mkdir -p /opt/uzd-expert
sudo chown "$USER":"$USER" /opt/uzd-expert
git clone <repository-url> /opt/uzd-expert
cd /opt/uzd-expert
```

Use the real repository URL.

## 7. Configure Production Environment Variables

Create the production environment file:

```bash
cp infrastructure/production.env.example infrastructure/.env.production
nano infrastructure/.env.production
```

Set real values:

```env
SITE_DOMAIN=example.com, www.example.com
PUBLIC_ORIGIN=https://example.com
ACME_EMAIL=admin@example.com

POSTGRES_DB=uzd_expert
POSTGRES_USER=uzd_expert
POSTGRES_PASSWORD=<strong-random-password>

BACKUP_HOST_DIR=./backups
BACKUP_RETENTION_DAYS=14
```

Do not commit `infrastructure/.env.production`.

## 8. Build and Start PostgreSQL

```bash
docker compose \
  -f infrastructure/production.compose.yaml \
  --env-file infrastructure/.env.production \
  build

docker compose \
  -f infrastructure/production.compose.yaml \
  --env-file infrastructure/.env.production \
  up -d postgres
```

Check status:

```bash
docker compose \
  -f infrastructure/production.compose.yaml \
  --env-file infrastructure/.env.production \
  ps
```

## 9. Run Migrations and Seed Approved Clinic Content

Run migrations:

```bash
docker compose \
  -f infrastructure/production.compose.yaml \
  --env-file infrastructure/.env.production \
  run --rm backend npm run db:migrate:production
```

Seed clinic information only after the checked-in seed content has Product Owner
approval:

```bash
docker compose \
  -f infrastructure/production.compose.yaml \
  --env-file infrastructure/.env.production \
  run --rm backend npm run db:seed:clinic:production
```

The seed command replaces the clinic-information record with the checked-in seed
values.

## 10. Start the Application

```bash
docker compose \
  -f infrastructure/production.compose.yaml \
  --env-file infrastructure/.env.production \
  up -d
```

Verify containers:

```bash
docker compose \
  -f infrastructure/production.compose.yaml \
  --env-file infrastructure/.env.production \
  ps
```

Follow logs:

```bash
docker compose \
  -f infrastructure/production.compose.yaml \
  --env-file infrastructure/.env.production \
  logs -f web backend postgres
```

## 11. Verify Production

Open:

```text
https://example.com
```

Verify:

- the site loads over HTTPS,
- clinic information appears,
- the appointment request form submits successfully,
- invalid requests show validation errors,
- browser developer tools show no failed CORS requests,
- PostgreSQL is not reachable from the public internet.

Check the API:

```bash
curl https://example.com/api/v1/clinic-information
```

## 12. Configure Automated Database Backups

Create the backup directory:

```bash
mkdir -p /opt/uzd-expert/infrastructure/backups
```

Run one manual backup first:

```bash
cd /opt/uzd-expert
docker compose \
  -f infrastructure/production.compose.yaml \
  --env-file infrastructure/.env.production \
  --profile maintenance \
  run --rm backup
```

Confirm that a `.dump` file was created:

```bash
ls -lh infrastructure/backups
```

Add a daily cron job:

```bash
crontab -e
```

Add:

```cron
15 2 * * * cd /opt/uzd-expert && docker compose -f infrastructure/production.compose.yaml --env-file infrastructure/.env.production --profile maintenance run --rm backup >> /opt/uzd-expert/infrastructure/backups/backup.log 2>&1
```

This creates a PostgreSQL dump every day at 02:15 server time and deletes dumps
older than `BACKUP_RETENTION_DAYS`.

## 13. Add Server-Level Backups

Enable Lightsail automatic snapshots for the instance.

The PostgreSQL dumps help restore application data. Lightsail snapshots help
recover the whole server if the instance is damaged or deleted.

For stronger protection, periodically copy backup dumps away from the server,
for example to your local machine or an S3 bucket.

## 14. Restore Test

Backups are only trustworthy after a restore has been tested.

To test restore on a separate staging server or temporary database:

```bash
docker compose \
  -f infrastructure/production.compose.yaml \
  --env-file infrastructure/.env.production \
  --profile maintenance \
  run --rm --entrypoint sh backup -lc 'PGPASSWORD="$POSTGRES_PASSWORD" pg_restore --host=postgres --port=5432 --username="$POSTGRES_USER" --dbname="$POSTGRES_DB" --clean --if-exists --no-owner /backups/<backup-file>.dump'
```

Do not run restore commands against production unless you intentionally want to
replace production data.

## 15. Update Deployment

From `/opt/uzd-expert`:

```bash
git pull
docker compose \
  -f infrastructure/production.compose.yaml \
  --env-file infrastructure/.env.production \
  build
docker compose \
  -f infrastructure/production.compose.yaml \
  --env-file infrastructure/.env.production \
  run --rm backend npm run db:migrate:production
docker compose \
  -f infrastructure/production.compose.yaml \
  --env-file infrastructure/.env.production \
  up -d
```

Check logs after every deployment.

## 16. Rollback

If a deployment fails before migrations changed data:

```bash
git log --oneline
git checkout <previous-good-commit>
docker compose \
  -f infrastructure/production.compose.yaml \
  --env-file infrastructure/.env.production \
  build
docker compose \
  -f infrastructure/production.compose.yaml \
  --env-file infrastructure/.env.production \
  up -d
```

If migrations changed data, restore only after confirming the correct backup and
accepting that newer production data may be lost.

## 17. Security Checklist

- Keep SSH restricted to trusted IP addresses.
- Do not expose PostgreSQL.
- Use a strong `POSTGRES_PASSWORD`.
- Keep `infrastructure/.env.production` out of Git.
- Keep Ubuntu and Docker updated.
- Review container logs regularly.
- Verify backup files are created daily.
- Test restore before depending on backups.
