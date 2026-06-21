import { ClinicInformationSection } from "./components/ClinicInformationSection.js";
import { useClinicInformation } from "./features/clinic/useClinicInformation.js";

export function App() {
  const clinicInformation = useClinicInformation();

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="/" aria-label="УЗД Експерт — головна">
          <span className="brand-mark" aria-hidden="true">
            УЗ
          </span>
          <span>УЗД Експерт</span>
        </a>
        <span className="header-label">Діагностичний центр</span>
      </header>

      <main>
        <ClinicInformationSection state={clinicInformation} />
      </main>
    </div>
  );
}
