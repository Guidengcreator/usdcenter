import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { submitAppointmentRequest } from "./api/appointment-requests.js";
import { getClinicInformation } from "./api/clinic-information.js";
import { App } from "./App.js";

vi.mock("./api/appointment-requests.js", () => ({
  submitAppointmentRequest: vi.fn(),
}));

vi.mock("./api/clinic-information.js", () => ({
  getClinicInformation: vi.fn(),
}));

const submitAppointmentRequestMock = vi.mocked(submitAppointmentRequest);
const getClinicInformationMock = vi.mocked(getClinicInformation);

describe("public clinic information", () => {
  beforeEach(() => {
    submitAppointmentRequestMock.mockReset();
    getClinicInformationMock.mockReset();

    submitAppointmentRequestMock.mockResolvedValue({
      message: "Appointment request submitted successfully",
    });
  });

  afterEach(() => {
    cleanup();
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

  it("validates required appointment form fields on the client", async () => {
    getClinicInformationMock.mockResolvedValue({
      clinicName: "Test clinic",
      description: "Test ultrasound diagnostic services",
      address: "Test street 1",
      phone: "+380 44 123 45 67",
      email: "info@testclinic.example",
      workingHours: "Mon-Fri: 09:00-18:00",
    });

    render(<App />);

    await screen.findByRole("heading", { name: "Test clinic" });

    fireEvent.click(screen.getByRole("button", { name: "Надіслати запит" }));

    expect(screen.getByText("Вкажіть повне ім'я.")).toBeInTheDocument();
    expect(screen.getByText("Вкажіть номер телефону.")).toBeInTheDocument();
    expect(submitAppointmentRequestMock).not.toHaveBeenCalled();
  });

  it("validates whitespace-only appointment form fields on the client", async () => {
    getClinicInformationMock.mockResolvedValue({
      clinicName: "Test clinic",
      description: "Test ultrasound diagnostic services",
      address: "Test street 1",
      phone: "+380 44 123 45 67",
      email: "info@testclinic.example",
      workingHours: "Mon-Fri: 09:00-18:00",
    });

    render(<App />);

    await screen.findByRole("heading", { name: "Test clinic" });

    fireEvent.change(screen.getByLabelText("Повне ім'я"), {
      target: { value: "   " },
    });
    fireEvent.change(screen.getByLabelText("Телефон"), {
      target: { value: "   " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Надіслати запит" }));

    expect(screen.getByText("Вкажіть повне ім'я.")).toBeInTheDocument();
    expect(screen.getByText("Вкажіть номер телефону.")).toBeInTheDocument();
    expect(submitAppointmentRequestMock).not.toHaveBeenCalled();
  });

  it("validates the phone number format on the client", async () => {
    getClinicInformationMock.mockResolvedValue({
      clinicName: "Test clinic",
      description: "Test ultrasound diagnostic services",
      address: "Test street 1",
      phone: "+380 44 123 45 67",
      email: "info@testclinic.example",
      workingHours: "Mon-Fri: 09:00-18:00",
    });

    render(<App />);

    await screen.findByRole("heading", { name: "Test clinic" });

    fireEvent.change(screen.getByLabelText("Повне ім'я"), {
      target: { value: "Test Patient" },
    });
    fireEvent.change(screen.getByLabelText("Телефон"), {
      target: { value: "abc123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Надіслати запит" }));

    expect(
      screen.getByText("Вкажіть номер телефону у правильному форматі."),
    ).toBeInTheDocument();
    expect(submitAppointmentRequestMock).not.toHaveBeenCalled();
  });

  it.each([
    "abc123",
    "+38067123456",
    "+3806712345678",
    "096880743",
    "09688074341",
    "+1 202 555 0174",
    "380671234567",
    "+0671234567",
    "67 123 45 67",
    "+380.67.123.45.67",
    "+380/67/123/45/67",
    "+380+671234567",
    "067+1234567",
  ])(
    "shows the same phone validation error for invalid Ukrainian number %s",
    async (phone) => {
      getClinicInformationMock.mockResolvedValue({
        clinicName: "Test clinic",
        description: "Test ultrasound diagnostic services",
        address: "Test street 1",
        phone: "+380 44 123 45 67",
        email: "info@testclinic.example",
        workingHours: "Mon-Fri: 09:00-18:00",
      });

      render(<App />);

      await screen.findByRole("heading", { name: "Test clinic" });

      fireEvent.change(screen.getByLabelText("Повне ім'я"), {
        target: { value: "Test Patient" },
      });
      fireEvent.change(screen.getByLabelText("Телефон"), {
        target: { value: phone },
      });
      fireEvent.click(screen.getByRole("button", { name: "Надіслати запит" }));

      expect(
        screen.getByText("Вкажіть номер телефону у правильному форматі."),
      ).toBeInTheDocument();
      expect(submitAppointmentRequestMock).not.toHaveBeenCalled();
    },
  );

  it.each([
    "+380671234567",
    "+380 67 123 45 67",
    "+380 (67) 123-45-67",
    "0671234567",
    "067 123 45 67",
    "067 123-45-67",
    "0 (67) 123-45-67",
  ])(
    "accepts valid Ukrainian phone number %s on the client",
    async (phone) => {
      getClinicInformationMock.mockResolvedValue({
        clinicName: "Test clinic",
        description: "Test ultrasound diagnostic services",
        address: "Test street 1",
        phone: "+380 44 123 45 67",
        email: "info@testclinic.example",
        workingHours: "Mon-Fri: 09:00-18:00",
      });

      render(<App />);

      await screen.findByRole("heading", { name: "Test clinic" });

      fireEvent.change(screen.getByLabelText("Повне ім'я"), {
        target: { value: "Test Patient" },
      });
      fireEvent.change(screen.getByLabelText("Телефон"), {
        target: { value: phone },
      });
      fireEvent.click(screen.getByRole("button", { name: "Надіслати запит" }));

      expect(submitAppointmentRequestMock).toHaveBeenCalledWith({
        fullName: "Test Patient",
        phone,
        email: undefined,
        serviceType: undefined,
        comment: undefined,
      });
    },
  );

  it("submits the appointment request and shows the confirmation message", async () => {
    getClinicInformationMock.mockResolvedValue({
      clinicName: "Test clinic",
      description: "Test ultrasound diagnostic services",
      address: "Test street 1",
      phone: "+380 44 123 45 67",
      email: "info@testclinic.example",
      workingHours: "Mon-Fri: 09:00-18:00",
    });

    render(<App />);

    await screen.findByRole("heading", { name: "Test clinic" });

    fireEvent.change(screen.getByLabelText("Повне ім'я"), {
      target: { value: "Test Patient" },
    });
    fireEvent.change(screen.getByLabelText("Телефон"), {
      target: { value: "+380 44 123 45 67" },
    });
    fireEvent.change(screen.getByLabelText("Електронна пошта"), {
      target: { value: "patient@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Послуга"), {
      target: { value: "Abdominal ultrasound" },
    });
    fireEvent.change(screen.getByLabelText("Коментар"), {
      target: { value: "Please call after 14:00" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Надіслати запит" }));

    expect(submitAppointmentRequestMock).toHaveBeenCalledWith({
      fullName: "Test Patient",
      phone: "+380 44 123 45 67",
      email: "patient@example.com",
      serviceType: "Abdominal ultrasound",
      comment: "Please call after 14:00",
    });
    expect(
      await screen.findByText("Appointment request submitted successfully"),
    ).toBeInTheDocument();
  });
});
