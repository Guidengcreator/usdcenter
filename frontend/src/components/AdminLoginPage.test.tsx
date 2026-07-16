import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AdminLoginError, loginAdmin } from "../api/admin-auth.js";
import { AdminLoginPage } from "./AdminLoginPage.js";

vi.mock("../api/admin-auth.js", () => ({
  AdminLoginError: class AdminLoginError extends Error {
    public constructor(message: string) {
      super(message);
      this.name = "AdminLoginError";
    }
  },
  loginAdmin: vi.fn(),
}));

const loginAdminMock = vi.mocked(loginAdmin);

describe("admin login form", () => {
  beforeEach(() => {
    loginAdminMock.mockReset();
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
});
