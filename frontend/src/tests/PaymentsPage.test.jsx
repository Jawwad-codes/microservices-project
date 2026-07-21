/** @format */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import PaymentsPage from "../pages/PaymentsPage";
import { AuthProvider } from "../context/AuthContext";

vi.mock("../api/client", () => ({
  paymentsApi: {
    list: vi.fn(),
    methods: vi.fn(),
  },
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

const renderPage = (loggedIn = true) => {
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
  it("shows sign-in prompt when not authenticated", () => {
    renderPage(false);
    expect(screen.getByText(/sign in to view payments/i)).toBeTruthy();
  });
});

describe("PaymentsPage — Display", () => {
  it("renders payments table", async () => {
    paymentsApi.list.mockResolvedValueOnce({ data: { data: mockPayments } });
    paymentsApi.methods.mockResolvedValueOnce({
      data: { data: ["card", "jazzcash", "cod"] },
    });
    renderPage();
    await waitFor(() =>
      expect(screen.getByText("2 payments recorded")).toBeTruthy(),
    );
  });

  it("shows enabled payment methods", async () => {
    paymentsApi.list.mockResolvedValueOnce({ data: { data: [] } });
    paymentsApi.methods.mockResolvedValueOnce({
      data: { data: ["card", "jazzcash", "cod"] },
    });
    renderPage();
    await waitFor(() => expect(screen.getByText(/💳 Card/i)).toBeTruthy());
    expect(screen.getByText(/📱 JazzCash/i)).toBeTruthy();
    expect(screen.getByText(/💵 COD/i)).toBeTruthy();
  });

  it("shows total collected amount", async () => {
    paymentsApi.list.mockResolvedValueOnce({ data: { data: mockPayments } });
    paymentsApi.methods.mockResolvedValueOnce({ data: { data: ["card"] } });
    renderPage();
    await waitFor(() => expect(screen.getByText("Rs 3,500")).toBeTruthy());
  });

  it("shows empty state when no payments", async () => {
    paymentsApi.list.mockResolvedValueOnce({ data: { data: [] } });
    paymentsApi.methods.mockResolvedValueOnce({ data: { data: ["card"] } });
    renderPage();
    await waitFor(() =>
      expect(screen.getByText(/no payments yet/i)).toBeTruthy(),
    );
  });

  it("displays payment method labels in table", async () => {
    paymentsApi.list.mockResolvedValueOnce({ data: { data: mockPayments } });
    paymentsApi.methods.mockResolvedValueOnce({
      data: { data: ["card", "jazzcash"] },
    });
    renderPage();
    await waitFor(() => expect(screen.getByText("💳 Card")).toBeTruthy());
    expect(screen.getByText("📱 JazzCash")).toBeTruthy();
  });

  it("shows Success status badge for successful payments", async () => {
    paymentsApi.list.mockResolvedValueOnce({ data: { data: mockPayments } });
    paymentsApi.methods.mockResolvedValueOnce({ data: { data: ["card"] } });
    renderPage();
    await waitFor(() => {
      const badges = screen.getAllByText("Success");
      expect(badges.length).toBe(2);
    });
  });
});
