export interface Environment {
  adminSessionTtlSeconds: number;
  corsOrigin?: string;
  databaseUrl: string;
  host: string;
  port: number;
  trustProxy?: number;
}

export function readEnvironment(
  environment: NodeJS.ProcessEnv = process.env,
): Environment {
  const databaseUrl = environment.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required");
  }

  const port = Number(environment.PORT ?? "3000");

  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error("PORT must be an integer between 1 and 65535");
  }

  const trustProxy = parseOptionalTrustedProxyHopCount(
    environment.TRUST_PROXY_HOPS,
  );
  const adminSessionTtlSeconds = parseAdminSessionTtlSeconds(
    environment.ADMIN_SESSION_TTL_SECONDS,
  );

  return {
    adminSessionTtlSeconds,
    corsOrigin: environment.CORS_ORIGIN,
    databaseUrl,
    host: environment.HOST ?? "127.0.0.1",
    port,
    trustProxy,
  };
}

function parseAdminSessionTtlSeconds(value: string | undefined): number {
  if (value === undefined || value.trim() === "") {
    return 8 * 60 * 60;
  }

  const sessionTtlSeconds = Number(value);

  if (
    !Number.isInteger(sessionTtlSeconds) ||
    sessionTtlSeconds < 60 ||
    sessionTtlSeconds > 60 * 60 * 24 * 30
  ) {
    throw new Error(
      "ADMIN_SESSION_TTL_SECONDS must be an integer between 60 and 2592000",
    );
  }

  return sessionTtlSeconds;
}

function parseOptionalTrustedProxyHopCount(value: string | undefined): number | undefined {
  if (value === undefined || value.trim() === "") {
    return undefined;
  }

  const trustedProxyHopCount = Number(value);

  if (
    !Number.isInteger(trustedProxyHopCount) ||
    trustedProxyHopCount < 1 ||
    trustedProxyHopCount > 5
  ) {
    throw new Error("TRUST_PROXY_HOPS must be an integer between 1 and 5");
  }

  return trustedProxyHopCount;
}
