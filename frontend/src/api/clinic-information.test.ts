import { afterEach, describe, expect, it, vi } from "vitest";

import { getClinicInformation } from "./clinic-information.js";

describe("clinic information API", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("retrieves public clinic information from the versioned backend endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({
        data: {
          clinicName: "Test clinic",
          description: "Test ultrasound diagnostic services",
          address: "Test street 1",
          phone: "+380 44 123 45 67",
          email: "info@testclinic.example",
          workingHours: "Mon-Fri: 09:00-18:00",
        },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(getClinicInformation()).resolves.toEqual({
      clinicName: "Test clinic",
      description: "Test ultrasound diagnostic services",
      address: "Test street 1",
      phone: "+380 44 123 45 67",
      email: "info@testclinic.example",
      workingHours: "Mon-Fri: 09:00-18:00",
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3000/api/v1/clinic-information",
      {
        headers: {
          Accept: "application/json",
        },
        signal: undefined,
      },
    );
  });

  it("accepts a null email address in the backend response", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({
        data: {
          clinicName: "Test clinic",
          description: "Test ultrasound diagnostic services",
          address: "Test street 1",
          phone: "+380 44 123 45 67",
          email: null,
          workingHours: "Mon-Fri: 09:00-18:00",
        },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(getClinicInformation()).resolves.toEqual({
      clinicName: "Test clinic",
      description: "Test ultrasound diagnostic services",
      address: "Test street 1",
      phone: "+380 44 123 45 67",
      email: null,
      workingHours: "Mon-Fri: 09:00-18:00",
    });
  });
});
