import { migrate } from "drizzle-orm/postgres-js/migrator";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { buildApp } from "../../src/app.js";
import { createDatabase } from "../../src/db/database.js";
import { appointmentRequests, clinicInformation } from "../../src/db/schema.js";
import { InMemoryAppointmentRequestsRateLimiter } from "../../src/modules/appointment-requests/appointment-requests-rate-limiter.js";

const testDatabaseUrl =
  process.env.TEST_DATABASE_URL ??
  "postgres://uzd_expert:uzd_expert@localhost:5433/uzd_expert_test";

const { client, database } = createDatabase(testDatabaseUrl);

const rateLimitWindowMs = 15 * 60 * 1000;

class FakeClock {
  private currentTimeMs = 0;

  public now = (): number => this.currentTimeMs;

  public advance(ms: number): void {
    this.currentTimeMs += ms;
  }
}

function buildTestApp(clock = new FakeClock()) {
  return {
    app: buildApp({
      database,
      appointmentRequestsRateLimiter: new InMemoryAppointmentRequestsRateLimiter(
        5,
        rateLimitWindowMs,
        clock.now,
      ),
    }),
    clock,
  };
}

function validAppointmentPayload(index: number) {
  return {
    fullName: `Test Patient ${index}`,
    phone: `+380 44 123 45 ${String(index).padStart(2, "0")}`,
    email: `patient-${index}@example.com`,
    serviceType: "Abdominal ultrasound",
    comment: `Please call after ${String(10 + index).padStart(2, "0")}:00`,
  };
}

async function submitAppointmentRequest(
  app: ReturnType<typeof buildApp>,
  options: {
    payload?: Record<string, unknown>;
    sourceIp?: string;
  } = {},
) {
  return app.inject({
    method: "POST",
    url: "/api/v1/appointment-requests",
    remoteAddress: options.sourceIp ?? "203.0.113.10",
    payload: options.payload ?? validAppointmentPayload(1),
  });
}

async function storedAppointmentRequestsCount(): Promise<number> {
  const storedRequests = await database.select().from(appointmentRequests);

  return storedRequests.length;
}

