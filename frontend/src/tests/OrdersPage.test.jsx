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
  productsApi: { list: vi.fn() },
}));

import { ordersApi, productsApi } from "../api/client";

const mockProducts = [{ id: "p1", name: "Laptop", price: 50000, stock: 5 }];
const paidOrder = {
  id: "ord-1",
  productId: "p1",
  quantity: 1,
  totalPrice: 50000,
  status: "paid",
  paymentMethod: "card",
  createdAt: new Date().toISOString(),
};
const pendingOrder = {
  id: "ord-2",
  productId: "p1",
  quantity: 2,
  totalPrice: 100000,
  status: "pending",
  paymentMethod: "cod",
  createdAt: new Date().toISOString(),
};
const cancelledOrder = {
  id: "ord-3",
  productId: "p1",
  quantity: 1,
  totalPrice: 50000,
  status: "cancelled",
  paymentMethod: "jazzcash",
  createdAt: new Date().toISOString(),
};
const mockOrders = [paidOrder, pendingOrder, cancelledOrder];

const loginAndRender = () => {
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
  it("shows sign-in prompt", () => {
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

describe("OrdersPage — Table", () => {
  it("renders product name in table rows", async () => {
    ordersApi.list.mockResolvedValue({ data: { data: mockOrders } });
    productsApi.list.mockResolvedValue({ data: { data: mockProducts } });
    loginAndRender();
    await waitFor(() =>
      expect(screen.getAllByText("Laptop").length).toBeGreaterThan(0),
    );
  });

  it("shows summary text with correct counts", async () => {
    ordersApi.list.mockResolvedValue({ data: { data: mockOrders } });
    productsApi.list.mockResolvedValue({ data: { data: mockProducts } });
    loginAndRender();
    await waitFor(() =>
      expect(screen.getByText("3 total · 1 paid")).toBeTruthy(),
    );
  });

  it("shows empty state when no orders", async () => {
    ordersApi.list.mockResolvedValue({ data: { data: [] } });
    productsApi.list.mockResolvedValue({ data: { data: mockProducts } });
    loginAndRender();
    await waitFor(() =>
      expect(screen.getByText(/no orders yet/i)).toBeTruthy(),
    );
  });

  it("renders Paid status badge", async () => {
    ordersApi.list.mockResolvedValue({ data: { data: [paidOrder] } });
    productsApi.list.mockResolvedValue({ data: { data: mockProducts } });
    loginAndRender();
    await waitFor(() => expect(screen.getByText("Paid")).toBeTruthy());
  });

  it("renders Cancelled status badge", async () => {
    ordersApi.list.mockResolvedValue({ data: { data: [cancelledOrder] } });
    productsApi.list.mockResolvedValue({ data: { data: mockProducts } });
    loginAndRender();
    await waitFor(() => expect(screen.getByText("Cancelled")).toBeTruthy());
  });
});

describe("OrdersPage — Cancel", () => {
  it("opens cancel modal on ban icon click", async () => {
    ordersApi.list.mockResolvedValue({ data: { data: [pendingOrder] } });
    productsApi.list.mockResolvedValue({ data: { data: mockProducts } });
    loginAndRender();
    await waitFor(() => screen.getByTitle("Cancel order"));
    await userEvent.click(screen.getByTitle("Cancel order"));
    expect(screen.getByText("Cancel Order")).toBeTruthy();
  });

  it("calls ordersApi.cancel and updates status", async () => {
    ordersApi.list.mockResolvedValue({ data: { data: [pendingOrder] } });
    productsApi.list.mockResolvedValue({ data: { data: mockProducts } });
    ordersApi.cancel.mockResolvedValueOnce({
      data: { data: { ...pendingOrder, status: "cancelled" } },
    });
    loginAndRender();
    await waitFor(() => screen.getByTitle("Cancel order"));
    await userEvent.click(screen.getByTitle("Cancel order"));
    // Find the "Cancel Order" submit button (destructive button in modal)
    const cancelBtn = screen
      .getAllByRole("button")
      .find((b) => b.textContent.includes("Cancel Order"));
    await userEvent.click(cancelBtn);
    await waitFor(() => expect(ordersApi.cancel).toHaveBeenCalledWith("ord-2"));
  });
});

describe("OrdersPage — Delete", () => {
  it("shows delete button only for non-paid orders", async () => {
    ordersApi.list.mockResolvedValue({ data: { data: mockOrders } });
    productsApi.list.mockResolvedValue({ data: { data: mockProducts } });
    loginAndRender();
    await waitFor(() => screen.getAllByText("Laptop"));
    // pending + cancelled can be deleted, paid cannot
    const deleteBtns = screen.getAllByTitle("Delete order");
    expect(deleteBtns.length).toBe(2);
  });

  it("calls ordersApi.remove and removes row", async () => {
    ordersApi.list.mockResolvedValue({ data: { data: [cancelledOrder] } });
    productsApi.list.mockResolvedValue({ data: { data: mockProducts } });
    ordersApi.remove.mockResolvedValueOnce({ data: { status: "success" } });
    loginAndRender();
    await waitFor(() => screen.getByTitle("Delete order"));
    await userEvent.click(screen.getByTitle("Delete order"));
    // Confirm delete — find the button with text "Delete" inside modal
    const confirmBtn = screen
      .getAllByRole("button")
      .find((b) => b.textContent.trim() === "Delete");
    await userEvent.click(confirmBtn);
    await waitFor(() => expect(ordersApi.remove).toHaveBeenCalledWith("ord-3"));
  });
});

describe("OrdersPage — Place Order modal", () => {
  it("opens modal on New Order click", async () => {
    ordersApi.list.mockResolvedValue({ data: { data: [] } });
    productsApi.list.mockResolvedValue({ data: { data: mockProducts } });
    loginAndRender();
    await waitFor(() => screen.getByRole("button", { name: /new order/i }));
    await userEvent.click(screen.getByRole("button", { name: /new order/i }));
    expect(screen.getByText("Place New Order")).toBeTruthy();
  });

  it("shows payment method buttons", async () => {
    ordersApi.list.mockResolvedValue({ data: { data: [] } });
    productsApi.list.mockResolvedValue({ data: { data: mockProducts } });
    loginAndRender();
    await waitFor(() => screen.getByRole("button", { name: /new order/i }));
    await userEvent.click(screen.getByRole("button", { name: /new order/i }));
    expect(screen.getByText(/💳 Card/)).toBeTruthy();
    expect(screen.getByText(/JazzCash/)).toBeTruthy();
    expect(screen.getByText(/Cash on Delivery/)).toBeTruthy();
  });
});
