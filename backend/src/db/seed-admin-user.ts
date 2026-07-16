import { AdminAuthRepository } from "../modules/admin-auth/admin-auth.repository.js";
import { AdminAuthService } from "../modules/admin-auth/admin-auth.service.js";
import { AdminSessionsRepository } from "../modules/admin-sessions/admin-sessions.repository.js";
import { readEnvironment } from "../config/environment.js";
import { createDatabase } from "./database.js";

function readRequiredEnvironmentValue(
  environment: NodeJS.ProcessEnv,
  name: string,
): string {
  const value = environment[name]?.trim();

  if (!value) {
    throw new Error(`${name} is required to seed an admin user`);
  }

  return value;
}

const { databaseUrl } = readEnvironment();
const email = readRequiredEnvironmentValue(process.env, "ADMIN_EMAIL");
const password = readRequiredEnvironmentValue(process.env, "ADMIN_PASSWORD");
const { client, database } = createDatabase(databaseUrl);

try {
  const adminAuthRepository = new AdminAuthRepository(database);
  const adminSessionsRepository = new AdminSessionsRepository(database);
  const adminAuthService = new AdminAuthService(
    adminAuthRepository,
    adminSessionsRepository,
    {
      sessionTtlSeconds: 8 * 60 * 60,
    },
  );

  const admin = await adminAuthService.createOrUpdateAdminUser({
    email,
    password,
  });

  console.info(`Seeded admin user ${admin.email}`);
} finally {
  await client.end();
}
