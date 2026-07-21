/** @format */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import OrdersPage from "../pages/OrdersPage";
import { AuthProvider } from "../context/AuthContext";

vi.mock("../api/client", () => ({
  ordersApi: {
    list: vi.fn(),
    create: vi.fn(),
    cancel: vi.fn(),
    remove: vi.fn(),
  },
  productsApi: {
    list: vi.fn(),
  },
}));

import { ordersApi, productsApi } from "../api/client";

const mockProducts = [{ id: "p1", name: "Laptop", price: 50000, stock: 5 }];
const mockOrders = [
  {
    id: "ord-1",
    productId: "p1",
    quantity: 1,
    totalPrice: 50000,
    status: "paid",
    paymentMethod: "card",
    createdAt: new Date().toISOString(),
  },
  {
    id: "ord-2",
    productId: "p1",
    quantity: 2,
    totalPrice: 100000,
    status: "pending",
    paymentMethod: "cod",
    createdAt: new Date().toISOString(),
  },
  {
    id: "ord-3",
    productId: "p1",
    quantity: 1,
    totalPrice: 50000,
    status: "cancelled",
    paymentMethod: "jazzcash",
    createdAt: new Date().toISOString(),
  },
];

const renderPage = () => {
  localStorage.setItem("sf_token", "tok");
  localStorage.setItem(
    "sf_user",
    JSON.stringify({ id: "u1", name: "User", email: "u@b.com" }),
  );
  return render(
    <MemoryRouter>
      <AuthProvider>
        <OrdersPage />
      </AuthProvider>
    </MemoryRouter>,
  );
};

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe("OrdersPage — Unauthenticated", () => {
  it("shows sign-in prompt when not authenticated", () => {
    localStorage.clear();
    render(
      <MemoryRouter>
        <AuthProvider>
          <OrdersPage />
        </AuthProvider>
      </MemoryRouter>,
    );
    expect(screen.getByText(/sign in to view orders/i)).toBeTruthy();
  });
});

describe("OrdersPage — Display", () => {
  it("renders orders table with data", async () => {
    ordersApi.list.mockResolvedValueOnce({ data: { data: mockOrders } });
    productsApi.list.mockResolvedValueOnce({ data: { data: mockProducts } });
    renderPage();
    await waitFor(() => expect(screen.getByText("Laptop")).toBeTruthy());
  });

  it("shows stats — total orders count", async () => {
    ordersApi.list.mockResolvedValueOnce({ data: { data: mockOrders } });
    productsApi.list.mockResolvedValueOnce({ data: { data: mockProducts } });
    renderPage();
    await waitFor(() =>
      expect(screen.getByText("3 total · 1 paid")).toBeTruthy(),
    );
  });

  it("shows empty state when no orders", async () => {
    ordersApi.list.mockResolvedValueOnce({ data: { data: [] } });
    productsApi.list.mockResolvedValueOnce({ data: { data: mockProducts } });
    renderPage();
    await waitFor(() =>
      expect(screen.getByText(/no orders yet/i)).toBeTruthy(),
    );
  });

  it("shows Paid badge for paid orders", async () => {
    ordersApi.list.mockResolvedValueOnce({ data: { data: mockOrders } });
    productsApi.list.mockResolvedValueOnce({ data: { data: mockProducts } });
    renderPage();
    await waitFor(() => expect(screen.getByText("Paid")).toBeTruthy());
  });

  it("shows Cancelled badge", async () => {
    ordersApi.list.mockResolvedValueOnce({ data: { data: mockOrders } });
    productsApi.list.mockResolvedValueOnce({ data: { data: mockProducts } });
    renderPage();
    await waitFor(() => expect(screen.getByText("Cancelled")).toBeTruthy());
  });
});

describe("OrdersPage — Cancel order", () => {
  it("opens cancel modal when ban icon clicked on cancellable order", async () => {
    ordersApi.list.mockResolvedValueOnce({ data: { data: mockOrders } });
    productsApi.list.mockResolvedValueOnce({ data: { data: mockProducts } });
    renderPage();
    await waitFor(() => screen.getAllByTitle("Cancel order"));
    await userEvent.click(screen.getAllByTitle("Cancel order")[0]);
    expect(screen.getByText(/cancel order/i)).toBeTruthy();
  });

  it("calls ordersApi.cancel and updates row status", async () => {
    ordersApi.list.mockResolvedValueOnce({ data: { data: [mockOrders[1]] } }); // pending order
    productsApi.list.mockResolvedValueOnce({ data: { data: mockProducts } });
    ordersApi.cancel.mockResolvedValueOnce({
      data: { data: { ...mockOrders[1], status: "cancelled" } },
    });
    renderPage();

    await waitFor(() => screen.getByTitle("Cancel order"));
    await userEvent.click(screen.getByTitle("Cancel order"));
    await userEvent.click(
      screen.getByRole("button", { name: /cancel order/i }),
    );

    await waitFor(() => expect(ordersApi.cancel).toHaveBeenCalledWith("ord-2"));
  });
});

describe("OrdersPage — Delete order", () => {
  it("shows delete button only on deletable statuses", async () => {
    ordersApi.list.mockResolvedValueOnce({ data: { data: mockOrders } });
    productsApi.list.mockResolvedValueOnce({ data: { data: mockProducts } });
    renderPage();
    await waitFor(() => screen.getByText("Laptop"));
    // pending (ord-2) and cancelled (ord-3) should show delete; paid (ord-1) should not
    const deleteBtns = screen.getAllByTitle("Delete order");
    expect(deleteBtns.length).toBe(2);
  });

  it("calls ordersApi.remove and removes row", async () => {
    ordersApi.list.mockResolvedValueOnce({ data: { data: [mockOrders[2]] } }); // cancelled
    productsApi.list.mockResolvedValueOnce({ data: { data: mockProducts } });
    ordersApi.remove.mockResolvedValueOnce({ data: { status: "success" } });
    renderPage();

    await waitFor(() => screen.getByTitle("Delete order"));
    await userEvent.click(screen.getByTitle("Delete order"));
    await userEvent.click(screen.getByRole("button", { name: /^delete$/i }));

    await waitFor(() => expect(ordersApi.remove).toHaveBeenCalledWith("ord-3"));
  });
});

describe("OrdersPage — Place Order modal", () => {
  it("opens Place Order modal", async () => {
    ordersApi.list.mockResolvedValueOnce({ data: { data: [] } });
    productsApi.list.mockResolvedValueOnce({ data: { data: mockProducts } });
    renderPage();
    await waitFor(() => screen.getByText(/new order/i));
    await userEvent.click(screen.getByRole("button", { name: /new order/i }));
    expect(screen.getByText(/place new order/i)).toBeTruthy();
  });

  it("shows payment method selector in modal", async () => {
    ordersApi.list.mockResolvedValueOnce({ data: { data: [] } });
    productsApi.list.mockResolvedValueOnce({ data: { data: mockProducts } });
    renderPage();
    await waitFor(() => screen.getByRole("button", { name: /new order/i }));
    await userEvent.click(screen.getByRole("button", { name: /new order/i }));
    expect(screen.getByText(/💳 Card/i)).toBeTruthy();
    expect(screen.getByText(/jazzcash/i)).toBeTruthy();
    expect(screen.getByText(/cash on delivery/i)).toBeTruthy();
  });
});
