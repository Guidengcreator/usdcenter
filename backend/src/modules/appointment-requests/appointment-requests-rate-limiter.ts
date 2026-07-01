const defaultWindowMs = 60_000;
const defaultMaxRequests = 3;

export class AppointmentRequestRateLimitError extends Error {
  public constructor(
    public readonly clientKey: string,
    public readonly retryAfterSeconds: number,
  ) {
    super("Too many appointment requests. Please try again later.");
    this.name = "AppointmentRequestRateLimitError";
  }
}

export class AppointmentRequestsRateLimiter {
  private readonly requestsByClient = new Map<string, number[]>();

  public constructor(
    private readonly maxRequests = defaultMaxRequests,
    private readonly windowMs = defaultWindowMs,
    private readonly now: () => number = () => Date.now(),
  ) {}

  public check(clientKey: string): void {
    const currentTime = this.now();
    const activeTimestamps = (
      this.requestsByClient.get(clientKey) ?? []
    ).filter((timestamp) => currentTime - timestamp < this.windowMs);

    if (activeTimestamps.length >= this.maxRequests) {
      const oldestTimestamp = activeTimestamps[0] ?? currentTime;
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((this.windowMs - (currentTime - oldestTimestamp)) / 1000),
      );

      this.requestsByClient.set(clientKey, activeTimestamps);

      throw new AppointmentRequestRateLimitError(clientKey, retryAfterSeconds);
    }

    activeTimestamps.push(currentTime);
    this.requestsByClient.set(clientKey, activeTimestamps);
  }
}
