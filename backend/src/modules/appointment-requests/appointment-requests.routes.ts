import type { FastifyInstance } from "fastify";

import type { AppointmentRequestsService } from "./appointment-requests.service.js";

export interface AppointmentRequestRateLimitOptions {
  max: number;
  timeWindowMilliseconds: number;
}

const submitAppointmentRequestBodySchema = {
  type: "object",
  additionalProperties: false,
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

const rateLimitExceededResponseSchema = {
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
  rateLimitOptions: AppointmentRequestRateLimitOptions,
): void {
  app.post(
    "/api/v1/appointment-requests",
    {
      config: {
        rateLimit: {
          max: rateLimitOptions.max,
          timeWindow: rateLimitOptions.timeWindowMilliseconds,
          keyGenerator: (request) => request.ip,
          errorResponseBuilder: (request, context) => {
            const retryAfterSeconds = Math.ceil(context.ttl / 1000);

            request.log.warn(
              {
                event: "appointment_request_rate_limited",
                requestId: request.id,
                method: request.method,
                route: request.routeOptions.url,
                sourceIp: request.ip,
                retryAfterSeconds,
                configuredMax: context.max,
                configuredTimeWindowSeconds: Math.ceil(
                  rateLimitOptions.timeWindowMilliseconds / 1000,
                ),
              },
              "Appointment request rate limited",
            );

            return {
              statusCode: 429,
              error: {
                code: "RATE_LIMIT_EXCEEDED",
                message:
                  "Too many appointment request attempts. Please try again later.",
                details: [],
              },
            };
          },
        },
      },
      schema: {
        body: submitAppointmentRequestBodySchema,
        response: {
          201: submitAppointmentRequestResponseSchema,
          429: rateLimitExceededResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const body = request.body as {
        comment?: string;
        email?: string;
        fullName?: string;
        phone?: string;
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
