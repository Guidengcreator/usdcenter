import { desc } from "drizzle-orm";

import type { Database } from "../../db/database.js";
import { clinicInformation } from "../../db/schema.js";

export interface PublicClinicInformation {
  clinicName: string;
  description: string;
}

export class ClinicInformationRepository {
  public constructor(private readonly database: Database) {}

  public async findPublicInformation(): Promise<PublicClinicInformation | null> {
    const [information] = await this.database
      .select({
        clinicName: clinicInformation.clinicName,
        description: clinicInformation.description,
      })
      .from(clinicInformation)
      .orderBy(desc(clinicInformation.updatedAt), desc(clinicInformation.id))
      .limit(1);

    return information ?? null;
  }
}
