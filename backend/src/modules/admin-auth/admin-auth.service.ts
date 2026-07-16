import { randomBytes } from "node:crypto";

import type {
  AdminAuthRepository,
  SafeAdmin,
} from "./admin-auth.repository.js";
import { hashPassword, verifyPassword } from "./password-hashing.js";
import type { AdminSessionsRepository } from "../admin-sessions/admin-sessions.repository.js";

export interface AdminSessionOptions {
  sessionTtlSeconds: number;
}

export interface AdminLoginResult {
  admin: SafeAdmin;
  expiresAt: Date;
  sessionId: string;
}

export class AdminAuthenticationError extends Error {
  public constructor() {
    super("Invalid email or password");
    this.name = "AdminAuthenticationError";
  }
}

export class AdminAuthService {
  public constructor(
    private readonly adminAuthRepository: AdminAuthRepository,
    private readonly adminSessionsRepository: AdminSessionsRepository,
    private readonly sessionOptions: AdminSessionOptions,
  ) {}

  public async login(values: {
    email: string;
    password: string;
  }): Promise<AdminLoginResult> {
    const email = normalizeAdminEmail(values.email);
    const adminUser = await this.adminAuthRepository.findByEmail(email);

    if (!adminUser) {
      throw new AdminAuthenticationError();
    }

    const isValidPassword = await verifyPassword(
      values.password,
      adminUser.passwordHash,
    );

    if (!isValidPassword) {
      throw new AdminAuthenticationError();
    }

    const sessionId = createSessionId();
    const expiresAt = new Date(
      Date.now() + this.sessionOptions.sessionTtlSeconds * 1000,
    );

    await this.adminSessionsRepository.create({
      adminUserId: adminUser.id,
      expiresAt,
      id: sessionId,
    });

    return {
      admin: {
        email: adminUser.email,
        id: adminUser.id,
      },
      expiresAt,
      sessionId,
    };
  }

  public async getAdminBySessionId(sessionId: string): Promise<SafeAdmin> {
    if (!isSessionIdFormatValid(sessionId)) {
      throw new AdminAuthenticationError();
    }

    const admin = await this.adminSessionsRepository.findAdminByValidSessionId(
      sessionId,
      new Date(),
    );

    if (!admin) {
      throw new AdminAuthenticationError();
    }

    return admin;
  }

  public async createOrUpdateAdminUser(values: {
    email: string;
    password: string;
  }): Promise<SafeAdmin> {
    const email = normalizeAdminEmail(values.email);
    const passwordHash = await hashPassword(values.password);

    return this.adminAuthRepository.upsertAdminUser({
      email,
      passwordHash,
    });
  }
}

export function normalizeAdminEmail(email: string): string {
  return email.trim().toLowerCase();
}

function createSessionId(): string {
  return randomBytes(32).toString("hex");
}

function isSessionIdFormatValid(sessionId: string): boolean {
  return /^[a-f0-9]{64}$/.test(sessionId);
}
