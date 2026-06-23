import { migrate } from "drizzle-orm/postgres-js/migrator";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { buildApp } from "../../src/app.js";
import { createDatabase } from "../../src/db/database.js";
import { clinicInformation } from "../../src/db/schema.js";

const testDatabaseUrl =
  process.env.TEST_DATABASE_URL ??
  "postgres://uzd_expert:uzd_expert@localhost:5433/uzd_expert_test";

const { client, database } = createDatabase(testDatabaseUrl);

describe("GET /api/v1/clinic-information", () => {
  beforeAll(async () => {
    await migrate(database, { migrationsFolder: "drizzle" });
  });

  beforeEach(async () => {
    await database.delete(clinicInformation);
  });

  afterAll(async () => {
    await client.end();
  });

  it("returns clinic information without authentication", async () => {
    await database.insert(clinicInformation).values({
      clinicName: "Test clinic",
      description: "Test ultrasound diagnostic services",
      address: "Test street 1",
      phone: "+380 44 123 45 67",
      email: "info@testclinic.example",
      workingHours: "Mon-Fri: 09:00-18:00",
    });

    const app = buildApp({ database });

    const response = await app.inject({
      method: "GET",
      url: "/api/v1/clinic-information",
    });

    await app.close();

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      data: {
        clinicName: "Test clinic",
        description: "Test ultrasound diagnostic services",
        address: "Test street 1",
        phone: "+380 44 123 45 67",
        email: "info@testclinic.example",
        workingHours: "Mon-Fri: 09:00-18:00",
      },
    });
  });

  it("returns a null email address when none is configured", async () => {
    await database.insert(clinicInformation).values({
      clinicName: "Test clinic",
      description: "Test ultrasound diagnostic services",
      address: "Test street 1",
      phone: "+380 44 123 45 67",
      email: null,
      workingHours: "Mon-Fri: 09:00-18:00",
    });

    const app = buildApp({ database });

    const response = await app.inject({
      method: "GET",
      url: "/api/v1/clinic-information",
    });

    await app.close();

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      data: {
        clinicName: "Test clinic",
        description: "Test ultrasound diagnostic services",
        address: "Test street 1",
        phone: "+380 44 123 45 67",
        email: null,
        workingHours: "Mon-Fri: 09:00-18:00",
      },
    });
  });

  it("returns the documented error when clinic information is not configured", async () => {
    const app = buildApp({ database });

    const response = await app.inject({
      method: "GET",
      url: "/api/v1/clinic-information",
    });

    await app.close();

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({
      error: {
        code: "CLINIC_INFORMATION_NOT_FOUND",
        message: "Clinic information is not configured",
        details: [],
      },
    });
  });
});
