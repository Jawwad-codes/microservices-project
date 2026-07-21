/** @format */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Dashboard from "../pages/Dashboard";
import { AuthProvider } from "../context/AuthContext";

vi.mock("../api/client", () => ({
  productsApi: { list: vi.fn() },
  ordersApi: { list: vi.fn() },
  checkHealth: vi.fn(),
}));

import { productsApi, ordersApi, checkHealth } from "../api/client";

const renderPage = (loggedIn = false) => {
  if (loggedIn) {
    localStorage.setItem("sf_token", "tok");
    localStorage.setItem(
      "sf_user",
      JSON.stringify({ id: "u1", name: "Alice", email: "a@b.com" }),
    );
  } else {
    localStorage.clear();
  }
  return render(
    <MemoryRouter>
      <AuthProvider>
        <Dashboard />
      </AuthProvider>
    </MemoryRouter>,
  );
};

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe("Dashboard — Unauthenticated", () => {
  it('shows "Dashboard" heading', async () => {
    productsApi.list.mockResolvedValueOnce({ data: { data: [] } });
    checkHealth.mockResolvedValueOnce({});
    renderPage(false);
    await waitFor(() => expect(screen.getByText("Dashboard")).toBeTruthy());
  });

  it("shows Get Started CTA", async () => {
    productsApi.list.mockResolvedValueOnce({ data: { data: [] } });
    checkHealth.mockResolvedValueOnce({});
    renderPage(false);
    await waitFor(() => expect(screen.getByText(/get started/i)).toBeTruthy());
  });

  it("shows sign-in prompt for orders section", async () => {
    productsApi.list.mockResolvedValueOnce({ data: { data: [] } });
    checkHealth.mockResolvedValueOnce({});
    renderPage(false);
    await waitFor(() =>
      expect(screen.getByText(/sign in to see your orders/i)).toBeTruthy(),
    );
  });
});

describe("Dashboard — Authenticated", () => {
  it("shows welcome message with user name", async () => {
    productsApi.list.mockResolvedValueOnce({ data: { data: [] } });
    ordersApi.list.mockResolvedValueOnce({ data: { data: [] } });
    checkHealth.mockResolvedValueOnce({});
    renderPage(true);
    await waitFor(() =>
      expect(screen.getByText(/welcome back, alice/i)).toBeTruthy(),
    );
  });

  it("shows product count stat", async () => {
    productsApi.list.mockResolvedValueOnce({
      data: { data: [{ id: "p1" }, { id: "p2" }] },
    });
    ordersApi.list.mockResolvedValueOnce({ data: { data: [] } });
    checkHealth.mockResolvedValueOnce({});
    renderPage(true);
    await waitFor(() => expect(screen.getByText("2")).toBeTruthy());
  });

  it("shows service health status", async () => {
    productsApi.list.mockResolvedValueOnce({ data: { data: [] } });
    ordersApi.list.mockResolvedValueOnce({ data: { data: [] } });
    checkHealth.mockResolvedValueOnce({
      "api-gateway": "up",
      "user-service": "up",
      "product-service": "down",
    });
    renderPage(true);
    await waitFor(() => expect(screen.getByText("1/3")).toBeTruthy());
  });

  it("shows recent orders when they exist", async () => {
    productsApi.list.mockResolvedValueOnce({ data: { data: [] } });
    ordersApi.list.mockResolvedValueOnce({
      data: {
        data: [
          {
            id: "ord-1",
            productId: "p1",
            quantity: 1,
            totalPrice: 500,
            status: "paid",
            createdAt: new Date().toISOString(),
          },
        ],
      },
    });
    checkHealth.mockResolvedValueOnce({});
    renderPage(true);
    await waitFor(() => expect(screen.getByText(/qty: 1/i)).toBeTruthy());
  });

  it('shows "No orders yet" when no orders', async () => {
    productsApi.list.mockResolvedValueOnce({ data: { data: [] } });
    ordersApi.list.mockResolvedValueOnce({ data: { data: [] } });
    checkHealth.mockResolvedValueOnce({});
    renderPage(true);
    await waitFor(() =>
      expect(screen.getByText(/no orders yet/i)).toBeTruthy(),
    );
  });
});
