import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import Fastify from "fastify";
import type { FastifyServerOptions } from "fastify";
import type { FastifySchemaValidationError } from "fastify/types/schema.js";

import type { Database } from "./db/database.js";
import { AppointmentRequestsRepository } from "./modules/appointment-requests/appointment-requests.repository.js";
import {
  type AppointmentRequestRateLimitOptions,
  registerAppointmentRequestsRoutes,
} from "./modules/appointment-requests/appointment-requests.routes.js";
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
  appointmentRequestRateLimit?: AppointmentRequestRateLimitOptions;
  corsOrigin?: string;
  database: Database;
  logger?: FastifyServerOptions["logger"];
  trustProxy?: FastifyServerOptions["trustProxy"];
}

const defaultAppointmentRequestRateLimit = {
  max: 5,
  timeWindowMilliseconds: 15 * 60 * 1000,
} as const satisfies AppointmentRequestRateLimitOptions;

export function buildApp({
  appointmentRequestRateLimit = defaultAppointmentRequestRateLimit,
  corsOrigin,
  database,
  logger = false,
  trustProxy,
}: BuildAppDependencies) {
  const app = Fastify({ logger, trustProxy });

  if (corsOrigin) {
    void app.register(cors, { origin: corsOrigin });
  }

  void app.register(rateLimit, { global: false });

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

  void app.register(async (routesApp) => {
    registerAppointmentRequestsRoutes(
      routesApp,
      appointmentRequestsService,
      appointmentRequestRateLimit,
    );
    registerClinicInformationRoutes(routesApp, clinicInformationService);
  });

  app.setErrorHandler((error, request, reply) => {
    if (isRateLimitErrorResponse(error)) {
      return reply.status(429).send({
        error: error.error,
      });
    }

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

function isRateLimitErrorResponse(
  error: unknown,
): error is {
  error: {
    code: "RATE_LIMIT_EXCEEDED";
    details: [];
    message: string;
  };
  statusCode: 429;
} {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const response = error as {
    error?: unknown;
    statusCode?: unknown;
  };

  if (response.statusCode !== 429) {
    return false;
  }

  const responseError = response.error;

  return (
    typeof responseError === "object" &&
    responseError !== null &&
    "code" in responseError &&
    responseError.code === "RATE_LIMIT_EXCEEDED"
  );
}
