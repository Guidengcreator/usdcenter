export interface Environment {
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

  return {
    corsOrigin: environment.CORS_ORIGIN,
    databaseUrl,
    host: environment.HOST ?? "127.0.0.1",
    port,
    trustProxy,
  };
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
