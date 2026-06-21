import type {
  ClinicInformationRepository,
  PublicClinicInformation,
} from "./clinic-information.repository.js";

export class ClinicInformationNotFoundError extends Error {
  public constructor() {
    super("Clinic information is not configured");
    this.name = "ClinicInformationNotFoundError";
  }
}

export class ClinicInformationService {
  public constructor(
    private readonly clinicInformationRepository: ClinicInformationRepository,
  ) {}

  public async getPublicInformation(): Promise<PublicClinicInformation> {
    const information =
      await this.clinicInformationRepository.findPublicInformation();

    if (!information) {
      throw new ClinicInformationNotFoundError();
    }

    return information;
  }
}
