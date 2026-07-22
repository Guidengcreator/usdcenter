import { afterEach, describe, expect, it, vi } from "vitest";

import {
  AdminLoginError,
  AdminLogoutError,
  loginAdmin,
  logoutAdmin,
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

  it("logs out through the versioned backend endpoint with cookie support", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({
        data: {
          loggedOut: true,
        },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(logoutAdmin()).resolves.toEqual({
      loggedOut: true,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3000/api/v1/admin/logout",
      {
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
        method: "POST",
        signal: undefined,
      },
    );
  });

  it("maps logout failures to a user-friendly error", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: vi.fn().mockResolvedValue({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred",
          details: [],
        },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(logoutAdmin()).rejects.toEqual(
      new AdminLogoutError("Не вдалося вийти. Спробуйте ще раз."),
    );
  });
});
