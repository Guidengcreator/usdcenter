import type { AppointmentRequestsRepository } from "./appointment-requests.repository.js";

export interface SubmitAppointmentRequestInput {
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

export class AppointmentRequestValidationError extends Error {
  public constructor(public readonly details: string[]) {
    super("Invalid request data");
    this.name = "AppointmentRequestValidationError";
  }
}

export class AppointmentRequestsService {
  public constructor(
    private readonly appointmentRequestsRepository: AppointmentRequestsRepository,
  ) {}

  public async submitAppointmentRequest(
    input: SubmitAppointmentRequestInput,
  ): Promise<void> {
    const fullName = input.fullName?.trim() ?? "";
    const phone = input.phone?.trim() ?? "";
    const normalizedPhone = normalizeUkrainianPhoneNumber(phone);

    const details = [
      ...(fullName.length === 0 ? [invalidFullNameError] : []),
      ...(phone.length === 0 ? [invalidPhoneRequiredError] : []),
      ...(phone.length > 0 && normalizedPhone === null
        ? [invalidPhoneFormatError]
        : []),
    ];

    if (details.length > 0) {
      throw new AppointmentRequestValidationError(details);
    }

    if (normalizedPhone === null) {
      throw new AppointmentRequestValidationError([invalidPhoneFormatError]);
    }

    await this.appointmentRequestsRepository.create({
      fullName,
      phone: normalizedPhone,
      email: normalizeOptionalText(input.email),
      serviceType: normalizeOptionalText(input.serviceType),
      comment: normalizeOptionalText(input.comment),
      status: "new",
    });
  }
}

function normalizeOptionalText(value: string | undefined): string | null {
  const normalizedValue = value?.trim();

  if (!normalizedValue) {
    return null;
  }

  return normalizedValue;
}

function normalizeUkrainianPhoneNumber(value: string): string | null {
  if (/[^0-9+\s()-]/.test(value)) {
    return null;
  }

  const plusMatches = value.match(/\+/g) ?? [];

  if (plusMatches.length > 1 || (plusMatches.length === 1 && !value.startsWith("+"))) {
    return null;
  }

  const digitsOnly = value.replace(/\D/g, "");

  if (value.startsWith("+")) {
    return digitsOnly.length === 12 && digitsOnly.startsWith("380")
      ? `+${digitsOnly}`
      : null;
  }

  return digitsOnly.length === 10 && digitsOnly.startsWith("0")
    ? `+38${digitsOnly}`
    : null;
}
