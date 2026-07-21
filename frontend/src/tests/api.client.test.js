/** @format */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock axios before importing client
vi.mock("axios", () => {
  const mockAxios = {
    create: vi.fn(() => mockAxios),
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
    defaults: { headers: { common: {} } },
  };
  return { default: mockAxios };
});

import axios from "axios";
import {
  authApi,
  productsApi,
  ordersApi,
  paymentsApi,
  notificationsApi,
  checkHealth,
} from "../api/client";

beforeEach(() => vi.clearAllMocks());

describe("API Client — authApi", () => {
  it("authApi.register calls POST /api/auth/register", () => {
    authApi.register({ name: "Test", email: "a@b.com", password: "123456" });
    expect(axios.post).toHaveBeenCalledWith(
      "/api/auth/register",
      expect.any(Object),
    );
  });

  it("authApi.login calls POST /api/auth/login", () => {
    authApi.login({ email: "a@b.com", password: "123456" });
    expect(axios.post).toHaveBeenCalledWith(
      "/api/auth/login",
      expect.any(Object),
    );
  });

  it("authApi.profile calls GET /api/users/:id", () => {
    authApi.profile("user-1");
    expect(axios.get).toHaveBeenCalledWith("/api/users/user-1");
  });
});

describe("API Client — productsApi", () => {
  it("productsApi.list calls GET /api/products", () => {
    productsApi.list();
    expect(axios.get).toHaveBeenCalledWith("/api/products");
  });

  it("productsApi.get calls GET /api/products/:id", () => {
    productsApi.get("prod-1");
    expect(axios.get).toHaveBeenCalledWith("/api/products/prod-1");
  });

  it("productsApi.create calls POST /api/products", () => {
    productsApi.create({ name: "Widget", price: 100 });
    expect(axios.post).toHaveBeenCalledWith(
      "/api/products",
      expect.any(Object),
    );
  });

  it("productsApi.update calls PUT /api/products/:id", () => {
    productsApi.update("prod-1", { price: 200 });
    expect(axios.put).toHaveBeenCalledWith(
      "/api/products/prod-1",
      expect.any(Object),
    );
  });

  it("productsApi.remove calls DELETE /api/products/:id", () => {
    productsApi.remove("prod-1");
    expect(axios.delete).toHaveBeenCalledWith("/api/products/prod-1");
  });
});

describe("API Client — ordersApi", () => {
  it("ordersApi.list calls GET /api/orders", () => {
    ordersApi.list();
    expect(axios.get).toHaveBeenCalledWith("/api/orders");
  });

  it("ordersApi.create calls POST /api/orders", () => {
    ordersApi.create({ productId: "p1", quantity: 2 });
    expect(axios.post).toHaveBeenCalledWith("/api/orders", expect.any(Object));
  });

  it("ordersApi.cancel calls PATCH /api/orders/:id with cancelled status", () => {
    ordersApi.cancel("order-1");
    expect(axios.patch).toHaveBeenCalledWith("/api/orders/order-1", {
      status: "cancelled",
    });
  });

  it("ordersApi.remove calls DELETE /api/orders/:id", () => {
    ordersApi.remove("order-1");
    expect(axios.delete).toHaveBeenCalledWith("/api/orders/order-1");
  });
});

describe("API Client — paymentsApi", () => {
  it("paymentsApi.list calls GET /api/payments/payments", () => {
    paymentsApi.list();
    expect(axios.get).toHaveBeenCalledWith("/api/payments/payments");
  });

  it("paymentsApi.methods calls GET /api/payments/payments/methods", () => {
    paymentsApi.methods();
    expect(axios.get).toHaveBeenCalledWith("/api/payments/payments/methods");
  });

  it("paymentsApi.getByOrder calls GET /api/payments/payments/order/:id", () => {
    paymentsApi.getByOrder("order-1");
    expect(axios.get).toHaveBeenCalledWith(
      "/api/payments/payments/order/order-1",
    );
  });
});

describe("API Client — notificationsApi", () => {
  it("notificationsApi.list calls GET /api/notifications/notifications", () => {
    notificationsApi.list();
    expect(axios.get).toHaveBeenCalledWith("/api/notifications/notifications");
  });

  it("notificationsApi.byEmail calls correct endpoint", () => {
    notificationsApi.byEmail("user@example.com");
    expect(axios.get).toHaveBeenCalledWith(
      "/api/notifications/notifications/email/user@example.com",
    );
  });
});

describe("API Client — checkHealth", () => {
  it("returns service statuses from /health/all", async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        status: "ok",
        services: { "user-service": "up", "product-service": "up" },
      },
    });

    const result = await checkHealth();
    expect(result["api-gateway"]).toBe("up");
    expect(result["user-service"]).toBe("up");
  });

  it("returns all services as down when gateway is unreachable", async () => {
    axios.get.mockRejectedValueOnce(new Error("Network Error"));

    const result = await checkHealth();
    expect(result["api-gateway"]).toBe("down");
    expect(result["user-service"]).toBe("down");
    expect(result["order-service"]).toBe("down");
  });
});
