/** @format */

const request = require("supertest");
const jwt = require("jsonwebtoken");

process.env.JWT_SECRET = "test_jwt_secret";
process.env.DATABASE_URL = "postgresql://fake:fake@localhost:5432/fake";
process.env.PRODUCT_SERVICE_URL = "http://localhost:4002";
process.env.PAYMENT_SERVICE_URL = "http://localhost:4004";
process.env.NOTIFICATION_SERVICE_URL = "http://localhost:4005";

jest.mock("@prisma/client", () => {
  const mOrder = {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
  const instance = { order: mOrder };
  const PrismaClient = jest.fn(() => instance);
  PrismaClient._instance = instance;
  return { PrismaClient };
});

jest.mock("axios");

const { PrismaClient } = require("@prisma/client");
const axios = require("axios");
const app = require("../src/app");
const db = PrismaClient._instance;

const validToken = jwt.sign(
  { id: "user-uuid-1", email: "user@example.com", name: "Test User" },
  "test_jwt_secret",
);

const mockProduct = { id: "prod-1", name: "Widget", price: 500, stock: 10 };
const mockOrder = {
  id: "order-uuid-1",
  userId: "user-uuid-1",
  productId: "prod-1",
  quantity: 2,
  totalPrice: 1000,
  status: "pending",
  createdAt: new Date(),
};

beforeEach(() => jest.clearAllMocks());

// ─────────────────────────────────────────────────────────────────────────────
describe("Health", () => {
  it("GET /health → 200 ok", async () => {
    const res = await request(app).get("/health");
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("ok");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("Auth guard", () => {
  it("POST /orders → 401 without token", async () => {
    const res = await request(app)
      .post("/orders")
      .send({ productId: "p1", quantity: 1 });
    expect(res.statusCode).toBe(401);
  });
  it("GET /orders → 401 without token", async () => {
    expect((await request(app).get("/orders")).statusCode).toBe(401);
  });
  it("GET /orders/:id → 401 without token", async () => {
    expect((await request(app).get("/orders/x")).statusCode).toBe(401);
  });
  it("PATCH /orders/:id → 401 without token", async () => {
    expect(
      (await request(app).patch("/orders/x").send({ status: "cancelled" }))
        .statusCode,
    ).toBe(401);
  });
  it("DELETE /orders/:id → 401 without token", async () => {
    expect((await request(app).delete("/orders/x")).statusCode).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("POST /orders", () => {
  it("201 – creates order and pays", async () => {
    axios.get.mockResolvedValue({ data: { data: mockProduct } });
    db.order.create.mockResolvedValue(mockOrder);
    db.order.update.mockResolvedValue({ ...mockOrder, status: "paid" });
    axios.post.mockResolvedValue({ data: { status: "success", data: {} } });
    axios.patch.mockResolvedValue({ data: {} });

    const res = await request(app)
      .post("/orders")
      .set("Authorization", `Bearer ${validToken}`)
      .send({ productId: "prod-1", quantity: 2, paymentMethod: "card" });

    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe("success");
  });

  it("400 – missing productId", async () => {
    const res = await request(app)
      .post("/orders")
      .set("Authorization", `Bearer ${validToken}`)
      .send({ quantity: 1 });
    expect(res.statusCode).toBe(400);
  });

  it("400 – quantity must be positive", async () => {
    const res = await request(app)
      .post("/orders")
      .set("Authorization", `Bearer ${validToken}`)
      .send({ productId: "p1", quantity: 0 });
    expect(res.statusCode).toBe(400);
  });

  it("404 – product service unavailable", async () => {
    axios.get.mockRejectedValueOnce(new Error("ECONNREFUSED"));
    db.order.create.mockResolvedValue(mockOrder);
    db.order.update.mockResolvedValue({
      ...mockOrder,
      status: "payment_failed",
    });

    const res = await request(app)
      .post("/orders")
      .set("Authorization", `Bearer ${validToken}`)
      .send({ productId: "p1", quantity: 1 });
    expect(res.statusCode).toBe(404);
  });

  it("400 – insufficient stock", async () => {
    axios.get.mockResolvedValueOnce({
      data: { data: { ...mockProduct, stock: 1 } },
    });
    db.order.create.mockResolvedValue(mockOrder);
    db.order.update.mockResolvedValue({
      ...mockOrder,
      status: "payment_failed",
    });

    const res = await request(app)
      .post("/orders")
      .set("Authorization", `Bearer ${validToken}`)
      .send({ productId: "p1", quantity: 5 });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/insufficient stock/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("GET /orders", () => {
  it("200 – returns order history", async () => {
    db.order.findMany.mockResolvedValue([mockOrder]);
    const res = await request(app)
      .get("/orders")
      .set("Authorization", `Bearer ${validToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("200 – empty array when no orders", async () => {
    db.order.findMany.mockResolvedValue([]);
    const res = await request(app)
      .get("/orders")
      .set("Authorization", `Bearer ${validToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("GET /orders/:id", () => {
  it("200 – returns own order", async () => {
    db.order.findUnique.mockResolvedValue(mockOrder);
    const res = await request(app)
      .get("/orders/order-uuid-1")
      .set("Authorization", `Bearer ${validToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.id).toBe("order-uuid-1");
  });

  it("404 – order not found", async () => {
    db.order.findUnique.mockResolvedValue(null);
    const res = await request(app)
      .get("/orders/nonexistent")
      .set("Authorization", `Bearer ${validToken}`);
    expect(res.statusCode).toBe(404);
  });

  it("403 – order belongs to another user", async () => {
    db.order.findUnique.mockResolvedValue({
      ...mockOrder,
      userId: "other-user",
    });
    const res = await request(app)
      .get("/orders/order-uuid-1")
      .set("Authorization", `Bearer ${validToken}`);
    expect(res.statusCode).toBe(403);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("PATCH /orders/:id (cancel)", () => {
  it("200 – cancels pending order", async () => {
    db.order.findUnique.mockResolvedValue(mockOrder); // status: pending
    db.order.update.mockResolvedValue({ ...mockOrder, status: "cancelled" });
    axios.post.mockResolvedValueOnce({ data: {} }); // notify

    const res = await request(app)
      .patch("/orders/order-uuid-1")
      .set("Authorization", `Bearer ${validToken}`)
      .send({ status: "cancelled" });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.status).toBe("cancelled");
  });

  it("400 – cannot cancel already cancelled order", async () => {
    db.order.findUnique.mockResolvedValue({
      ...mockOrder,
      status: "cancelled",
    });

    const res = await request(app)
      .patch("/orders/order-uuid-1")
      .set("Authorization", `Bearer ${validToken}`)
      .send({ status: "cancelled" });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/cannot be cancelled/i);
  });

  it("400 – invalid status value", async () => {
    const res = await request(app)
      .patch("/orders/order-uuid-1")
      .set("Authorization", `Bearer ${validToken}`)
      .send({ status: "shipped" });
    expect(res.statusCode).toBe(400);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("DELETE /orders/:id", () => {
  it("200 – deletes cancelled order and cleans up payment", async () => {
    db.order.findUnique.mockResolvedValue({
      ...mockOrder,
      status: "cancelled",
    });
    axios.delete.mockResolvedValueOnce({ data: { status: "success" } });
    db.order.delete.mockResolvedValue(mockOrder);

    const res = await request(app)
      .delete("/orders/order-uuid-1")
      .set("Authorization", `Bearer ${validToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Order deleted");
    expect(axios.delete).toHaveBeenCalledWith(
      expect.stringContaining("/payments/order/order-uuid-1"),
    );
  });

  it("400 – blocks deletion of paid order", async () => {
    db.order.findUnique.mockResolvedValue({ ...mockOrder, status: "paid" });

    const res = await request(app)
      .delete("/orders/order-uuid-1")
      .set("Authorization", `Bearer ${validToken}`);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/cancel/i);
  });

  it("404 – order not found", async () => {
    db.order.findUnique.mockResolvedValue(null);
    const res = await request(app)
      .delete("/orders/nonexistent")
      .set("Authorization", `Bearer ${validToken}`);
    expect(res.statusCode).toBe(404);
  });
});
