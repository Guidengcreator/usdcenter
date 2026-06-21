import type { FastifyInstance } from "fastify";

import type { ClinicInformationService } from "./clinic-information.service.js";

const clinicInformationResponseSchema = {
  type: "object",
  additionalProperties: false,
  required: ["data"],
  properties: {
    data: {
      type: "object",
      additionalProperties: false,
      required: ["clinicName", "description"],
      properties: {
        clinicName: { type: "string" },
        description: { type: "string" },
      },
    },
  },
} as const;

export function registerClinicInformationRoutes(
  app: FastifyInstance,
  clinicInformationService: ClinicInformationService,
): void {
  app.get(
    "/api/v1/clinic-information",
    {
      schema: {
        response: {
          200: clinicInformationResponseSchema,
        },
      },
    },
    async () => ({
      data: await clinicInformationService.getPublicInformation(),
    }),
  );
}
