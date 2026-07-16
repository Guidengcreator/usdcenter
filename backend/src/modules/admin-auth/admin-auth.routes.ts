import type { FastifyInstance } from "fastify";

import {
  AdminAuthenticationError,
  type AdminAuthService,
} from "./admin-auth.service.js";

export interface AdminCookieOptions {
  secure: boolean;
  sessionTtlSeconds: number;
}

export class AdminLoginValidationError extends Error {
  public constructor(public readonly details: string[]) {
    super("Invalid request data");
    this.name = "AdminLoginValidationError";
  }
}

const adminLoginBodySchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    email: { type: "string" },
    password: { type: "string" },
  },
} as const;

const adminResponseSchema = {
  type: "object",
  additionalProperties: false,
  required: ["data"],
  properties: {
    data: {
      type: "object",
      additionalProperties: false,
      required: ["admin"],
      properties: {
        admin: {
          type: "object",
          additionalProperties: false,
          required: ["id", "email"],
          properties: {
            id: { type: "number" },
            email: { type: "string" },
          },
        },
      },
    },
  },
} as const;

export function registerAdminAuthRoutes(
  app: FastifyInstance,
  adminAuthService: AdminAuthService,
  cookieOptions: AdminCookieOptions,
): void {
  app.post(
    "/api/v1/admin/login",
    {
      schema: {
        body: adminLoginBodySchema,
        response: {
          200: adminResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const body = request.body as {
        email?: string;
        password?: string;
      };

      validateLoginBody(body);

      const result = await adminAuthService.login({
        email: body.email ?? "",
        password: body.password ?? "",
      });

      reply.header(
        "Set-Cookie",
        serializeAdminSessionCookie(result.sessionId, cookieOptions),
      );

      return reply.status(200).send({
        data: {
          admin: result.admin,
        },
      });
    },
  );

  app.get(
    "/api/v1/admin/session",
    {
      schema: {
        response: {
          200: adminResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const sessionId = parseCookieHeader(
        request.headers.cookie,
      ).admin_session_id;

      if (!sessionId) {
        throw new AdminAuthenticationError();
      }

      const admin = await adminAuthService.getAdminBySessionId(sessionId);

      return reply.status(200).send({
        data: {
          admin,
        },
      });
    },
  );
}

function validateLoginBody(body: { email?: string; password?: string }): void {
  const details: string[] = [];

  if (!body.email || body.email.trim().length === 0) {
    details.push("body/email must NOT have fewer than 1 characters");
  } else if (!isValidEmail(body.email.trim())) {
    details.push('body/email must match format "email"');
  }

  if (!body.password || body.password.trim().length === 0) {
    details.push("body/password must NOT have fewer than 1 characters");
  }

  if (details.length > 0) {
    throw new AdminLoginValidationError(details);
  }
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function serializeAdminSessionCookie(
  sessionId: string,
  options: AdminCookieOptions,
): string {
  const segments = [
    `admin_session_id=${sessionId}`,
    "HttpOnly",
    "SameSite=Lax",
    "Path=/api/v1/admin",
    `Max-Age=${options.sessionTtlSeconds}`,
  ];

  if (options.secure) {
    segments.push("Secure");
  }

  return segments.join("; ");
}

function parseCookieHeader(cookieHeader: string | undefined): Record<string, string> {
  if (!cookieHeader) {
    return {};
  }

  return Object.fromEntries(
    cookieHeader.split(";").flatMap((cookie) => {
      const [name, ...valueParts] = cookie.trim().split("=");

      if (!name || valueParts.length === 0) {
        return [];
      }

      return [[name, valueParts.join("=")]];
    }),
  );
}
