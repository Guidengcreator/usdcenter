import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  AdminLoginError,
  AdminLogoutError,
  loginAdmin,
  logoutAdmin,
} from "../api/admin-auth.js";
import { AdminLoginPage } from "./AdminLoginPage.js";

vi.mock("../api/admin-auth.js", () => ({
  AdminLoginError: class AdminLoginError extends Error {
    public constructor(message: string) {
      super(message);
      this.name = "AdminLoginError";
    }
  },
  AdminLogoutError: class AdminLogoutError extends Error {
    public constructor(message: string) {
      super(message);
      this.name = "AdminLogoutError";
    }
  },
  loginAdmin: vi.fn(),
  logoutAdmin: vi.fn(),
}));

const loginAdminMock = vi.mocked(loginAdmin);
const logoutAdminMock = vi.mocked(logoutAdmin);

describe("admin login form", () => {
  beforeEach(() => {
    loginAdminMock.mockReset();
    logoutAdminMock.mockReset();
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders email and password fields", () => {
    render(<AdminLoginPage />);

    expect(screen.getByLabelText("Електронна пошта")).toBeInTheDocument();
    expect(screen.getByLabelText("Пароль")).toBeInTheDocument();
  });

  it("allows an administrator to type email and password", () => {
    render(<AdminLoginPage />);

    fireEvent.change(screen.getByLabelText("Електронна пошта"), {
      target: { value: "admin@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Пароль"), {
      target: { value: "correct-password" },
    });

    expect(screen.getByLabelText("Електронна пошта")).toHaveValue(
      "admin@example.com",
    );
    expect(screen.getByLabelText("Пароль")).toHaveValue("correct-password");
  });

  it("submits credentials to the admin login API", async () => {
    loginAdminMock.mockResolvedValue({
      admin: {
        id: 1,
        email: "admin@example.com",
      },
    });

    render(<AdminLoginPage />);

    fireEvent.change(screen.getByLabelText("Електронна пошта"), {
      target: { value: "admin@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Пароль"), {
      target: { value: "correct-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Увійти" }));

    expect(loginAdminMock).toHaveBeenCalledWith({
      email: "admin@example.com",
      password: "correct-password",
    });
    expect(
      await screen.findByText("Ви увійшли як admin@example.com."),
    ).toBeInTheDocument();
  });

  it("shows a user-friendly error for invalid credentials", async () => {
    loginAdminMock.mockRejectedValue(
      new AdminLoginError("Невірна електронна пошта або пароль."),
    );

    render(<AdminLoginPage />);

    fireEvent.change(screen.getByLabelText("Електронна пошта"), {
      target: { value: "admin@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Пароль"), {
      target: { value: "wrong-secret" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Увійти" }));

    expect(
      await screen.findByText("Невірна електронна пошта або пароль."),
    ).toBeInTheDocument();
  });

  it("does not store a session id in browser storage after successful login", async () => {
    const localStorageSetItem = vi.spyOn(Storage.prototype, "setItem");
    loginAdminMock.mockResolvedValue({
      admin: {
        id: 1,
        email: "admin@example.com",
      },
    });

    render(<AdminLoginPage />);

    fireEvent.change(screen.getByLabelText("Електронна пошта"), {
      target: { value: "admin@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Пароль"), {
      target: { value: "correct-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Увійти" }));

    await screen.findByText("Ви увійшли як admin@example.com.");

    expect(localStorageSetItem).not.toHaveBeenCalled();
    expect(localStorage.getItem("admin_session_id")).toBeNull();
    expect(sessionStorage.getItem("admin_session_id")).toBeNull();

    localStorageSetItem.mockRestore();
  });

  it("renders a logout button in the logged-in admin view", async () => {
    loginAdminMock.mockResolvedValue({
      admin: {
        id: 1,
        email: "admin@example.com",
      },
    });

    render(<AdminLoginPage />);

    fireEvent.change(screen.getByLabelText("Електронна пошта"), {
      target: { value: "admin@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Пароль"), {
      target: { value: "correct-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Увійти" }));

    expect(
      await screen.findByRole("button", { name: "Вийти" }),
    ).toBeInTheDocument();
  });

  it("logs out and shows the logged-out state", async () => {
    loginAdminMock.mockResolvedValue({
      admin: {
        id: 1,
        email: "admin@example.com",
      },
    });
    logoutAdminMock.mockResolvedValue({
      loggedOut: true,
    });

    render(<AdminLoginPage />);

    fireEvent.change(screen.getByLabelText("Електронна пошта"), {
      target: { value: "admin@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Пароль"), {
      target: { value: "correct-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Увійти" }));
    fireEvent.click(await screen.findByRole("button", { name: "Вийти" }));

    expect(logoutAdminMock).toHaveBeenCalledOnce();
    expect(await screen.findByText("Ви вийшли з адмін-панелі.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Увійти" })).toBeInTheDocument();
  });

  it("shows a user-friendly error when logout fails", async () => {
    loginAdminMock.mockResolvedValue({
      admin: {
        id: 1,
        email: "admin@example.com",
      },
    });
    logoutAdminMock.mockRejectedValue(
      new AdminLogoutError("Не вдалося вийти. Спробуйте ще раз."),
    );

    render(<AdminLoginPage />);

    fireEvent.change(screen.getByLabelText("Електронна пошта"), {
      target: { value: "admin@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Пароль"), {
      target: { value: "correct-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Увійти" }));
    fireEvent.click(await screen.findByRole("button", { name: "Вийти" }));

    expect(
      await screen.findByText("Не вдалося вийти. Спробуйте ще раз."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Ви увійшли як admin@example.com."),
    ).toBeInTheDocument();
  });

  it("does not store or clear a session id in browser storage during logout", async () => {
    const storageSetItem = vi.spyOn(Storage.prototype, "setItem");
    const storageRemoveItem = vi.spyOn(Storage.prototype, "removeItem");
    loginAdminMock.mockResolvedValue({
      admin: {
        id: 1,
        email: "admin@example.com",
      },
    });
    logoutAdminMock.mockResolvedValue({
      loggedOut: true,
    });

    render(<AdminLoginPage />);

    fireEvent.change(screen.getByLabelText("Електронна пошта"), {
      target: { value: "admin@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Пароль"), {
      target: { value: "correct-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Увійти" }));
    fireEvent.click(await screen.findByRole("button", { name: "Вийти" }));

    await screen.findByText("Ви вийшли з адмін-панелі.");

    expect(storageSetItem).not.toHaveBeenCalled();
    expect(storageRemoveItem).not.toHaveBeenCalled();
    expect(localStorage.getItem("admin_session_id")).toBeNull();
    expect(sessionStorage.getItem("admin_session_id")).toBeNull();

    storageSetItem.mockRestore();
    storageRemoveItem.mockRestore();
  });
});
