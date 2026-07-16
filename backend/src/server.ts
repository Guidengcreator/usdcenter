import { buildApp } from "./app.js";
import { readEnvironment } from "./config/environment.js";
import { createDatabase } from "./db/database.js";

const environment = readEnvironment();
const { client, database } = createDatabase(environment.databaseUrl);
const app = buildApp({
  adminSessionTtlSeconds: environment.adminSessionTtlSeconds,
  corsOrigin: environment.corsOrigin,
  database,
  logger: true,
  trustProxy: environment.trustProxy,
});

async function shutdown(signal: string): Promise<void> {
  app.log.info({ signal }, "Shutting down");
  await app.close();
  await client.end();
}

process.once("SIGINT", () => {
  void shutdown("SIGINT");
});

process.once("SIGTERM", () => {
  void shutdown("SIGTERM");
});

await app.listen({
  host: environment.host,
  port: environment.port,
});
