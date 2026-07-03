import { migrate } from "drizzle-orm/postgres-js/migrator";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { buildApp } from "../../src/app.js";
import { createDatabase } from "../../src/db/database.js";
import { appointmentRequests, clinicInformation } from "../../src/db/schema.js";

const testDatabaseUrl =
  process.env.TEST_DATABASE_URL ??
  "postgres://uzd_expert:uzd_expert@localhost:5433/uzd_expert_test";

const { client, database } = createDatabase(testDatabaseUrl);

interface AppointmentRequestPayload {
  comment?: string;
  email?: string;
  fullName?: string;
  phone?: string;
  serviceType?: string;
}

interface CapturedLogLine {
  [key: string]: unknown;
  level?: number;
  msg?: string;
}

const invalidFullNameError = "body/fullName must NOT have fewer than 1 characters";
const invalidPhoneRequiredError = "body/phone must NOT have fewer than 1 characters";
const invalidPhoneFormatError =
  "body/phone must be a valid Ukrainian phone number";
const rateLimitErrorResponse = {
  error: {
    code: "RATE_LIMIT_EXCEEDED",
    message: "Too many appointment request attempts. Please try again later.",
    details: [],
  },
};

async function submitAppointmentRequest(payload: AppointmentRequestPayload) {
  const app = buildApp({ database });

  try {
    return await app.inject({
      method: "POST",
      url: "/api/v1/appointment-requests",
      payload,
    });
  } finally {
    await app.close();
  }
}

async function expectNoStoredAppointmentRequests(): Promise<void> {
  const storedRequests = await database.select().from(appointmentRequests);

  expect(storedRequests).toHaveLength(0);
}

