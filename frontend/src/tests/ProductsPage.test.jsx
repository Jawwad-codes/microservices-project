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
    description: "Wireless",
    price: 1500,
    stock: 0,
    createdAt: new Date().toISOString(),
  },
];

const setup = (loggedIn = false) => {
  if (loggedIn) {
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
  it("shows product names", async () => {
    productsApi.list.mockResolvedValue({ data: { data: mockProducts } });
    setup();
    await waitFor(() => expect(screen.getByText("Laptop")).toBeTruthy());
    expect(screen.getByText("Mouse")).toBeTruthy();
  });

  it("shows stock badge", async () => {
    productsApi.list.mockResolvedValue({ data: { data: mockProducts } });
    setup();
    await waitFor(() => expect(screen.getByText("5 in stock")).toBeTruthy());
    expect(screen.getByText("Out of stock")).toBeTruthy();
  });

  it("shows empty state when no products", async () => {
    productsApi.list.mockResolvedValue({ data: { data: [] } });
    setup();
    await waitFor(() =>
      expect(screen.getByText(/no products yet/i)).toBeTruthy(),
    );
  });

  it("filters by search term", async () => {
    productsApi.list.mockResolvedValue({ data: { data: mockProducts } });
    setup();
    await waitFor(() => screen.getByText("Laptop"));
    await userEvent.type(screen.getByPlaceholderText(/search/i), "mouse");
    expect(screen.queryByText("Laptop")).toBeNull();
    expect(screen.getByText("Mouse")).toBeTruthy();
  });
});

describe("ProductsPage — Auth", () => {
  it("shows Sign in button when not authenticated", async () => {
    productsApi.list.mockResolvedValue({ data: { data: [] } });
    setup(false);
    await waitFor(() =>
      expect(screen.getByText(/sign in to add/i)).toBeTruthy(),
    );
  });

  it("shows Add Product button when authenticated", async () => {
    productsApi.list.mockResolvedValue({ data: { data: [] } });
    setup(true);
    await waitFor(() => {
      // Button with text "Add Product" exists
      expect(screen.getByRole("button", { name: /add product/i })).toBeTruthy();
    });
  });

  it("shows edit and delete icon buttons when authenticated", async () => {
    productsApi.list.mockResolvedValue({ data: { data: mockProducts } });
    setup(true);
    await waitFor(() => screen.getByText("Laptop"));
    expect(screen.getAllByTitle("Edit product").length).toBeGreaterThan(0);
    expect(screen.getAllByTitle("Delete product").length).toBeGreaterThan(0);
  });
});

describe("ProductsPage — Add modal", () => {
  it("opens modal when Add Product clicked", async () => {
    productsApi.list.mockResolvedValue({ data: { data: [] } });
    setup(true);
    await waitFor(() => screen.getByRole("button", { name: /add product/i }));
    await userEvent.click(screen.getByRole("button", { name: /add product/i }));
    expect(screen.getByText("Add New Product")).toBeTruthy();
  });

  it("calls productsApi.create on submit", async () => {
    productsApi.list.mockResolvedValue({ data: { data: [] } });
    productsApi.create.mockResolvedValueOnce({
      data: { data: { id: "p3", name: "Keyboard", price: 3000, stock: 10 } },
    });
    setup(true);
    await waitFor(() => screen.getByRole("button", { name: /add product/i }));
    await userEvent.click(screen.getByRole("button", { name: /add product/i }));

    await userEvent.type(
      screen.getByPlaceholderText(/e\.g\. Wireless Mouse/i),
      "Keyboard",
    );
    await userEvent.type(screen.getByPlaceholderText("1500"), "3000");
    // Click the submit button inside the modal
    const submitBtn = screen.getByRole("button", { name: /^add product$/i });
    await userEvent.click(submitBtn);

    await waitFor(() => expect(productsApi.create).toHaveBeenCalled());
  });
});

describe("ProductsPage — Delete modal", () => {
  it("opens delete confirm modal", async () => {
    productsApi.list.mockResolvedValue({ data: { data: [mockProducts[0]] } });
    setup(true);
    await waitFor(() => screen.getByTitle("Delete product"));
    await userEvent.click(screen.getByTitle("Delete product"));
    expect(screen.getByText(/are you sure/i)).toBeTruthy();
  });

  it("calls productsApi.remove on confirm", async () => {
    productsApi.list.mockResolvedValue({ data: { data: [mockProducts[0]] } });
    productsApi.remove.mockResolvedValueOnce({ data: { status: "success" } });
    setup(true);
    await waitFor(() => screen.getByTitle("Delete product"));
    await userEvent.click(screen.getByTitle("Delete product"));
    // Find the delete button inside the modal (exact text "Delete")
    const confirmBtn = screen
      .getAllByRole("button")
      .find((b) => b.textContent.trim() === "Delete");
    await userEvent.click(confirmBtn);
    await waitFor(() => expect(productsApi.remove).toHaveBeenCalledWith("p1"));
  });
});
