import cors from "@fastify/cors";
import Fastify from "fastify";

import type { Database } from "./db/database.js";
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

  const clinicInformationRepository = new ClinicInformationRepository(database);
  const clinicInformationService = new ClinicInformationService(
    clinicInformationRepository,
  );

  registerClinicInformationRoutes(app, clinicInformationService);

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof ClinicInformationNotFoundError) {
      return reply.status(404).send({
        error: {
          code: "CLINIC_INFORMATION_NOT_FOUND",
          message: error.message,
          details: [],
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