describe("POST /api/v1/appointment-requests", () => {
  beforeAll(async () => {
    await migrate(database, { migrationsFolder: "drizzle" });
  });

  beforeEach(async () => {
    await database.delete(appointmentRequests);
    await database.delete(clinicInformation);
  });

  afterAll(async () => {
    await client.end();
  });

  it("stores a public appointment request and returns a confirmation message", async () => {
    const { app } = buildTestApp();

    const response = await app.inject({
      method: "POST",
      url: "/api/v1/appointment-requests",
      remoteAddress: "203.0.113.10",
      payload: {
        fullName: "Test Patient",
        phone: "+380 44 123 45 67",
        email: "patient@example.com",
        serviceType: "Abdominal ultrasound",
        comment: "Please call after 14:00",
      },
    });

    await app.close();

    expect(response.statusCode).toBe(201);
    expect(response.json()).toEqual({
      data: {
        message: "Appointment request submitted successfully",
      },
    });

    const storedRequests = await database.select().from(appointmentRequests);

    expect(storedRequests).toHaveLength(1);
    expect(storedRequests[0]).toMatchObject({
      fullName: "Test Patient",
      phone: "+380 44 123 45 67",
      email: "patient@example.com",
      serviceType: "Abdominal ultrasound",
      comment: "Please call after 14:00",
      status: "new",
    });
  });

  it("rejects a request without required fields", async () => {
    const { app } = buildTestApp();

    const response = await app.inject({
      method: "POST",
      url: "/api/v1/appointment-requests",
      remoteAddress: "203.0.113.10",
      payload: {
        fullName: "",
        phone: "",
        email: "patient@example.com",
      },
    });

    await app.close();

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid request data",
        details: expect.arrayContaining([
          "body/fullName must NOT have fewer than 1 characters",
          "body/phone must NOT have fewer than 1 characters",
        ]),
      },
    });

    const storedRequests = await database.select().from(appointmentRequests);

    expect(storedRequests).toHaveLength(0);
  });

  it("rejects a request with an invalid phone number format", async () => {
    const { app } = buildTestApp();

    const response = await app.inject({
      method: "POST",
      url: "/api/v1/appointment-requests",
      remoteAddress: "203.0.113.10",
      payload: {
        fullName: "Test Patient",
        phone: "abc123",
        email: "patient@example.com",
      },
    });

    await app.close();

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid request data",
        details: ["body/phone must be a valid phone number"],
      },
    });

    const storedRequests = await database.select().from(appointmentRequests);

    expect(storedRequests).toHaveLength(0);
  });

  it("accepts the first 5 appointment requests from the same source IP within the rolling window", async () => {
    const { app } = buildTestApp();

    for (let index = 1; index <= 5; index += 1) {
      const response = await submitAppointmentRequest(app, {
        payload: validAppointmentPayload(index),
        sourceIp: "203.0.113.10",
      });

      expect(response.statusCode).toBe(201);
    }

    await app.close();

    await expect(storedAppointmentRequestsCount()).resolves.toBe(5);
  });

  it("rejects the 6th appointment request from the same source IP with HTTP 429", async () => {
    const { app } = buildTestApp();

    for (let index = 1; index <= 5; index += 1) {
      await submitAppointmentRequest(app, {
        payload: validAppointmentPayload(index),
        sourceIp: "203.0.113.10",
      });
    }

    const excessiveResponse = await submitAppointmentRequest(app, {
      payload: validAppointmentPayload(6),
      sourceIp: "203.0.113.10",
    });

    await app.close();

    expect(excessiveResponse.statusCode).toBe(429);
    expect(excessiveResponse.json()).toEqual({
      error: {
        code: "RATE_LIMIT_EXCEEDED",
        message: "Too many appointment requests. Please try again later.",
        details: [],
      },
    });
    await expect(storedAppointmentRequestsCount()).resolves.toBe(5);
  });

  it("returns a Retry-After header with the seconds remaining in the rolling window", async () => {
    const { app, clock } = buildTestApp();

    for (let index = 1; index <= 5; index += 1) {
      await submitAppointmentRequest(app, {
        payload: validAppointmentPayload(index),
        sourceIp: "203.0.113.10",
      });
    }

    clock.advance(14 * 60 * 1000 + 30 * 1000);

    const excessiveResponse = await submitAppointmentRequest(app, {
      payload: validAppointmentPayload(6),
      sourceIp: "203.0.113.10",
    });

    await app.close();

    expect(excessiveResponse.statusCode).toBe(429);
    expect(excessiveResponse.headers["retry-after"]).toBe("30");
  });

  it("allows appointment requests again after the rolling window expires", async () => {
    const { app, clock } = buildTestApp();

    for (let index = 1; index <= 5; index += 1) {
      await submitAppointmentRequest(app, {
        payload: validAppointmentPayload(index),
        sourceIp: "203.0.113.10",
      });
    }

    clock.advance(rateLimitWindowMs);

    const responseAfterWindow = await submitAppointmentRequest(app, {
      payload: validAppointmentPayload(6),
      sourceIp: "203.0.113.10",
    });

    await app.close();

    expect(responseAfterWindow.statusCode).toBe(201);
    await expect(storedAppointmentRequestsCount()).resolves.toBe(6);
  });

  it("keeps rate limits isolated between different source IP addresses", async () => {
    const { app } = buildTestApp();

    for (let index = 1; index <= 5; index += 1) {
      await submitAppointmentRequest(app, {
        payload: validAppointmentPayload(index),
        sourceIp: "203.0.113.10",
      });
    }

    const differentIpResponse = await submitAppointmentRequest(app, {
      payload: validAppointmentPayload(6),
      sourceIp: "203.0.113.11",
    });

    const originalIpResponse = await submitAppointmentRequest(app, {
      payload: validAppointmentPayload(7),
      sourceIp: "203.0.113.10",
    });

    await app.close();

    expect(differentIpResponse.statusCode).toBe(201);
    expect(originalIpResponse.statusCode).toBe(429);
    await expect(storedAppointmentRequestsCount()).resolves.toBe(6);
  });

  it("logs rate-limited appointment requests without sensitive form data", async () => {
    const { app } = buildTestApp();
    const warnSpy = vi.spyOn(app.log, "warn");

    for (let index = 1; index <= 5; index += 1) {
      await submitAppointmentRequest(app, {
        payload: validAppointmentPayload(index),
        sourceIp: "203.0.113.10",
      });
    }

    const blockedPayload = {
      fullName: "Blocked Patient",
      phone: "+380 44 123 45 99",
      email: "blocked@example.com",
      serviceType: "Cardiac ultrasound",
      comment: "Sensitive personal note",
    };

    const response = await submitAppointmentRequest(app, {
      payload: blockedPayload,
      sourceIp: "203.0.113.10",
    });

    await app.close();

    expect(response.statusCode).toBe(429);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceIp: "203.0.113.10",
        retryAfterSeconds: 900,
        route: "/api/v1/appointment-requests",
      }),
      "Appointment request rate limit exceeded",
    );

    const serializedLogCalls = JSON.stringify(warnSpy.mock.calls);

    expect(serializedLogCalls).not.toContain(blockedPayload.fullName);
    expect(serializedLogCalls).not.toContain(blockedPayload.phone);
    expect(serializedLogCalls).not.toContain(blockedPayload.email);
    expect(serializedLogCalls).not.toContain(blockedPayload.serviceType);
    expect(serializedLogCalls).not.toContain(blockedPayload.comment);
  });

  it("applies backend rate limiting when the frontend is bypassed", async () => {
    const { app } = buildTestApp();

    for (let index = 1; index <= 5; index += 1) {
      await submitAppointmentRequest(app, {
        payload: validAppointmentPayload(index),
        sourceIp: "203.0.113.10",
      });
    }

    const directBackendResponse = await app.inject({
      method: "POST",
      url: "/api/v1/appointment-requests",
      remoteAddress: "203.0.113.10",
      payload: {
        fullName: "Direct API Patient",
        phone: "+380 44 123 45 69",
      },
    });

    await app.close();

    expect(directBackendResponse.statusCode).toBe(429);
    await expect(storedAppointmentRequestsCount()).resolves.toBe(5);
  });

  it("returns the minimum Retry-After value near the end of a rate limit window", async () => {
    const { app, clock } = buildTestApp();

    for (let index = 1; index <= 5; index += 1) {
      await submitAppointmentRequest(app, {
        payload: validAppointmentPayload(index),
        sourceIp: "203.0.113.10",
      });
    }

    clock.advance(rateLimitWindowMs - 1);

    const excessiveResponse = await submitAppointmentRequest(app, {
      payload: validAppointmentPayload(6),
      sourceIp: "203.0.113.10",
    });

    await app.close();

    expect(excessiveResponse.statusCode).toBe(429);
    expect(excessiveResponse.headers["retry-after"]).toBe("1");
  });

  it("does not store a rate-limited request even when the payload would fail business validation", async () => {
    const { app } = buildTestApp();

    for (let index = 1; index <= 5; index += 1) {
      await submitAppointmentRequest(app, {
        payload: validAppointmentPayload(index),
        sourceIp: "203.0.113.10",
      });
    }

    const rateLimitedInvalidResponse = await submitAppointmentRequest(app, {
      payload: {
        fullName: "Blocked Patient",
        phone: "not-a-phone-number",
      },
      sourceIp: "203.0.113.10",
    });

    await app.close();

    expect(rateLimitedInvalidResponse.statusCode).toBe(429);
    await expect(storedAppointmentRequestsCount()).resolves.toBe(5);
  });
});
