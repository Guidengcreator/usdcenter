import { randomBytes, scrypt as scryptCallback } from "node:crypto";
import { promisify } from "node:util";

import { eq } from "drizzle-orm";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { buildApp } from "../../src/app.js";
import { createDatabase } from "../../src/db/database.js";
import {
  adminSessions,
  adminUsers,
  appointmentRequests,
  clinicInformation,
} from "../../src/db/schema.js";

const scrypt = promisify(scryptCallback);

const testDatabaseUrl =
  process.env.TEST_DATABASE_URL ??
  "postgres://uzd_expert:uzd_expert@localhost:5433/uzd_expert_test";

const { client, database } = createDatabase(testDatabaseUrl);

const adminEmail = "admin@example.com";
const adminPassword = "correct-password";
const loggedOutResponse = {
  data: {
    loggedOut: true,
  },
};
const authenticationFailedResponse = {
  error: {
    code: "AUTHENTICATION_FAILED",
    message: "Invalid email or password",
    details: [],
  },
};

interface CapturedLogLine {
  [key: string]: unknown;
}

async function createAdminUser(): Promise<{
  id: number;
  passwordHash: string;
}> {
  const passwordHash = await createTestPasswordHash(adminPassword);
  const [storedAdmin] = await database
    .insert(adminUsers)
    .values({
      email: adminEmail,
      passwordHash,
    })
    .returning();

  if (!storedAdmin) {
    throw new Error("Failed to create test admin user");
  }

  return { id: storedAdmin.id, passwordHash };
}

async function createTestPasswordHash(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;

  return `scrypt$${salt}$${derivedKey.toString("hex")}`;
}

async function loginAdmin(): Promise<{
  cookie: string;
  sessionId: string;
}> {
  const app = buildApp({ database });

  try {
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/admin/login",
      payload: {
        email: adminEmail,
        password: adminPassword,
      },
    });

    expect(response.statusCode).toBe(200);

    const cookie = getAdminSessionCookie(response);
    const sessionId = getAdminSessionId(response);

    return { cookie, sessionId };
  } finally {
    await app.close();
  }
}

function getAdminSessionCookie(response: { headers: Record<string, unknown> }) {
  const setCookieHeader = response.headers["set-cookie"];

  expect(typeof setCookieHeader).toBe("string");

  const [cookie] = (setCookieHeader as string).split(";");

  if (!cookie) {
    throw new Error("Expected Set-Cookie to include admin session cookie");
  }

  return cookie;
}

function getAdminSessionId(response: { headers: Record<string, unknown> }) {
  const cookie = getAdminSessionCookie(response);
  const [, sessionId] = cookie.split("=");

  if (!sessionId) {
    throw new Error("Expected admin session cookie to contain a value");
  }

  return sessionId;
}

function expectLogoutCookieCleared(
  response: { headers: Record<string, unknown> },
  expectedSecure = false,
): void {
  const setCookieHeader = response.headers["set-cookie"];

  expect(typeof setCookieHeader).toBe("string");
  expect(setCookieHeader).toContain("admin_session_id=");
  expect(setCookieHeader).toContain("HttpOnly");
  expect(setCookieHeader).toContain("SameSite=Lax");
  expect(setCookieHeader).toContain("Path=/api/v1/admin");
  expect(setCookieHeader).toContain("Max-Age=0");

  if (expectedSecure) {
    expect(setCookieHeader).toContain("Secure");
  } else {
    expect(setCookieHeader).not.toContain("Secure");
  }
}

function createLogCapture(): {
  capturedLogs: CapturedLogLine[];
  logger: boolean;
} {
  const capturedLogs: CapturedLogLine[] = [];

  return {
    capturedLogs,
    logger: {
      level: "info",
      stream: {
        write(line: string): void {
          capturedLogs.push(JSON.parse(line) as CapturedLogLine);
        },
      },
    } as unknown as boolean,
  };
}

async function expectAdminSessionCount(expectedCount: number): Promise<void> {
  const storedSessions = await database.select().from(adminSessions);

  expect(storedSessions).toHaveLength(expectedCount);
}

