import type { AppointmentRequestsRepository } from "./appointment-requests.repository.js";

export interface SubmitAppointmentRequestInput {
  comment?: string;
  email?: string;
  fullName: string;
  phone: string;
  serviceType?: string;
}

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
      ...(fullName.length === 0
        ? ["body/fullName must NOT have fewer than 1 characters"]
        : []),
      ...(phone.length === 0
        ? ["body/phone must NOT have fewer than 1 characters"]
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
