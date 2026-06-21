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
    expect(getClinicInformationMock).toHaveBeenCalledOnce();
  });
});
