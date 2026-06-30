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

const invalidFullNameError = "body/fullName must NOT have fewer than 1 characters";
const invalidPhoneRequiredError = "body/phone must NOT have fewer than 1 characters";
const invalidPhoneFormatError =
  "body/phone must be a valid Ukrainian phone number";

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
});
