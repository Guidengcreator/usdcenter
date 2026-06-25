import cors from "@fastify/cors";
import Fastify from "fastify";
import type { FastifySchemaValidationError } from "fastify/types/schema.js";

import type { Database } from "./db/database.js";
import { AppointmentRequestsRepository } from "./modules/appointment-requests/appointment-requests.repository.js";
import { registerAppointmentRequestsRoutes } from "./modules/appointment-requests/appointment-requests.routes.js";
import {
  AppointmentRequestValidationError,
  AppointmentRequestsService,
} from "./modules/appointment-requests/appointment-requests.service.js";
import { ClinicInformationRepository } from "./modules/clinic/clinic-information.repository.js";
import { registerClinicInformationRoutes } from "./modules/clinic/clinic-information.routes.js";
import {
  ClinicInformationNotFoundError,
  ClinicInformationService,
} from "./modules/clinic/clinic-information.service.js";

interface BuildAppDependencies {
  corsOrigin?: string;
  database: Database;
  logger?: boolean;
}

export function buildApp({
  corsOrigin,
  database,
  logger = false,
}: BuildAppDependencies) {
  const app = Fastify({ logger });

  if (corsOrigin) {
    void app.register(cors, { origin: corsOrigin });
  }

  const appointmentRequestsRepository = new AppointmentRequestsRepository(
    database,
  );
  const appointmentRequestsService = new AppointmentRequestsService(
    appointmentRequestsRepository,
  );
  const clinicInformationRepository = new ClinicInformationRepository(database);
  const clinicInformationService = new ClinicInformationService(
    clinicInformationRepository,
  );

  registerAppointmentRequestsRoutes(app, appointmentRequestsService);
  registerClinicInformationRoutes(app, clinicInformationService);

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof AppointmentRequestValidationError) {
      return reply.status(400).send({
        error: {
          code: "VALIDATION_ERROR",
          message: error.message,
          details: error.details,
        },
      });
    }

    if (error instanceof ClinicInformationNotFoundError) {
      return reply.status(404).send({
        error: {
          code: "CLINIC_INFORMATION_NOT_FOUND",
          message: error.message,
          details: [],
        },
      });
    }

    if (isFastifyValidationError(error)) {
      const validationDetails = Array.isArray(error.validation)
        ? error.validation.map((issue) => `body${issue.instancePath} ${issue.message}`)
        : [];

      return reply.status(400).send({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid request data",
          details: validationDetails,
        },
      });
    }

    request.log.error({ error }, "Unhandled request error");

    return reply.status(500).send({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred",
        details: [],
      },
    });
  });

  return app;
}

function isFastifyValidationError(
  error: unknown,
): error is { validation: FastifySchemaValidationError[] } {
  return (
    typeof error === "object" &&
    error !== null &&
    "validation" in error &&
    Array.isArray(error.validation)
  );
}
