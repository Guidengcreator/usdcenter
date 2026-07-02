const defaultWindowMs = 15 * 60 * 1000;
const defaultMaxRequests = 5;

export interface AppointmentRequestRateLimitAllowed {
  allowed: true;
}

export interface AppointmentRequestRateLimitRejected {
  allowed: false;
  retryAfterSeconds: number;
}

export type AppointmentRequestRateLimitResult =
  | AppointmentRequestRateLimitAllowed
  | AppointmentRequestRateLimitRejected;

export interface AppointmentRequestsRateLimiter {
  consume(sourceIp: string): AppointmentRequestRateLimitResult;
}

export class InMemoryAppointmentRequestsRateLimiter
  implements AppointmentRequestsRateLimiter
{
  private readonly requestsByClient = new Map<string, number[]>();

  public constructor(
    private readonly maxRequests = defaultMaxRequests,
    private readonly windowMs = defaultWindowMs,
    private readonly now: () => number = () => Date.now(),
  ) {}

  public consume(sourceIp: string): AppointmentRequestRateLimitResult {
    const currentTime = this.now();
    const windowStart = currentTime - this.windowMs;
    const activeTimestamps = (this.requestsByClient.get(sourceIp) ?? []).filter(
      (timestamp) => timestamp > windowStart,
    );

    if (activeTimestamps.length >= this.maxRequests) {
      const oldestTimestamp = activeTimestamps[0] ?? currentTime;
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((oldestTimestamp + this.windowMs - currentTime) / 1000),
      );

      this.requestsByClient.set(sourceIp, activeTimestamps);

      return {
        allowed: false,
        retryAfterSeconds,
      };
    }

    activeTimestamps.push(currentTime);
    this.requestsByClient.set(sourceIp, activeTimestamps);

    return {
      allowed: true,
    };
  }
}
