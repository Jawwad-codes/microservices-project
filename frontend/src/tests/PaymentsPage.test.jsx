/** @format */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import PaymentsPage from "../pages/PaymentsPage";
import { AuthProvider } from "../context/AuthContext";

vi.mock("../api/client", () => ({
  paymentsApi: { list: vi.fn(), methods: vi.fn() },
}));

import { paymentsApi } from "../api/client";

const mockPayments = [
  {
    id: "pay-1",
    orderId: "ord-1",
    method: "card",
    amount: 1500,
    status: "success",
    createdAt: new Date().toISOString(),
  },
  {
    id: "pay-2",
    orderId: "ord-2",
    method: "jazzcash",
    amount: 2000,
    status: "success",
    createdAt: new Date().toISOString(),
  },
];

const setup = (loggedIn = true) => {
  if (loggedIn) {
    localStorage.setItem("sf_token", "tok");
    localStorage.setItem(
      "sf_user",
      JSON.stringify({ id: "u1", name: "User", email: "u@b.com" }),
    );
  } else {
    localStorage.clear();
  }
  return render(
    <MemoryRouter>
      <AuthProvider>
        <PaymentsPage />
      </AuthProvider>
    </MemoryRouter>,
  );
};

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe("PaymentsPage — Unauthenticated", () => {
  it("shows sign-in prompt", () => {
    setup(false);
    expect(screen.getByText(/sign in to view payments/i)).toBeTruthy();
  });
});

describe("PaymentsPage — Display", () => {
  it("shows payment count in header", async () => {
    paymentsApi.list.mockResolvedValue({ data: { data: mockPayments } });
    paymentsApi.methods.mockResolvedValue({
      data: { data: ["card", "jazzcash", "cod"] },
    });
    setup();
    await waitFor(() =>
      expect(screen.getByText("2 payments recorded")).toBeTruthy(),
    );
  });

  it("shows enabled payment method badges", async () => {
    paymentsApi.list.mockResolvedValue({ data: { data: [] } });
    paymentsApi.methods.mockResolvedValue({
      data: { data: ["card", "jazzcash", "cod"] },
    });
    setup();
    await waitFor(() => {
      expect(screen.getByText("💳 Card")).toBeTruthy();
      expect(screen.getByText("📱 JazzCash")).toBeTruthy();
      expect(screen.getByText("💵 COD")).toBeTruthy();
    });
  });

  it("shows total collected amount", async () => {
    paymentsApi.list.mockResolvedValue({ data: { data: mockPayments } });
    paymentsApi.methods.mockResolvedValue({ data: { data: ["card"] } });
    setup();
    await waitFor(() => expect(screen.getByText("Rs 3,500")).toBeTruthy());
  });

  it("shows empty state when no payments", async () => {
    paymentsApi.list.mockResolvedValue({ data: { data: [] } });
    paymentsApi.methods.mockResolvedValue({ data: { data: ["card"] } });
    setup();
    await waitFor(() =>
      expect(screen.getByText(/no payments yet/i)).toBeTruthy(),
    );
  });

  it("shows method labels in table rows", async () => {
    paymentsApi.list.mockResolvedValue({ data: { data: mockPayments } });
    paymentsApi.methods.mockResolvedValue({
      data: { data: ["card", "jazzcash"] },
    });
    setup();
    await waitFor(() => {
      // Table rows show the method label
      expect(screen.getAllByText("💳 Card").length).toBeGreaterThan(0);
      expect(screen.getAllByText("📱 JazzCash").length).toBeGreaterThan(0);
    });
  });

  it("shows Success badges for successful payments", async () => {
    paymentsApi.list.mockResolvedValue({ data: { data: mockPayments } });
    paymentsApi.methods.mockResolvedValue({ data: { data: ["card"] } });
    setup();
    await waitFor(() => {
      expect(screen.getAllByText("Success").length).toBe(2);
    });
  });
});
