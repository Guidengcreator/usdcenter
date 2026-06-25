export interface SubmitAppointmentRequestInput {
  comment?: string;
  email?: string;
  fullName: string;
  phone: string;
  serviceType?: string;
}

export interface SubmitAppointmentRequestResult {
  message: string;
}

interface SubmitAppointmentRequestResponse {
  data: SubmitAppointmentRequestResult;
}

interface ErrorResponse {
  error: {
    code: string;
    details: string[];
    message: string;
  };
}

export class AppointmentRequestSubmissionError extends Error {
  public constructor(
    message: string,
    public readonly details: string[] = [],
  ) {
    super(message);
    this.name = "AppointmentRequestSubmissionError";
  }
}

function isSubmitAppointmentRequestResponse(
  value: unknown,
): value is SubmitAppointmentRequestResponse {
  if (!value || typeof value !== "object" || !("data" in value)) {
    return false;
  }

  const { data } = value;

  return (
    !!data &&
    typeof data === "object" &&
    "message" in data &&
    typeof data.message === "string"
  );
}

function isErrorResponse(value: unknown): value is ErrorResponse {
  if (!value || typeof value !== "object" || !("error" in value)) {
    return false;
  }

  const { error } = value;

  return (
    !!error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string" &&
    "details" in error &&
    Array.isArray(error.details) &&
    error.details.every((detail) => typeof detail === "string")
  );
}

export async function submitAppointmentRequest(
  input: SubmitAppointmentRequestInput,
  signal?: AbortSignal,
): Promise<SubmitAppointmentRequestResult> {
  const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000")
    .replace(/\/$/, "");
  const response = await fetch(`${apiBaseUrl}/api/v1/appointment-requests`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
    signal,
  });

  const payload: unknown = await response.json();

  if (!response.ok) {
    if (isErrorResponse(payload)) {
      throw new AppointmentRequestSubmissionError(
        payload.error.message,
        payload.error.details,
      );
    }

    throw new AppointmentRequestSubmissionError(
      `Appointment request failed with ${response.status}`,
    );
  }

  if (!isSubmitAppointmentRequestResponse(payload)) {
    throw new AppointmentRequestSubmissionError(
      "Appointment request response is invalid",
    );
  }

  return payload.data;
}
