import { eq } from "drizzle-orm";

import type { Database } from "../../db/database.js";
import { adminUsers } from "../../db/schema.js";

export interface AdminUserRecord {
  email: string;
  id: number;
  passwordHash: string;
}

export interface SafeAdmin {
  email: string;
  id: number;
}

export class AdminAuthRepository {
  public constructor(private readonly database: Database) {}

  public async findByEmail(email: string): Promise<AdminUserRecord | null> {
    const [adminUser] = await this.database
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.email, email))
      .limit(1);

    return adminUser ?? null;
  }

  public async upsertAdminUser(values: {
    email: string;
    passwordHash: string;
  }): Promise<SafeAdmin> {
    const [adminUser] = await this.database
      .insert(adminUsers)
      .values(values)
      .onConflictDoUpdate({
        target: adminUsers.email,
        set: {
          passwordHash: values.passwordHash,
          updatedAt: new Date(),
        },
      })
      .returning({
        email: adminUsers.email,
        id: adminUsers.id,
      });

    if (!adminUser) {
      throw new Error("Failed to store admin user");
    }

    return adminUser;
  }
}
