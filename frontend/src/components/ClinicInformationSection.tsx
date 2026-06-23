import type { ClinicInformationState } from "../features/clinic/useClinicInformation.js";

interface ClinicInformationSectionProps {
  state: ClinicInformationState;
}

export function ClinicInformationSection({
  state,
}: ClinicInformationSectionProps) {
  const phoneHref =
    state.status === "ready"
      ? `tel:${state.data.phone.replace(/[^\d+]/g, "")}`
      : undefined;

  return (
    <section
      className="clinic-information"
      aria-labelledby={state.status === "ready" ? "clinic-name" : undefined}
      aria-busy={state.status === "loading"}
    >
      <div className="section-index" aria-hidden="true">
        <span>01</span>
        <span className="section-index-line" />
      </div>

      <div className="clinic-content">
        <p className="eyebrow">Про центр</p>

        {state.status === "loading" && (
          <div className="loading-state" role="status">
            <span className="loading-line loading-title" />
            <span className="loading-line" />
            <span className="loading-line loading-short" />
            <span className="visually-hidden">Завантаження інформації</span>
          </div>
        )}

        {state.status === "error" && (
          <div className="error-state" role="alert">
            <h1>Інформація тимчасово недоступна</h1>
            <p>Спробуйте оновити сторінку пізніше.</p>
          </div>
        )}

        {state.status === "ready" && (
          <div className="clinic-copy">
            <h1 id="clinic-name">{state.data.clinicName}</h1>
            <p>{state.data.description}</p>

            <dl className="clinic-contact">
              <div className="clinic-contact-item">
                <dt>Адреса</dt>
                <dd>
                  <address>{state.data.address}</address>
                </dd>
              </div>

              <div className="clinic-contact-item">
                <dt>Телефон</dt>
                <dd>
                  <a href={phoneHref}>{state.data.phone}</a>
                </dd>
              </div>

              {state.data.email && (
                <div className="clinic-contact-item">
                  <dt>Електронна пошта</dt>
                  <dd>
                    <a href={`mailto:${state.data.email}`}>{state.data.email}</a>
                  </dd>
                </div>
              )}
            </dl>
          </div>
        )}
      </div>

      <div className="visual-panel" aria-hidden="true">
        <div className="visual-orbit visual-orbit-outer" />
        <div className="visual-orbit visual-orbit-inner" />
        <div className="visual-core">
          <span />
        </div>
      </div>
    </section>
  );
}
