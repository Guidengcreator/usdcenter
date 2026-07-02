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

const appointmentRequestRateLimitResponseSchema = {
  type: "object",
  additionalProperties: false,
  required: ["error"],
  properties: {
    error: {
      type: "object",
      additionalProperties: false,
      required: ["code", "message", "details"],
      properties: {
        code: { type: "string" },
        message: { type: "string" },
        details: {
          type: "array",
          items: { type: "string" },
        },
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
          429: appointmentRequestRateLimitResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const sourceIp = request.ip;
      const rateLimitResult = appointmentRequestsRateLimiter.consume(sourceIp);

      if (!rateLimitResult.allowed) {
        request.log.warn(
          {
            sourceIp,
            retryAfterSeconds: rateLimitResult.retryAfterSeconds,
            route: "/api/v1/appointment-requests",
          },
          "Appointment request rate limit exceeded",
        );

        return reply
          .status(429)
          .header("retry-after", String(rateLimitResult.retryAfterSeconds))
          .send({
            error: {
              code: "RATE_LIMIT_EXCEEDED",
              message: "Too many appointment requests. Please try again later.",
              details: [],
            },
          });
      }

      const body = request.body as {
        comment?: string;
        email?: string;
        fullName: string;
        phone: string;
        serviceType?: string;
      };

      await appointmentRequestsService.submitAppointmentRequest(body);

      return reply.status(201).send({
        data: {
          message: "Appointment request submitted successfully",
        },
      });
    },
  );
}
