import { readEnvironment } from "../config/environment.js";
import { createDatabase } from "./database.js";
import { clinicInformation } from "./schema.js";

function readRequiredValue(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is required to seed clinic information`);
  }

  return value;
}

const { databaseUrl } = readEnvironment();
const clinicName = readRequiredValue("CLINIC_NAME");
const description = readRequiredValue("CLINIC_DESCRIPTION");
const { client, database } = createDatabase(databaseUrl);

try {
  await database.transaction(async (transaction) => {
    await transaction.delete(clinicInformation);
    await transaction.insert(clinicInformation).values({
      clinicName,
      description,
    });
  });
} finally {
  await client.end();
}
