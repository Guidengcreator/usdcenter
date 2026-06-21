import { migrate } from "drizzle-orm/postgres-js/migrator";
import { fileURLToPath } from "node:url";

import { readEnvironment } from "../config/environment.js";
import { createDatabase } from "./database.js";

const { databaseUrl } = readEnvironment();
const { client, database } = createDatabase(databaseUrl);
const migrationsFolder = fileURLToPath(new URL("../../drizzle", import.meta.url));

try {
  await migrate(database, { migrationsFolder });
} finally {
  await client.end();
}
