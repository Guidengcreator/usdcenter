import { desc } from "drizzle-orm";

import type { Database } from "../../db/database.js";
import { clinicInformation } from "../../db/schema.js";

export interface PublicClinicInformation {
  clinicName: string;
  description: string;
  address: string;
  phone: string;
  email: string | null;
  workingHours: string;
}

export class ClinicInformationRepository {
  public constructor(private readonly database: Database) {}

  public async findPublicInformation(): Promise<PublicClinicInformation | null> {
    const [information] = await this.database
      .select({
        clinicName: clinicInformation.clinicName,
        description: clinicInformation.description,
        address: clinicInformation.address,
        phone: clinicInformation.phone,
        email: clinicInformation.email,
        workingHours: clinicInformation.workingHours,
      })
      .from(clinicInformation)
      .orderBy(desc(clinicInformation.updatedAt), desc(clinicInformation.id))
      .limit(1);

    return information ?? null;
  }
}
