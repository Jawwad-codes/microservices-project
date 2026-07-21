/**
 * API Client tests
 *
 * The client calls axios.create() which returns an instance.
 * All API calls go through that instance, not the top-level axios object.
 *
 * vi.mock() is hoisted, so we cannot reference variables declared outside it.
 * We build the mock instance INSIDE the factory and expose it on the constructor.
 *
 * @format
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("axios", () => {
  // Build the instance inside the factory — no out-of-scope references
  const instance = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
  };

  const axiosMock = {
    create: vi.fn(() => instance),
    get: vi.fn(), // used directly by checkHealth
    // Expose instance so tests can reference it after import
    _instance: instance,
  };

  return { default: axiosMock };
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

// The axios instance that client.js uses internally
const inst = axios._instance;

beforeEach(() => {
  vi.clearAllMocks();
  // Restore create so the module keeps using the same instance
  axios.create.mockReturnValue(inst);
});

// ── authApi ───────────────────────────────────────────────────────────────────
describe("authApi", () => {
  it("register → POST /api/auth/register", () => {
    authApi.register({ name: "T", email: "a@b.com", password: "123456" });
    expect(inst.post).toHaveBeenCalledWith(
      "/api/auth/register",
      expect.any(Object),
    );
  });

  it("login → POST /api/auth/login", () => {
    authApi.login({ email: "a@b.com", password: "123456" });
    expect(inst.post).toHaveBeenCalledWith(
      "/api/auth/login",
      expect.any(Object),
    );
  });

  it("profile → GET /api/users/:id", () => {
    authApi.profile("u1");
    expect(inst.get).toHaveBeenCalledWith("/api/users/u1");
  });
});

// ── productsApi ───────────────────────────────────────────────────────────────
describe("productsApi", () => {
  it("list → GET /api/products", () => {
    productsApi.list();
    expect(inst.get).toHaveBeenCalledWith("/api/products");
  });

  it("get → GET /api/products/:id", () => {
    productsApi.get("p1");
    expect(inst.get).toHaveBeenCalledWith("/api/products/p1");
  });

  it("create → POST /api/products", () => {
    productsApi.create({ name: "W", price: 100 });
    expect(inst.post).toHaveBeenCalledWith("/api/products", expect.any(Object));
  });

  it("update → PUT /api/products/:id", () => {
    productsApi.update("p1", { price: 200 });
    expect(inst.put).toHaveBeenCalledWith(
      "/api/products/p1",
      expect.any(Object),
    );
  });

  it("remove → DELETE /api/products/:id", () => {
    productsApi.remove("p1");
    expect(inst.delete).toHaveBeenCalledWith("/api/products/p1");
  });
});

// ── ordersApi ─────────────────────────────────────────────────────────────────
describe("ordersApi", () => {
  it("list → GET /api/orders", () => {
    ordersApi.list();
    expect(inst.get).toHaveBeenCalledWith("/api/orders");
  });

  it("create → POST /api/orders", () => {
    ordersApi.create({ productId: "p1", quantity: 2 });
    expect(inst.post).toHaveBeenCalledWith("/api/orders", expect.any(Object));
  });

  it("cancel → PATCH /api/orders/:id", () => {
    ordersApi.cancel("o1");
    expect(inst.patch).toHaveBeenCalledWith("/api/orders/o1", {
      status: "cancelled",
    });
  });

  it("remove → DELETE /api/orders/:id", () => {
    ordersApi.remove("o1");
    expect(inst.delete).toHaveBeenCalledWith("/api/orders/o1");
  });
});

// ── paymentsApi ───────────────────────────────────────────────────────────────
describe("paymentsApi", () => {
  it("list → GET /api/payments/payments", () => {
    paymentsApi.list();
    expect(inst.get).toHaveBeenCalledWith("/api/payments/payments");
  });

  it("methods → GET /api/payments/payments/methods", () => {
    paymentsApi.methods();
    expect(inst.get).toHaveBeenCalledWith("/api/payments/payments/methods");
  });

  it("getByOrder → GET /api/payments/payments/order/:id", () => {
    paymentsApi.getByOrder("o1");
    expect(inst.get).toHaveBeenCalledWith("/api/payments/payments/order/o1");
  });
});

// ── notificationsApi ──────────────────────────────────────────────────────────
describe("notificationsApi", () => {
  it("list → GET /api/notifications/notifications", () => {
    notificationsApi.list();
    expect(inst.get).toHaveBeenCalledWith("/api/notifications/notifications");
  });

  it("byEmail → correct URL", () => {
    notificationsApi.byEmail("u@b.com");
    expect(inst.get).toHaveBeenCalledWith(
      "/api/notifications/notifications/email/u@b.com",
    );
  });
});

// ── checkHealth ───────────────────────────────────────────────────────────────
describe("checkHealth", () => {
  it("returns service statuses on success", async () => {
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

  it("returns all services down when gateway unreachable", async () => {
    axios.get.mockRejectedValueOnce(new Error("ECONNREFUSED"));
    const result = await checkHealth();
    expect(result["api-gateway"]).toBe("down");
    expect(result["user-service"]).toBe("down");
    expect(result["order-service"]).toBe("down");
  });
});
