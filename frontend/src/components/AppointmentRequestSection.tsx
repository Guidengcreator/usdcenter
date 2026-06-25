import { useState } from "react";

import {
  AppointmentRequestSubmissionError,
  submitAppointmentRequest,
} from "../api/appointment-requests.js";

interface FormValues {
  comment: string;
  email: string;
  fullName: string;
  phone: string;
  serviceType: string;
}

interface FormErrors {
  fullName?: string;
  phone?: string;
}

const initialValues: FormValues = {
  fullName: "",
  phone: "",
  email: "",
  serviceType: "",
  comment: "",
};

export function AppointmentRequestSection() {
  const [values, setValues] = useState<FormValues>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmationMessage, setConfirmationMessage] = useState<string | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validate(values);
    setErrors(nextErrors);
    setSubmitError(null);
    setConfirmationMessage(null);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await submitAppointmentRequest({
        fullName: values.fullName.trim(),
        phone: values.phone.trim(),
        email: values.email.trim() || undefined,
        serviceType: values.serviceType.trim() || undefined,
        comment: values.comment.trim() || undefined,
      });

      setValues(initialValues);
      setErrors({});
      setConfirmationMessage(result.message);
    } catch (error: unknown) {
      if (error instanceof AppointmentRequestSubmissionError) {
        setSubmitError(error.details[0] ?? error.message);
      } else {
        setSubmitError("Не вдалося надіслати запит. Спробуйте ще раз.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function updateField<Key extends keyof FormValues>(
    key: Key,
    nextValue: FormValues[Key],
  ) {
    setValues((currentValues) => ({
      ...currentValues,
      [key]: nextValue,
    }));

    if (key === "fullName" || key === "phone") {
      setErrors((currentErrors) => ({
        ...currentErrors,
        [key]: undefined,
      }));
    }
  }

  return (
    <section className="appointment-section" aria-labelledby="appointment-form-title">
      <div className="appointment-copy">
        <p className="eyebrow">Запит на запис</p>
        <h2 id="appointment-form-title">Залиште контакти, і ми передзвонимо</h2>
        <p>
          Надішліть короткий запит без реєстрації. Адміністратор зв&apos;яжеться з
          вами, щоб уточнити деталі обстеження.
        </p>
      </div>

      <form className="appointment-form" onSubmit={handleSubmit} noValidate>
        <div className="form-grid">
          <label className="form-field">
            <span>Повне ім&apos;я</span>
            <input
              name="fullName"
              autoComplete="name"
              value={values.fullName}
              onChange={(event) => updateField("fullName", event.target.value)}
              aria-invalid={errors.fullName ? "true" : "false"}
              aria-describedby={errors.fullName ? "fullName-error" : undefined}
            />
            {errors.fullName && (
              <span className="field-error" id="fullName-error">
                {errors.fullName}
              </span>
            )}
          </label>

          <label className="form-field">
            <span>Телефон</span>
            <input
              name="phone"
              type="tel"
              autoComplete="tel"
              value={values.phone}
              onChange={(event) => updateField("phone", event.target.value)}
              aria-invalid={errors.phone ? "true" : "false"}
              aria-describedby={errors.phone ? "phone-error" : undefined}
            />
            {errors.phone && (
              <span className="field-error" id="phone-error">
                {errors.phone}
              </span>
            )}
          </label>

          <label className="form-field">
            <span>Електронна пошта</span>
            <input
              name="email"
              type="email"
              autoComplete="email"
              value={values.email}
              onChange={(event) => updateField("email", event.target.value)}
            />
          </label>

          <label className="form-field">
            <span>Послуга</span>
            <input
              name="serviceType"
              value={values.serviceType}
              onChange={(event) => updateField("serviceType", event.target.value)}
            />
          </label>

          <label className="form-field form-field-wide">
            <span>Коментар</span>
            <textarea
              name="comment"
              rows={5}
              value={values.comment}
              onChange={(event) => updateField("comment", event.target.value)}
            />
          </label>
        </div>

        {submitError && (
          <p className="form-feedback form-feedback-error" role="alert">
            {submitError}
          </p>
        )}

        {confirmationMessage && (
          <p className="form-feedback form-feedback-success" role="status">
            {confirmationMessage}
          </p>
        )}

        <div className="form-actions">
          <button className="submit-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Надсилаємо..." : "Надіслати запит"}
          </button>
          <p className="form-note">Без акаунта та без попередньої оплати.</p>
        </div>
      </form>
    </section>
  );
}

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};

  if (values.fullName.trim().length === 0) {
    errors.fullName = "Вкажіть повне ім'я.";
  }

  if (values.phone.trim().length === 0) {
    errors.phone = "Вкажіть номер телефону.";
  }

  return errors;
}
