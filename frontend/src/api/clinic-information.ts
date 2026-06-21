export interface ClinicInformation {
  clinicName: string;
  description: string;
}

interface ClinicInformationResponse {
  data: ClinicInformation;
}

function isClinicInformationResponse(
  value: unknown,
): value is ClinicInformationResponse {
  if (!value || typeof value !== "object" || !("data" in value)) {
    return false;
  }

  const { data } = value;

  return (
    !!data &&
    typeof data === "object" &&
    "clinicName" in data &&
    typeof data.clinicName === "string" &&
    "description" in data &&
    typeof data.description === "string"
  );
}

export async function getClinicInformation(
  signal?: AbortSignal,
): Promise<ClinicInformation> {
  const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000")
    .replace(/\/$/, "");
  const response = await fetch(`${apiBaseUrl}/api/v1/clinic-information`, {
    headers: {
      Accept: "application/json",
    },
    signal,
  });

  if (!response.ok) {
    throw new Error(`Clinic information request failed with ${response.status}`);
  }

  const payload: unknown = await response.json();

  if (!isClinicInformationResponse(payload)) {
    throw new Error("Clinic information response is invalid");
  }

  return payload.data;
}
