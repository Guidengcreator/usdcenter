import type { AppointmentRequestsRepository } from "./appointment-requests.repository.js";

export interface SubmitAppointmentRequestInput {
  comment?: string;
  email?: string;
  fullName: string;
  phone: string;
  serviceType?: string;
}

const invalidFullNameError = "body/fullName must NOT have fewer than 1 characters";
const invalidPhoneRequiredError = "body/phone must NOT have fewer than 1 characters";
const invalidPhoneFormatError = "body/phone must be a valid phone number";

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
    const fullName = input.fullName.trim();
    const phone = input.phone.trim();

    const details = [
      ...(fullName.length === 0 ? [invalidFullNameError] : []),
      ...(phone.length === 0 ? [invalidPhoneRequiredError] : []),
      ...(phone.length > 0 && !isValidPhoneNumber(phone)
        ? [invalidPhoneFormatError]
        : []),
    ];

    if (details.length > 0) {
      throw new AppointmentRequestValidationError(details);
    }

    await this.appointmentRequestsRepository.create({
      fullName,
      phone,
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

function isValidPhoneNumber(value: string): boolean {
  if (/[^0-9+\s()-]/.test(value)) {
    return false;
  }

  const plusMatches = value.match(/\+/g) ?? [];

  if (plusMatches.length > 1 || (plusMatches.length === 1 && !value.startsWith("+"))) {
    return false;
  }

  const digitsOnly = value.replace(/\D/g, "");

  return digitsOnly.length >= 10 && digitsOnly.length <= 15;
}
