import { afterEach, describe, expect, it, vi } from "vitest";

import {
  AppointmentRequestSubmissionError,
  submitAppointmentRequest,
} from "./appointment-requests.js";

describe("appointment requests API", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("submits a public appointment request to the versioned backend endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: vi.fn().mockResolvedValue({
        data: {
          message: "Appointment request submitted successfully",
        },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      submitAppointmentRequest({
        fullName: "Test Patient",
        phone: "+380 44 123 45 67",
        email: "patient@example.com",
        serviceType: "Abdominal ultrasound",
        comment: "Please call after 14:00",
      }),
    ).resolves.toEqual({
      message: "Appointment request submitted successfully",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3000/api/v1/appointment-requests",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: "Test Patient",
          phone: "+380 44 123 45 67",
          email: "patient@example.com",
          serviceType: "Abdominal ultrasound",
          comment: "Please call after 14:00",
        }),
        signal: undefined,
      },
    );
  });

  it("surfaces validation details returned by the backend", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: vi.fn().mockResolvedValue({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid request data",
          details: ["body/phone must NOT have fewer than 1 characters"],
        },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      submitAppointmentRequest({
        fullName: "Test Patient",
        phone: "",
      }),
    ).rejects.toEqual(
      new AppointmentRequestSubmissionError("Invalid request data", [
        "body/phone must NOT have fewer than 1 characters",
      ]),
    );
  });

  it("surfaces phone format validation details returned by the backend", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: vi.fn().mockResolvedValue({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid request data",
          details: ["body/phone must be a valid phone number"],
        },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      submitAppointmentRequest({
        fullName: "Test Patient",
        phone: "abc123",
      }),
    ).rejects.toEqual(
      new AppointmentRequestSubmissionError("Invalid request data", [
        "body/phone must be a valid phone number",
      ]),
    );
  });

  it("surfaces rate limit errors returned by the backend", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: vi.fn().mockResolvedValue({
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: "Too many appointment requests. Please try again later.",
          details: [],
        },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      submitAppointmentRequest({
        fullName: "Test Patient",
        phone: "+380 44 123 45 67",
      }),
    ).rejects.toEqual(
      new AppointmentRequestSubmissionError(
        "Too many appointment requests. Please try again later.",
        [],
      ),
    );
  });
});
