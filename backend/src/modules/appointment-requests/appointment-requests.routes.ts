import type { FastifyInstance } from "fastify";

import type { AppointmentRequestsRateLimiter } from "./appointment-requests-rate-limiter.js";
import type { AppointmentRequestsService } from "./appointment-requests.service.js";

const submitAppointmentRequestBodySchema = {
  type: "object",
  additionalProperties: false,
  required: ["fullName", "phone"],
  properties: {
    fullName: { type: "string" },
    phone: { type: "string" },
    email: { type: "string" },
    serviceType: { type: "string" },
    comment: { type: "string" },
  },
} as const;

const submitAppointmentRequestResponseSchema = {
  type: "object",
  additionalProperties: false,
  required: ["data"],
  properties: {
    data: {
      type: "object",
      additionalProperties: false,
      required: ["message"],
      properties: {
        message: { type: "string" },
      },
    },
  },
} as const;

export function registerAppointmentRequestsRoutes(
  app: FastifyInstance,
  appointmentRequestsService: AppointmentRequestsService,
  appointmentRequestsRateLimiter: AppointmentRequestsRateLimiter,
): void {
  app.post(
    "/api/v1/appointment-requests",
    {
      schema: {
        body: submitAppointmentRequestBodySchema,
        response: {
          201: submitAppointmentRequestResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const body = request.body as {
        comment?: string;
        email?: string;
        fullName: string;
        phone: string;
        serviceType?: string;
      };

      appointmentRequestsRateLimiter.check(request.ip);
      await appointmentRequestsService.submitAppointmentRequest(body);

      return reply.status(201).send({
        data: {
          message: "Appointment request submitted successfully",
        },
      });
    },
  );
}
