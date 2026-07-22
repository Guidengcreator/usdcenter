import { and, eq, gt, isNull } from "drizzle-orm";

import type { Database } from "../../db/database.js";
import { adminSessions, adminUsers } from "../../db/schema.js";
import type { SafeAdmin } from "../admin-auth/admin-auth.repository.js";

export class AdminSessionsRepository {
  public constructor(private readonly database: Database) {}

  public async create(values: {
    adminUserId: number;
    expiresAt: Date;
    id: string;
  }): Promise<void> {
    await this.database.insert(adminSessions).values(values);
  }

  public async findAdminByValidSessionId(
    sessionId: string,
    now: Date,
  ): Promise<SafeAdmin | null> {
    const [row] = await this.database
      .select({
        email: adminUsers.email,
        id: adminUsers.id,
      })
      .from(adminSessions)
      .innerJoin(adminUsers, eq(adminSessions.adminUserId, adminUsers.id))
      .where(
        and(
          eq(adminSessions.id, sessionId),
          isNull(adminSessions.revokedAt),
          gt(adminSessions.expiresAt, now),
        ),
      )
      .limit(1);

    return row ?? null;
  }

  public async revokeValidSession(sessionId: string, now: Date): Promise<void> {
    await this.database
      .update(adminSessions)
      .set({
        revokedAt: now,
      })
      .where(
        and(
          eq(adminSessions.id, sessionId),
          isNull(adminSessions.revokedAt),
          gt(adminSessions.expiresAt, now),
        ),
      );
  }
}
