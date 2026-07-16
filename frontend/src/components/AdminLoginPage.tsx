import { useState } from "react";

import { AdminLoginError, loginAdmin, type AdminUser } from "../api/admin-auth.js";

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
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setAdmin(null);
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

  return (
    <main className="admin-shell">
      <section className="admin-login" aria-labelledby="admin-login-title">
        <div className="admin-login-copy">
          <p className="eyebrow">Адміністрування</p>
          <h1 id="admin-login-title">Вхід адміністратора</h1>
        </div>

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

          {admin && (
            <p className="form-feedback form-feedback-success" role="status">
              Ви увійшли як {admin.email}.
            </p>
          )}

          <div className="form-actions">
            <button className="submit-button" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Входимо..." : "Увійти"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
