import { readEnvironment } from "../config/environment.js";
import { createDatabase } from "./database.js";
import { clinicInformation } from "./schema.js";
import { clinicInformationSeed } from "./seeds/clinic-information.seed.js";

function readSeedValue(name: string, value: string): string {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    throw new Error(`${name} is required in the clinic information seed file`);
  }

  return trimmedValue;
}

const { databaseUrl } = readEnvironment();
const clinicName = readSeedValue(
  "clinicInformationSeed.clinicName",
  clinicInformationSeed.clinicName,
);
const description = readSeedValue(
  "clinicInformationSeed.description",
  clinicInformationSeed.description,
);
const address = readSeedValue(
  "clinicInformationSeed.address",
  clinicInformationSeed.address,
);
const phone = readSeedValue("clinicInformationSeed.phone", clinicInformationSeed.phone);
const email = readSeedValue("clinicInformationSeed.email", clinicInformationSeed.email);
const { client, database } = createDatabase(databaseUrl);

try {
  await database.transaction(async (transaction) => {
    await transaction.delete(clinicInformation);
    await transaction.insert(clinicInformation).values({
      clinicName,
      description,
      address,
      phone,
      email,
    });
  });
} finally {
  await client.end();
}