describe("User Story 3.2 admin logout", () => {
  beforeAll(async () => {
    await migrate(database, { migrationsFolder: "drizzle" });
  });

  beforeEach(async () => {
    await database.delete(adminSessions);
    await database.delete(adminUsers);
    await database.delete(appointmentRequests);
    await database.delete(clinicInformation);
  });

  afterAll(async () => {
    await client.end();
  });

  it("logs out a valid admin session, clears the cookie, and revokes the session", async () => {
    await createAdminUser();
    const { cookie, sessionId } = await loginAdmin();
    await expectAdminSessionCount(1);

    const app = buildApp({ database });

    try {
      const logoutResponse = await app.inject({
        method: "POST",
        url: "/api/v1/admin/logout",
        headers: {
          cookie,
        },
      });

      expect(logoutResponse.statusCode).toBe(200);
      expect(logoutResponse.json()).toEqual(loggedOutResponse);
      expect(JSON.stringify(logoutResponse.json())).not.toContain(sessionId);
      expectLogoutCookieCleared(logoutResponse);

      const [storedSession] = await database
        .select()
        .from(adminSessions)
        .where(eq(adminSessions.id, sessionId));

      expect(storedSession?.revokedAt).toBeInstanceOf(Date);

      const protectedResponse = await app.inject({
        method: "GET",
        url: "/api/v1/admin/session",
        headers: {
          cookie,
        },
      });

      expect(protectedResponse.statusCode).toBe(401);
      expect(protectedResponse.json()).toEqual(authenticationFailedResponse);
    } finally {
      await app.close();
    }
  });

  it("returns a safe response without creating a session when no cookie is present", async () => {
    await createAdminUser();
    const app = buildApp({ database });

    try {
      const response = await app.inject({
        method: "POST",
        url: "/api/v1/admin/logout",
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual(loggedOutResponse);
      expectLogoutCookieCleared(response);
      await expectAdminSessionCount(0);
    } finally {
      await app.close();
    }
  });

  it("returns a safe response without creating a session when the cookie is invalid", async () => {
    await createAdminUser();
    const app = buildApp({ database });

    try {
      const response = await app.inject({
        method: "POST",
        url: "/api/v1/admin/logout",
        headers: {
          cookie: "admin_session_id=not-a-valid-session",
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual(loggedOutResponse);
      expectLogoutCookieCleared(response);
      await expectAdminSessionCount(0);
    } finally {
      await app.close();
    }
  });

  it("does not authenticate an expired session during logout", async () => {
    const { id: adminUserId } = await createAdminUser();
    await database.insert(adminSessions).values({
      id: "1".repeat(64),
      adminUserId,
      expiresAt: new Date(Date.now() - 60_000),
    });

    const app = buildApp({ database });

    try {
      const response = await app.inject({
        method: "POST",
        url: "/api/v1/admin/logout",
        headers: {
          cookie: `admin_session_id=${"1".repeat(64)}`,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual(loggedOutResponse);
      expectLogoutCookieCleared(response);

      const protectedResponse = await app.inject({
        method: "GET",
        url: "/api/v1/admin/session",
        headers: {
          cookie: `admin_session_id=${"1".repeat(64)}`,
        },
      });

      expect(protectedResponse.statusCode).toBe(401);
      expect(protectedResponse.json()).toEqual(authenticationFailedResponse);
      await expectAdminSessionCount(1);
    } finally {
      await app.close();
    }
  });

  it("does not authenticate an already revoked session during logout", async () => {
    const { id: adminUserId } = await createAdminUser();
    await database.insert(adminSessions).values({
      id: "2".repeat(64),
      adminUserId,
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: new Date(),
    });

    const app = buildApp({ database });

    try {
      const response = await app.inject({
        method: "POST",
        url: "/api/v1/admin/logout",
        headers: {
          cookie: `admin_session_id=${"2".repeat(64)}`,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual(loggedOutResponse);
      expectLogoutCookieCleared(response);

      const protectedResponse = await app.inject({
        method: "GET",
        url: "/api/v1/admin/session",
        headers: {
          cookie: `admin_session_id=${"2".repeat(64)}`,
        },
      });

      expect(protectedResponse.statusCode).toBe(401);
      expect(protectedResponse.json()).toEqual(authenticationFailedResponse);
      await expectAdminSessionCount(1);
    } finally {
      await app.close();
    }
  });

  it("uses the production Secure cookie policy when clearing the logout cookie", async () => {
    const app = buildApp({ adminCookieSecure: true, database });

    try {
      const response = await app.inject({
        method: "POST",
        url: "/api/v1/admin/logout",
      });

      expect(response.statusCode).toBe(200);
      expectLogoutCookieCleared(response, true);
    } finally {
      await app.close();
    }
  });

  it("does not log cookies, full session ids, passwords, or password hashes during logout", async () => {
    const { passwordHash } = await createAdminUser();
    const { cookie, sessionId } = await loginAdmin();
    const { capturedLogs, logger } = createLogCapture();
    const app = buildApp({ database, logger });

    try {
      await app.inject({
        method: "POST",
        url: "/api/v1/admin/logout",
        headers: {
          cookie,
        },
      });

      const serializedLogs = capturedLogs.map((line) => JSON.stringify(line)).join("\n");

      expect(serializedLogs).not.toContain(cookie);
      expect(serializedLogs).not.toContain(sessionId);
      expect(serializedLogs).not.toContain(adminPassword);
      expect(serializedLogs).not.toContain(passwordHash);
    } finally {
      await app.close();
    }
  });

  it("keeps existing public endpoints accessible without authentication", async () => {
    await database.insert(clinicInformation).values({
      clinicName: "Test clinic",
      description: "Test ultrasound diagnostic services",
      address: "Test street 1",
      phone: "+380 44 123 45 67",
      email: "info@testclinic.example",
      workingHours: "Mon-Fri: 09:00-18:00",
    });

    const app = buildApp({ database });

    try {
      const response = await app.inject({
        method: "GET",
        url: "/api/v1/clinic-information",
      });

      expect(response.statusCode).toBe(200);
    } finally {
      await app.close();
    }
  });
});
