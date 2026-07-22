import { useState } from "react";

import {
  AdminLoginError,
  AdminLogoutError,
  loginAdmin,
  logoutAdmin,
  type AdminUser,
} from "../api/admin-auth.js";

interface FormValues {
  email: string;
  password: string;
}

const initialValues: FormValues = {
  email: "",
  password: "",
};

export function AdminLoginPage() {
  const [values, setValues] = useState<FormValues>(initialValues);
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [logoutMessage, setLogoutMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setAdmin(null);
    setLogoutMessage(null);
    setIsSubmitting(true);

    try {
      const result = await loginAdmin({
        email: values.email.trim(),
        password: values.password,
      });

      setAdmin(result.admin);
      setValues(initialValues);
    } catch (error: unknown) {
      if (error instanceof AdminLoginError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Не вдалося увійти. Спробуйте ще раз.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleLogout() {
    setErrorMessage(null);
    setIsLoggingOut(true);

    try {
      await logoutAdmin();
      setAdmin(null);
      setLogoutMessage("Ви вийшли з адмін-панелі.");
    } catch (error: unknown) {
      if (error instanceof AdminLogoutError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Не вдалося вийти. Спробуйте ще раз.");
      }
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <main className="admin-shell">
      <section className="admin-login" aria-labelledby="admin-login-title">
        <div className="admin-login-copy">
          <p className="eyebrow">Адміністрування</p>
          <h1 id="admin-login-title">Вхід адміністратора</h1>
        </div>

        {admin ? (
          <div className="admin-login-form" aria-live="polite">
            <p className="form-feedback form-feedback-success" role="status">
              Ви увійшли як {admin.email}.
            </p>

            {errorMessage && (
              <p className="form-feedback form-feedback-error" role="alert">
                {errorMessage}
              </p>
            )}

            <div className="form-actions">
              <button
                className="submit-button"
                type="button"
                disabled={isLoggingOut}
                onClick={handleLogout}
              >
                {isLoggingOut ? "Виходимо..." : "Вийти"}
              </button>
            </div>
          </div>
        ) : (
        <form className="admin-login-form" onSubmit={handleSubmit}>
          <label className="form-field">
            <span>Електронна пошта</span>
            <input
              name="email"
              type="email"
              autoComplete="username"
              value={values.email}
              onChange={(event) =>
                setValues((currentValues) => ({
                  ...currentValues,
                  email: event.target.value,
                }))
              }
            />
          </label>

          <label className="form-field">
            <span>Пароль</span>
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              value={values.password}
              onChange={(event) =>
                setValues((currentValues) => ({
                  ...currentValues,
                  password: event.target.value,
                }))
              }
            />
          </label>

          {errorMessage && (
            <p className="form-feedback form-feedback-error" role="alert">
              {errorMessage}
            </p>
          )}

          {logoutMessage && (
            <p className="form-feedback form-feedback-success" role="status">
              {logoutMessage}
            </p>
          )}

          <div className="form-actions">
            <button className="submit-button" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Входимо..." : "Увійти"}
            </button>
          </div>
        </form>
        )}
      </section>
    </main>
  );
}
