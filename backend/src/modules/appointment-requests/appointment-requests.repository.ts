import type { Database } from "../../db/database.js";
import { appointmentRequests } from "../../db/schema.js";

export interface CreateAppointmentRequestRecord {
  comment: string | null;
  email: string | null;
  fullName: string;
  phone: string;
  serviceType: string | null;
  status: "new";
}

export class AppointmentRequestsRepository {
  public constructor(private readonly database: Database) {}

  public async create(
    record: CreateAppointmentRequestRecord,
  ): Promise<void> {
    await this.database.insert(appointmentRequests).values(record);
  }
}
