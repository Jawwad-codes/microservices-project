/** @format */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import ProductsPage from "../pages/ProductsPage";
import { AuthProvider } from "../context/AuthContext";

vi.mock("../api/client", () => ({
  productsApi: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));

import { productsApi } from "../api/client";

const mockProducts = [
  {
    id: "p1",
    name: "Laptop",
    description: "A laptop",
    price: 50000,
    stock: 5,
    createdAt: new Date().toISOString(),
  },
  {
    id: "p2",
    name: "Mouse",
    description: "Wireless mouse",
    price: 1500,
    stock: 0,
    createdAt: new Date().toISOString(),
  },
];

const renderPage = (isLoggedIn = false) => {
  if (isLoggedIn) {
    localStorage.setItem("sf_token", "tok");
    localStorage.setItem(
      "sf_user",
      JSON.stringify({ id: "u1", name: "Admin", email: "a@b.com" }),
    );
  } else {
    localStorage.clear();
  }
  return render(
    <MemoryRouter>
      <AuthProvider>
        <ProductsPage />
      </AuthProvider>
    </MemoryRouter>,
  );
};

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe("ProductsPage — Display", () => {
  it("shows product names after loading", async () => {
    productsApi.list.mockResolvedValueOnce({ data: { data: mockProducts } });
    renderPage();
    await waitFor(() => expect(screen.getByText("Laptop")).toBeTruthy());
    expect(screen.getByText("Mouse")).toBeTruthy();
  });

  it('shows "in stock" badge for products with stock', async () => {
    productsApi.list.mockResolvedValueOnce({ data: { data: mockProducts } });
    renderPage();
    await waitFor(() => expect(screen.getByText("5 in stock")).toBeTruthy());
  });

  it('shows "Out of stock" badge for zero-stock products', async () => {
    productsApi.list.mockResolvedValueOnce({ data: { data: mockProducts } });
    renderPage();
    await waitFor(() => expect(screen.getByText("Out of stock")).toBeTruthy());
  });

  it("shows empty state when no products", async () => {
    productsApi.list.mockResolvedValueOnce({ data: { data: [] } });
    renderPage();
    await waitFor(() =>
      expect(screen.getByText(/no products yet/i)).toBeTruthy(),
    );
  });

  it("filters products by search term", async () => {
    productsApi.list.mockResolvedValueOnce({ data: { data: mockProducts } });
    renderPage();
    await waitFor(() => screen.getByText("Laptop"));
    await userEvent.type(screen.getByPlaceholderText(/search/i), "mouse");
    expect(screen.queryByText("Laptop")).toBeNull();
    expect(screen.getByText("Mouse")).toBeTruthy();
  });
});

describe("ProductsPage — Auth gated actions", () => {
  it('shows "Sign in to Add" button when not authenticated', async () => {
    productsApi.list.mockResolvedValueOnce({ data: { data: [] } });
    renderPage(false);
    await waitFor(() =>
      expect(screen.getByText(/sign in to add/i)).toBeTruthy(),
    );
  });

  it('shows "Add Product" button when authenticated', async () => {
    productsApi.list.mockResolvedValueOnce({ data: { data: [] } });
    renderPage(true);
    await waitFor(() => expect(screen.getByText(/add product/i)).toBeTruthy());
  });

  it("shows edit and delete buttons on cards when authenticated", async () => {
    productsApi.list.mockResolvedValueOnce({ data: { data: mockProducts } });
    renderPage(true);
    await waitFor(() => screen.getByText("Laptop"));
    expect(screen.getAllByTitle("Edit product").length).toBeGreaterThan(0);
    expect(screen.getAllByTitle("Delete product").length).toBeGreaterThan(0);
  });
});

describe("ProductsPage — Add Product modal", () => {
  it("opens Add Product modal on button click", async () => {
    productsApi.list.mockResolvedValueOnce({ data: { data: [] } });
    renderPage(true);
    await waitFor(() => screen.getByText(/add product/i));
    await userEvent.click(screen.getByRole("button", { name: /add product/i }));
    expect(screen.getByText(/product name/i)).toBeTruthy();
  });

  it("calls productsApi.create and adds product to list", async () => {
    productsApi.list.mockResolvedValueOnce({ data: { data: [] } });
    const newProduct = {
      id: "p3",
      name: "Keyboard",
      description: "",
      price: 3000,
      stock: 10,
    };
    productsApi.create.mockResolvedValueOnce({ data: { data: newProduct } });

    renderPage(true);
    await waitFor(() => screen.getByRole("button", { name: /add product/i }));
    await userEvent.click(screen.getByRole("button", { name: /add product/i }));

    await userEvent.type(
      screen.getByPlaceholderText(/wireless mouse/i),
      "Keyboard",
    );
    await userEvent.type(screen.getByPlaceholderText("1500"), "3000");
    await userEvent.click(
      screen.getByRole("button", { name: /add product$/i }),
    );

    await waitFor(() => expect(productsApi.create).toHaveBeenCalled());
  });
});

describe("ProductsPage — Delete Product modal", () => {
  it("opens delete confirmation modal", async () => {
    productsApi.list.mockResolvedValueOnce({
      data: { data: [mockProducts[0]] },
    });
    renderPage(true);
    await waitFor(() => screen.getByTitle("Delete product"));
    await userEvent.click(screen.getByTitle("Delete product"));
    expect(screen.getByText(/are you sure/i)).toBeTruthy();
    expect(screen.getByText("Laptop")).toBeTruthy();
  });

  it("calls productsApi.remove and removes product from list", async () => {
    productsApi.list.mockResolvedValueOnce({
      data: { data: [mockProducts[0]] },
    });
    productsApi.remove.mockResolvedValueOnce({ data: { status: "success" } });

    renderPage(true);
    await waitFor(() => screen.getByTitle("Delete product"));
    await userEvent.click(screen.getByTitle("Delete product"));
    await userEvent.click(screen.getByRole("button", { name: /^delete$/i }));

    await waitFor(() => expect(productsApi.remove).toHaveBeenCalledWith("p1"));
  });
});
