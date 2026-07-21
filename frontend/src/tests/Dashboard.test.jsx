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

const setup = (loggedIn = false) => {
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
  it("renders Dashboard heading", async () => {
    productsApi.list.mockResolvedValue({ data: { data: [] } });
    checkHealth.mockResolvedValue({});
    setup(false);
    await waitFor(() => expect(screen.getByText("Dashboard")).toBeTruthy());
  });

  it("shows Get Started CTA", async () => {
    productsApi.list.mockResolvedValue({ data: { data: [] } });
    checkHealth.mockResolvedValue({});
    setup(false);
    await waitFor(() => expect(screen.getByText(/get started/i)).toBeTruthy());
  });

  it("shows sign-in prompt inside orders card", async () => {
    productsApi.list.mockResolvedValue({ data: { data: [] } });
    checkHealth.mockResolvedValue({});
    setup(false);
    await waitFor(() =>
      expect(screen.getByText(/sign in to see your orders/i)).toBeTruthy(),
    );
  });
});

describe("Dashboard — Authenticated", () => {
  it("shows welcome message with first name", async () => {
    productsApi.list.mockResolvedValue({ data: { data: [] } });
    ordersApi.list.mockResolvedValue({ data: { data: [] } });
    checkHealth.mockResolvedValue({});
    setup(true);
    await waitFor(() =>
      expect(screen.getByText(/welcome back, alice/i)).toBeTruthy(),
    );
  });

  it("shows product count in stat card", async () => {
    productsApi.list.mockResolvedValue({
      data: { data: [{ id: "p1" }, { id: "p2" }] },
    });
    ordersApi.list.mockResolvedValue({ data: { data: [] } });
    checkHealth.mockResolvedValue({});
    setup(true);
    // "2" appears in the Total Products stat card
    await waitFor(() => {
      const nodes = screen.getAllByText("2");
      expect(nodes.length).toBeGreaterThan(0);
    });
  });

  it("shows service health fraction", async () => {
    productsApi.list.mockResolvedValue({ data: { data: [] } });
    ordersApi.list.mockResolvedValue({ data: { data: [] } });
    checkHealth.mockResolvedValue({
      "api-gateway": "up",
      "user-service": "up",
      "product-service": "down",
    });
    setup(true);
    await waitFor(() => expect(screen.getByText("2/3")).toBeTruthy());
  });

  it("shows a recent order row", async () => {
    productsApi.list.mockResolvedValue({ data: { data: [] } });
    ordersApi.list.mockResolvedValue({
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
    checkHealth.mockResolvedValue({});
    setup(true);
    await waitFor(() => expect(screen.getByText(/qty: 1/i)).toBeTruthy());
  });

  it('shows "No orders yet" when orders list is empty', async () => {
    productsApi.list.mockResolvedValue({ data: { data: [] } });
    ordersApi.list.mockResolvedValue({ data: { data: [] } });
    checkHealth.mockResolvedValue({});
    setup(true);
    await waitFor(() =>
      expect(screen.getByText(/no orders yet/i)).toBeTruthy(),
    );
  });
});
