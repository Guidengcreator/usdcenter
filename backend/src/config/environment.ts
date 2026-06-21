export interface Environment {
  corsOrigin?: string;
  databaseUrl: string;
  host: string;
  port: number;
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

  return {
    corsOrigin: environment.CORS_ORIGIN,
    databaseUrl,
    host: environment.HOST ?? "127.0.0.1",
    port,
  };
}
