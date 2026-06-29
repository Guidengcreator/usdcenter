import { migrate } from "drizzle-orm/postgres-js/migrator";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { buildApp } from "../../src/app.js";
import { createDatabase } from "../../src/db/database.js";
import { appointmentRequests, clinicInformation } from "../../src/db/schema.js";

const testDatabaseUrl =
  process.env.TEST_DATABASE_URL ??
  "postgres://uzd_expert:uzd_expert@localhost:5433/uzd_expert_test";

const { client, database } = createDatabase(testDatabaseUrl);

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
    const app = buildApp({ database });

    const response = await app.inject({
      method: "POST",
      url: "/api/v1/appointment-requests",
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
    const app = buildApp({ database });

    const response = await app.inject({
      method: "POST",
      url: "/api/v1/appointment-requests",
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
    const app = buildApp({ database });

    const response = await app.inject({
      method: "POST",
      url: "/api/v1/appointment-requests",
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
});
