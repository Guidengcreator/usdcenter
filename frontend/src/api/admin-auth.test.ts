import { afterEach, describe, expect, it, vi } from "vitest";

import {
  AdminLoginError,
  loginAdmin,
  readAdminSession,
} from "./admin-auth.js";

describe("admin auth API", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("submits admin credentials to the versioned login endpoint with cookie support", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({
        data: {
          admin: {
            id: 1,
            email: "admin@example.com",
          },
        },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      loginAdmin({
        email: "admin@example.com",
        password: "correct-password",
      }),
    ).resolves.toEqual({
      admin: {
        id: 1,
        email: "admin@example.com",
      },
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3000/api/v1/admin/login",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "admin@example.com",
          password: "correct-password",
        }),
        credentials: "include",
        signal: undefined,
      },
    );
  });

  it("maps invalid credentials to a user-friendly admin login error", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: vi.fn().mockResolvedValue({
        error: {
          code: "AUTHENTICATION_FAILED",
          message: "Invalid email or password",
          details: [],
        },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      loginAdmin({
        email: "admin@example.com",
        password: "wrong-secret",
      }),
    ).rejects.toEqual(
      new AdminLoginError("Невірна електронна пошта або пароль."),
    );
  });

  it("reads the protected admin session with cookie support", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({
        data: {
          admin: {
            id: 1,
            email: "admin@example.com",
          },
        },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(readAdminSession()).resolves.toEqual({
      admin: {
        id: 1,
        email: "admin@example.com",
      },
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3000/api/v1/admin/session",
      {
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
        method: "GET",
        signal: undefined,
      },
    );
  });
});
