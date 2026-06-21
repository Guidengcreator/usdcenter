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
        },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(getClinicInformation()).resolves.toEqual({
      clinicName: "Test clinic",
      description: "Test ultrasound diagnostic services",
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
});
