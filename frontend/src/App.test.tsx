import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getClinicInformation } from "./api/clinic-information.js";
import { App } from "./App.js";

vi.mock("./api/clinic-information.js", () => ({
  getClinicInformation: vi.fn(),
}));

const getClinicInformationMock = vi.mocked(getClinicInformation);

describe("public clinic information", () => {
  beforeEach(() => {
    getClinicInformationMock.mockReset();
  });

  it("renders the clinic name and description returned by the backend API", async () => {
    getClinicInformationMock.mockResolvedValue({
      clinicName: "Test clinic",
      description: "Test ultrasound diagnostic services",
      address: "Test street 1",
      phone: "+380 44 123 45 67",
      email: "info@testclinic.example",
      workingHours: "Mon-Fri: 09:00-18:00",
    });

    render(<App />);

    expect(
      await screen.findByRole("heading", { name: "Test clinic" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Test clinic" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Test ultrasound diagnostic services"),
    ).toBeInTheDocument();
    expect(screen.getByText("Test street 1")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "+380 44 123 45 67" })).toHaveAttribute(
      "href",
      "tel:+380441234567",
    );
    expect(
      screen.getByRole("link", { name: "info@testclinic.example" }),
    ).toHaveAttribute("href", "mailto:info@testclinic.example");
    expect(screen.getByText("Mon-Fri: 09:00-18:00")).toBeInTheDocument();
    expect(getClinicInformationMock).toHaveBeenCalledOnce();
  });
});