async function expectStoredAppointmentRequestCount(expectedCount: number): Promise<void> {
  const storedRequests = await database.select().from(appointmentRequests);

  expect(storedRequests).toHaveLength(expectedCount);
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

function validAppointmentRequestPayload(
  sequenceNumber: number,
): Required<AppointmentRequestPayload> {
  return {
    fullName: `Rate Limit Patient ${sequenceNumber}`,
    phone: "+380 67 123 45 67",
    email: `patient-${sequenceNumber}@example.com`,
    serviceType: "Abdominal ultrasound",
    comment: `Please call after ${sequenceNumber}:00`,
  };
}

function expectRetryAfterHeader(response: { headers: Record<string, unknown> }) {
  const retryAfterHeader = response.headers["retry-after"];

  expect(typeof retryAfterHeader).toBe("string");

  const retryAfterSeconds = Number(retryAfterHeader);

  expect(Number.isInteger(retryAfterSeconds)).toBe(true);
  expect(retryAfterSeconds).toBeGreaterThan(0);
  expect(retryAfterSeconds).toBeLessThanOrEqual(15 * 60);
}

function createLogCapture(): {
  capturedLogs: CapturedLogLine[];
  logger: boolean;
} {
  const capturedLogs: CapturedLogLine[] = [];

  return {
    capturedLogs,
    logger: {
      level: "warn",
      stream: {
        write(line: string): void {
          capturedLogs.push(JSON.parse(line) as CapturedLogLine);
        },
      },
    } as unknown as boolean,
  };
}

function buildAppWithShortAppointmentRateLimit() {
  return buildApp({
    database,
    appointmentRequestRateLimit: {
      max: 5,
      timeWindowMilliseconds: 100,
    },
  } as unknown as Parameters<typeof buildApp>[0]);
}

async function waitForShortRateLimitWindowToExpire(): Promise<void> {
  await new Promise((resolve) => {
    setTimeout(resolve, 125);
  });
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
    const response = await submitAppointmentRequest({
      fullName: "Test Patient",
      phone: "+380 44 123 45 67",
      email: "patient@example.com",
      serviceType: "Abdominal ultrasound",
      comment: "Please call after 14:00",
    });

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
      phone: "+380441234567",
      email: "patient@example.com",
      serviceType: "Abdominal ultrasound",
      comment: "Please call after 14:00",
      status: "new",
    });
  });

  it.each([
    {
      description: "full name",
      expectedDetails: [invalidFullNameError],
      payload: { phone: "0671234567" },
    },
    {
      description: "phone number",
      expectedDetails: [invalidPhoneRequiredError],
      payload: { fullName: "Test Patient" },
    },
    {
      description: "full name and phone number",
      expectedDetails: [invalidFullNameError, invalidPhoneRequiredError],
      payload: {},
    },
  ])(
    "rejects a request with omitted required field: $description",
    async ({ expectedDetails, payload }) => {
      const response = await submitAppointmentRequest(payload);

      expectValidationErrorResponse(response, expectedDetails);
      await expectNoStoredAppointmentRequests();
    },
  );

  it.each([
    {
      description: "empty full name",
      expectedDetails: [invalidFullNameError],
      payload: { fullName: "", phone: "0671234567" },
    },
    {
      description: "whitespace-only full name",
      expectedDetails: [invalidFullNameError],
      payload: { fullName: "   ", phone: "0671234567" },
    },
    {
      description: "empty phone number",
      expectedDetails: [invalidPhoneRequiredError],
      payload: { fullName: "Test Patient", phone: "" },
    },
    {
      description: "whitespace-only phone number",
      expectedDetails: [invalidPhoneRequiredError],
      payload: { fullName: "Test Patient", phone: "   " },
    },
    {
      description: "empty full name and phone number",
      expectedDetails: [invalidFullNameError, invalidPhoneRequiredError],
      payload: { fullName: "", phone: "" },
    },
    {
      description: "whitespace-only full name and phone number",
      expectedDetails: [invalidFullNameError, invalidPhoneRequiredError],
      payload: { fullName: "   ", phone: "   " },
    },
  ])(
    "rejects a request with empty required field: $description",
    async ({ expectedDetails, payload }) => {
      const response = await submitAppointmentRequest(payload);

      expectValidationErrorResponse(response, expectedDetails);
      await expectNoStoredAppointmentRequests();
    },
  );

  it.each([
    ["+380671234567", "+380671234567"],
    ["+380 67 123 45 67", "+380671234567"],
    ["+380 (67) 123-45-67", "+380671234567"],
    ["0671234567", "+380671234567"],
    ["067 123 45 67", "+380671234567"],
    ["067 123-45-67", "+380671234567"],
    ["0 (67) 123-45-67", "+380671234567"],
  ])(
    "stores valid Ukrainian phone number %s as normalized %s",
    async (phone, normalizedPhone) => {
      const response = await submitAppointmentRequest({
        fullName: "Test Patient",
        phone,
        email: "patient@example.com",
      });

      expect(response.statusCode).toBe(201);

      const storedRequests = await database.select().from(appointmentRequests);

      expect(storedRequests).toHaveLength(1);
      expect(storedRequests[0]?.phone).toBe(normalizedPhone);
    },
  );

  it.each([
    ["abc123", "letters are not allowed"],
    ["+38067123456", "international number is too short"],
    ["+3806712345678", "international number is too long"],
    ["096880743", "national number is too short"],
    ["09688074341", "national number is too long"],
    ["+1 202 555 0174", "non-Ukrainian country code"],
    ["380671234567", "international number is missing plus"],
    ["+0671234567", "national number must not use plus"],
    ["67 123 45 67", "national number is missing leading 0"],
    ["+380.67.123.45.67", "unsupported separator"],
    ["+380/67/123/45/67", "unsupported separator"],
    ["+380+671234567", "plus sign appears more than once"],
    ["067+1234567", "plus sign appears inside the number"],
  ])(
    "rejects invalid Ukrainian phone number %s because %s",
    async (phone) => {
      const response = await submitAppointmentRequest({
        fullName: "Test Patient",
        phone,
        email: "patient@example.com",
      });

      expectValidationErrorResponse(response, [invalidPhoneFormatError]);
      await expectNoStoredAppointmentRequests();
    },
  );

  it("validates appointment request data on the backend independently of frontend validation", async () => {
    const response = await submitAppointmentRequest({
      fullName: "Test Patient",
      phone: "abc123",
      email: "patient@example.com",
    });

    expectValidationErrorResponse(response, [invalidPhoneFormatError]);
    await expectNoStoredAppointmentRequests();
  });

  it("returns a structured API error response for invalid appointment request data", async () => {
    const response = await submitAppointmentRequest({
      fullName: "",
      phone: "abc123",
      email: "patient@example.com",
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid request data",
        details: expect.arrayContaining([
          invalidFullNameError,
          invalidPhoneFormatError,
        ]),
      },
    });
    await expectNoStoredAppointmentRequests();
  });

  it("allows attempts 1 through 5 from the same source IP and rejects the sixth and later attempts", async () => {
    const app = buildApp({ database });

    try {
      const allowedResponses = [];

      for (let attempt = 1; attempt <= 5; attempt += 1) {
        allowedResponses.push(
          await app.inject({
            method: "POST",
            remoteAddress: "203.0.113.10",
            url: "/api/v1/appointment-requests",
            payload: validAppointmentRequestPayload(attempt),
          }),
        );
      }

      for (const response of allowedResponses) {
        expect(response.statusCode).toBe(201);
      }

      await expectStoredAppointmentRequestCount(5);

      const sixthResponse = await app.inject({
        method: "POST",
        remoteAddress: "203.0.113.10",
        url: "/api/v1/appointment-requests",
        payload: validAppointmentRequestPayload(6),
      });

      expect(sixthResponse.statusCode).toBe(429);
      expect(sixthResponse.json()).toEqual(rateLimitErrorResponse);
      expectRetryAfterHeader(sixthResponse);
      await expectStoredAppointmentRequestCount(5);

      const seventhResponse = await app.inject({
        method: "POST",
        remoteAddress: "203.0.113.10",
        url: "/api/v1/appointment-requests",
        payload: validAppointmentRequestPayload(7),
      });

      expect(seventhResponse.statusCode).toBe(429);
      expect(seventhResponse.json()).toEqual(rateLimitErrorResponse);
      expectRetryAfterHeader(seventhResponse);
      await expectStoredAppointmentRequestCount(5);
    } finally {
      await app.close();
    }
  });

  it("allows the same source IP to submit again after the 15-minute window expires", async () => {
    const app = buildAppWithShortAppointmentRateLimit();

    try {
      for (let attempt = 1; attempt <= 5; attempt += 1) {
        const response = await app.inject({
          method: "POST",
          remoteAddress: "203.0.113.20",
          url: "/api/v1/appointment-requests",
          payload: validAppointmentRequestPayload(attempt),
        });

        expect(response.statusCode).toBe(201);
      }

      const limitedResponse = await app.inject({
        method: "POST",
        remoteAddress: "203.0.113.20",
        url: "/api/v1/appointment-requests",
        payload: validAppointmentRequestPayload(6),
      });

      expect(limitedResponse.statusCode).toBe(429);

      await waitForShortRateLimitWindowToExpire();

      const responseAfterWindow = await app.inject({
        method: "POST",
        remoteAddress: "203.0.113.20",
        url: "/api/v1/appointment-requests",
        payload: validAppointmentRequestPayload(7),
      });

      expect(responseAfterWindow.statusCode).toBe(201);
      await expectStoredAppointmentRequestCount(6);
    } finally {
      await app.close();
    }
  });

  it("keeps appointment submission counters isolated by source IP", async () => {
    const app = buildApp({ database });

    try {
      for (let attempt = 1; attempt <= 5; attempt += 1) {
        const response = await app.inject({
          method: "POST",
          remoteAddress: "203.0.113.30",
          url: "/api/v1/appointment-requests",
          payload: validAppointmentRequestPayload(attempt),
        });

        expect(response.statusCode).toBe(201);
      }

      const limitedResponse = await app.inject({
        method: "POST",
        remoteAddress: "203.0.113.30",
        url: "/api/v1/appointment-requests",
        payload: validAppointmentRequestPayload(6),
      });

      expect(limitedResponse.statusCode).toBe(429);

      const otherSourceIpResponse = await app.inject({
        method: "POST",
        remoteAddress: "203.0.113.31",
        url: "/api/v1/appointment-requests",
        payload: validAppointmentRequestPayload(7),
      });

      expect(otherSourceIpResponse.statusCode).toBe(201);
      await expectStoredAppointmentRequestCount(6);
    } finally {
      await app.close();
    }
  });

  it("uses Fastify trustProxy configuration for source IP resolution without trusting forwarded headers by default", async () => {
    const appWithoutTrustedProxy = buildApp({ database });

    try {
      for (let attempt = 1; attempt <= 5; attempt += 1) {
        const response = await appWithoutTrustedProxy.inject({
          method: "POST",
          headers: {
            "x-forwarded-for": `198.51.100.${attempt}`,
          },
          remoteAddress: "203.0.113.70",
          url: "/api/v1/appointment-requests",
          payload: validAppointmentRequestPayload(attempt),
        });

        expect(response.statusCode).toBe(201);
      }

      const limitedResponse = await appWithoutTrustedProxy.inject({
        method: "POST",
        headers: {
          "x-forwarded-for": "198.51.100.6",
        },
        remoteAddress: "203.0.113.70",
        url: "/api/v1/appointment-requests",
        payload: validAppointmentRequestPayload(6),
      });

      expect(limitedResponse.statusCode).toBe(429);
    } finally {
      await appWithoutTrustedProxy.close();
    }

    await database.delete(appointmentRequests);

    const appWithTrustedProxy = buildApp({ database, trustProxy: 1 });

    try {
      for (let attempt = 1; attempt <= 5; attempt += 1) {
        const response = await appWithTrustedProxy.inject({
          method: "POST",
          headers: {
            "x-forwarded-for": "198.51.100.10",
          },
          remoteAddress: "203.0.113.71",
          url: "/api/v1/appointment-requests",
          payload: validAppointmentRequestPayload(attempt),
        });

        expect(response.statusCode).toBe(201);
      }

      const otherForwardedClientResponse = await appWithTrustedProxy.inject({
        method: "POST",
        headers: {
          "x-forwarded-for": "198.51.100.11",
        },
        remoteAddress: "203.0.113.71",
        url: "/api/v1/appointment-requests",
        payload: validAppointmentRequestPayload(6),
      });

      expect(otherForwardedClientResponse.statusCode).toBe(201);
    } finally {
      await appWithTrustedProxy.close();
    }
  });

  it("does not rate limit unrelated public clinic information requests", async () => {
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
      for (let attempt = 1; attempt <= 6; attempt += 1) {
        await app.inject({
          method: "POST",
          remoteAddress: "203.0.113.40",
          url: "/api/v1/appointment-requests",
          payload: validAppointmentRequestPayload(attempt),
        });
      }

      const clinicResponse = await app.inject({
        method: "GET",
        remoteAddress: "203.0.113.40",
        url: "/api/v1/clinic-information",
      });

      expect(clinicResponse.statusCode).toBe(200);
    } finally {
      await app.close();
    }
  });

  it("counts malformed appointment submission attempts before validation and business logic", async () => {
    const app = buildApp({ database });

    try {
      for (let attempt = 1; attempt <= 5; attempt += 1) {
        const response = await app.inject({
          method: "POST",
          remoteAddress: "203.0.113.50",
          url: "/api/v1/appointment-requests",
          payload: {
            fullName: "",
            phone: `invalid-${attempt}`,
            email: "invalid-email-marker@example.com",
            serviceType: "Invalid marker service",
            comment: "Invalid marker comment",
          },
        });

        expect(response.statusCode).toBe(400);
      }

      const sixthMalformedResponse = await app.inject({
        method: "POST",
        remoteAddress: "203.0.113.50",
        url: "/api/v1/appointment-requests",
        payload: {
          fullName: "",
          phone: "invalid-6",
          email: "invalid-email-marker@example.com",
          serviceType: "Invalid marker service",
          comment: "Invalid marker comment",
        },
      });

      expect(sixthMalformedResponse.statusCode).toBe(429);
      expect(sixthMalformedResponse.json()).toEqual(rateLimitErrorResponse);
      await expectNoStoredAppointmentRequests();
    } finally {
      await app.close();
    }
  });

  it("emits a safe structured warning log when appointment submissions are rate limited", async () => {
    const { capturedLogs, logger } = createLogCapture();
    const app = buildApp({ database, logger });
    const sensitiveMarkers = [
      "US23_FULL_NAME_MARKER",
      "+380 67 765 43 21",
      "us23-email-marker@example.com",
      "US23_SERVICE_TYPE_MARKER",
      "US23_COMMENT_MARKER",
    ];

    try {
      for (let attempt = 1; attempt <= 5; attempt += 1) {
        const response = await app.inject({
          method: "POST",
          remoteAddress: "203.0.113.60",
          url: "/api/v1/appointment-requests",
          payload: validAppointmentRequestPayload(attempt),
        });

        expect(response.statusCode).toBe(201);
      }

      const limitedResponse = await app.inject({
        method: "POST",
        remoteAddress: "203.0.113.60",
        url: "/api/v1/appointment-requests",
        payload: {
          fullName: sensitiveMarkers[0],
          phone: sensitiveMarkers[1],
          email: sensitiveMarkers[2],
          serviceType: sensitiveMarkers[3],
          comment: sensitiveMarkers[4],
        },
      });

      expect(limitedResponse.statusCode).toBe(429);

      const rateLimitLog = capturedLogs.find(
        (log) => log["event"] === "appointment_request_rate_limited",
      );

      expect(rateLimitLog).toMatchObject({
        event: "appointment_request_rate_limited",
        level: 40,
        method: "POST",
        route: "/api/v1/appointment-requests",
        sourceIp: "203.0.113.60",
        configuredMax: 5,
        configuredTimeWindowSeconds: 900,
      });
      expect(rateLimitLog?.["retryAfterSeconds"]).toEqual(expect.any(Number));
      expect(rateLimitLog?.["requestId"]).toEqual(expect.any(String));

      const serializedRateLimitLog = JSON.stringify(rateLimitLog);

      for (const forbiddenText of [
        "request.body",
        "body",
        "headers",
        "fullName",
        "phone",
        "email",
        "serviceType",
        "comment",
        ...sensitiveMarkers,
      ]) {
        expect(serializedRateLimitLog).not.toContain(forbiddenText);
      }
    } finally {
      await app.close();
    }
  });
});
