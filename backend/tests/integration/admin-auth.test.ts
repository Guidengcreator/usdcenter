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
const authenticationFailedResponse = {
  error: {
    code: "AUTHENTICATION_FAILED",
    message: "Invalid email or password",
    details: [],
  },
};

interface CapturedLogLine {
  [key: string]: unknown;
  msg?: string;
}

async function createAdminUser(
  email = adminEmail,
  password = adminPassword,
): Promise<{ id: number; passwordHash: string }> {
  const passwordHash = await createTestPasswordHash(password);
  const [storedAdmin] = await database
    .insert(adminUsers)
    .values({
      email,
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

async function submitAdminLogin(payload: Record<string, unknown>) {
  const app = buildApp({ database });

  try {
    return await app.inject({
      method: "POST",
      url: "/api/v1/admin/login",
      payload,
    });
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

function expectValidationErrorResponse(
  response: { json: () => unknown; statusCode: number },
  expectedDetails: string[],
): void {
  expect(response.statusCode).toBe(400);
  expect(response.json()).toEqual({
    error: {
      code: "VALIDATION_ERROR",
      message: "Invalid request data",
      details: expect.arrayContaining(expectedDetails),
    },
  });
}

async function expectNoAdminSessions(): Promise<void> {
  const storedSessions = await database.select().from(adminSessions);

  expect(storedSessions).toHaveLength(0);
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

describe("User Story 3.1 admin authentication", () => {
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

  describe("POST /api/v1/admin/login validation", () => {
    beforeEach(async () => {
      await createAdminUser();
    });

    it.each([
      {
        description: "missing email",
        details: ["body/email must NOT have fewer than 1 characters"],
        payload: { password: adminPassword },
      },
      {
        description: "missing password",
        details: ["body/password must NOT have fewer than 1 characters"],
        payload: { email: adminEmail },
      },
      {
        description: "empty email",
        details: ["body/email must NOT have fewer than 1 characters"],
        payload: { email: "", password: adminPassword },
      },
      {
        description: "whitespace-only email",
        details: ["body/email must NOT have fewer than 1 characters"],
        payload: { email: "   ", password: adminPassword },
      },
      {
        description: "malformed email",
        details: ["body/email must match format \"email\""],
        payload: { email: "not-an-email", password: adminPassword },
      },
      {
        description: "empty password",
        details: ["body/password must NOT have fewer than 1 characters"],
        payload: { email: adminEmail, password: "" },
      },
      {
        description: "whitespace-only password",
        details: ["body/password must NOT have fewer than 1 characters"],
        payload: { email: adminEmail, password: "   " },
      },
    ])(
      "rejects a login request with $description",
      async ({ details, payload }) => {
        const response = await submitAdminLogin(payload);

        expectValidationErrorResponse(response, details);
        await expectNoAdminSessions();
      },
    );

    it("normalizes admin email before authenticating", async () => {
      const response = await submitAdminLogin({
        email: "  ADMIN@EXAMPLE.COM  ",
        password: adminPassword,
      });

      expect(response.statusCode).toBe(200);

      const storedSessions = await database.select().from(adminSessions);

      expect(storedSessions).toHaveLength(1);
    });
  });

  describe("POST /api/v1/admin/login invalid credentials", () => {
    it("returns 401 for wrong password and does not create a session", async () => {
      await createAdminUser();

      const response = await submitAdminLogin({
        email: adminEmail,
        password: "wrong-secret",
      });

      expect(response.statusCode).toBe(401);
      expect(response.json()).toEqual(authenticationFailedResponse);
      await expectNoAdminSessions();
    });

    it("returns the same generic 401 response for an unknown email", async () => {
      await createAdminUser();

      const response = await submitAdminLogin({
        email: "unknown@example.com",
        password: "wrong-secret",
      });

      expect(response.statusCode).toBe(401);
      expect(response.json()).toEqual(authenticationFailedResponse);
      await expectNoAdminSessions();
    });
  });

  describe("POST /api/v1/admin/login success", () => {
    it("stores the admin password as a hash and verifies it during login", async () => {
      const { passwordHash } = await createAdminUser();

      expect(passwordHash).not.toBe(adminPassword);
      expect(passwordHash).toMatch(/^scrypt\$/);

      const response = await submitAdminLogin({
        email: adminEmail,
        password: adminPassword,
      });

      expect(response.statusCode).toBe(200);
    });

    it("creates a server-side session and returns a safe success response", async () => {
      const { id: adminUserId } = await createAdminUser();

      const response = await submitAdminLogin({
        email: adminEmail,
        password: adminPassword,
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({
        data: {
          admin: {
            id: adminUserId,
            email: adminEmail,
          },
        },
      });
      expect(JSON.stringify(response.json())).not.toContain("passwordHash");
      expect(JSON.stringify(response.json())).not.toContain(adminPassword);

      const storedSessions = await database.select().from(adminSessions);

      expect(storedSessions).toHaveLength(1);
      expect(storedSessions[0]).toMatchObject({
        adminUserId,
        revokedAt: null,
      });
      expect(storedSessions[0]?.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    it("sets an HTTP-only cookie containing only an opaque session id", async () => {
      await createAdminUser();

      const response = await submitAdminLogin({
        email: adminEmail,
        password: adminPassword,
      });

      const setCookieHeader = response.headers["set-cookie"];

      expect(typeof setCookieHeader).toBe("string");
      expect(setCookieHeader).toContain("admin_session_id=");
      expect(setCookieHeader).toContain("HttpOnly");
      expect(setCookieHeader).toContain("SameSite=Lax");
      expect(setCookieHeader).toContain("Path=/api/v1/admin");
      expect(setCookieHeader).toMatch(/Max-Age=28800|Expires=/);
      expect(setCookieHeader).not.toContain(adminEmail);
      expect(setCookieHeader).not.toContain(adminPassword);
      expect(setCookieHeader).not.toContain(".");

      const sessionId = getAdminSessionId(response);
      const storedSessions = await database.select().from(adminSessions);

      expect(storedSessions[0]?.id).toBe(sessionId);
      expect(sessionId).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe("GET /api/v1/admin/session", () => {
    it("returns 401 without a session cookie", async () => {
      const app = buildApp({ database });

      try {
        const response = await app.inject({
          method: "GET",
          url: "/api/v1/admin/session",
        });

        expect(response.statusCode).toBe(401);
        expect(response.json()).toEqual(authenticationFailedResponse);
      } finally {
        await app.close();
      }
    });

    it("returns 401 for an invalid session id", async () => {
      const app = buildApp({ database });

      try {
        const response = await app.inject({
          method: "GET",
          url: "/api/v1/admin/session",
          headers: {
            cookie: "admin_session_id=not-a-valid-session",
          },
        });

        expect(response.statusCode).toBe(401);
        expect(response.json()).toEqual(authenticationFailedResponse);
      } finally {
        await app.close();
      }
    });

    it("returns 401 for an expired session", async () => {
      const { id: adminUserId } = await createAdminUser();
      await database.insert(adminSessions).values({
        id: "1".repeat(64),
        adminUserId,
        expiresAt: new Date(Date.now() - 60_000),
      });

      const app = buildApp({ database });

      try {
        const response = await app.inject({
          method: "GET",
          url: "/api/v1/admin/session",
          headers: {
            cookie: `admin_session_id=${"1".repeat(64)}`,
          },
        });

        expect(response.statusCode).toBe(401);
        expect(response.json()).toEqual(authenticationFailedResponse);
      } finally {
        await app.close();
      }
    });

    it("returns safe admin information for a valid session", async () => {
      const { id: adminUserId } = await createAdminUser();
      await database.insert(adminSessions).values({
        id: "2".repeat(64),
        adminUserId,
        expiresAt: new Date(Date.now() + 60_000),
      });

      const app = buildApp({ database });

      try {
        const response = await app.inject({
          method: "GET",
          url: "/api/v1/admin/session",
          headers: {
            cookie: `admin_session_id=${"2".repeat(64)}`,
          },
        });

        expect(response.statusCode).toBe(200);
        expect(response.json()).toEqual({
          data: {
            admin: {
              id: adminUserId,
              email: adminEmail,
            },
          },
        });
        expect(JSON.stringify(response.json())).not.toContain("passwordHash");
      } finally {
        await app.close();
      }
    });
  });

  describe("security and public endpoint behavior", () => {
    it("does not log submitted passwords, password hashes, or full session ids", async () => {
      const { passwordHash } = await createAdminUser();
      const { capturedLogs, logger } = createLogCapture();
      const app = buildApp({ database, logger });

      try {
        await app.inject({
          method: "POST",
          url: "/api/v1/admin/login",
          payload: {
            email: adminEmail,
            password: "wrong-secret",
          },
        });
        const successfulResponse = await app.inject({
          method: "POST",
          url: "/api/v1/admin/login",
          payload: {
            email: adminEmail,
            password: adminPassword,
          },
        });

        const sessionId = getAdminSessionId(successfulResponse);
        const serializedLogs = capturedLogs.map((line) => JSON.stringify(line)).join("\n");

        expect(serializedLogs).not.toContain("wrong-secret");
        expect(serializedLogs).not.toContain(adminPassword);
        expect(serializedLogs).not.toContain(passwordHash);
        expect(serializedLogs).not.toContain(sessionId);
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

    it("does not create a session when authentication fails", async () => {
      await createAdminUser();

      await submitAdminLogin({
        email: adminEmail,
        password: "wrong-secret",
      });

      const storedSessions = await database
        .select()
        .from(adminSessions)
        .where(eq(adminSessions.adminUserId, 1));

      expect(storedSessions).toHaveLength(0);
    });
  });
});
