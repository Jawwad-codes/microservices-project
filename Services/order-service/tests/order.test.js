/** @format */

const request = require("supertest");
const jwt = require("jsonwebtoken");
const app = require("../src/app");

process.env.JWT_SECRET = "test_jwt_secret";
process.env.PRODUCT_SERVICE_URL = "http://localhost:4002";
process.env.PAYMENT_SERVICE_URL = "http://localhost:4004";
process.env.NOTIFICATION_SERVICE_URL = "http://localhost:4005";

jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    order: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  })),
}));

jest.mock("axios");
const axios = require("axios");
const { PrismaClient } = require("@prisma/client");
let prisma;

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

beforeEach(() => {
  prisma = new PrismaClient();
  jest.clearAllMocks();
});

describe("Order Service — Health", () => {
  it("GET /health returns ok", async () => {
    const res = await request(app).get("/health");
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("ok");
  });
});

describe("Order Service — Auth guard", () => {
  it("POST /orders rejects without token", async () => {
    const res = await request(app)
      .post("/orders")
      .send({ productId: "p1", quantity: 1 });
    expect(res.statusCode).toBe(401);
  });

  it("GET /orders rejects without token", async () => {
    const res = await request(app).get("/orders");
    expect(res.statusCode).toBe(401);
  });

  it("GET /orders/:id rejects without token", async () => {
    const res = await request(app).get("/orders/some-id");
    expect(res.statusCode).toBe(401);
  });

  it("PATCH /orders/:id rejects without token", async () => {
    const res = await request(app)
      .patch("/orders/some-id")
      .send({ status: "cancelled" });
    expect(res.statusCode).toBe(401);
  });

  it("DELETE /orders/:id rejects without token", async () => {
    const res = await request(app).delete("/orders/some-id");
    expect(res.statusCode).toBe(401);
  });
});

describe("Order Service — Create POST /orders", () => {
  it("creates an order successfully", async () => {
    axios.get.mockResolvedValueOnce({ data: { data: mockProduct } });
    prisma.order.create.mockResolvedValue(mockOrder);
    axios.post.mockResolvedValueOnce({ data: { status: "success", data: {} } });
    prisma.order.update.mockResolvedValue({ ...mockOrder, status: "paid" });
    axios.patch.mockResolvedValueOnce({ data: { data: {} } });
    axios.post.mockResolvedValueOnce({ data: { status: "success" } }); // notify

    const res = await request(app)
      .post("/orders")
      .set("Authorization", `Bearer ${validToken}`)
      .send({ productId: "prod-1", quantity: 2, paymentMethod: "card" });

    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe("success");
  });

  it("returns 400 for missing productId", async () => {
    const res = await request(app)
      .post("/orders")
      .set("Authorization", `Bearer ${validToken}`)
      .send({ quantity: 1 });
    expect(res.statusCode).toBe(400);
  });

  it("returns 400 for quantity = 0", async () => {
    const res = await request(app)
      .post("/orders")
      .set("Authorization", `Bearer ${validToken}`)
      .send({ productId: "prod-1", quantity: 0 });
    expect(res.statusCode).toBe(400);
  });

  it("returns 404 when product service is unavailable", async () => {
    axios.get.mockRejectedValueOnce(new Error("Connection refused"));
    prisma.order.create.mockResolvedValue(mockOrder);
    prisma.order.update.mockResolvedValue({
      ...mockOrder,
      status: "payment_failed",
    });

    const res = await request(app)
      .post("/orders")
      .set("Authorization", `Bearer ${validToken}`)
      .send({ productId: "prod-1", quantity: 2 });

    expect(res.statusCode).toBe(404);
  });

  it("returns 400 when stock is insufficient", async () => {
    axios.get.mockResolvedValueOnce({
      data: { data: { ...mockProduct, stock: 1 } },
    });
    prisma.order.create.mockResolvedValue(mockOrder);
    prisma.order.update.mockResolvedValue({
      ...mockOrder,
      status: "payment_failed",
    });

    const res = await request(app)
      .post("/orders")
      .set("Authorization", `Bearer ${validToken}`)
      .send({ productId: "prod-1", quantity: 5 });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/insufficient stock/i);
  });
});

describe("Order Service — List GET /orders", () => {
  it("returns order history for authenticated user", async () => {
    prisma.order.findMany.mockResolvedValue([mockOrder]);

    const res = await request(app)
      .get("/orders")
      .set("Authorization", `Bearer ${validToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("success");
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("returns empty array when user has no orders", async () => {
    prisma.order.findMany.mockResolvedValue([]);

    const res = await request(app)
      .get("/orders")
      .set("Authorization", `Bearer ${validToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toEqual([]);
  });
});

describe("Order Service — Get One GET /orders/:id", () => {
  it("returns a single order owned by the user", async () => {
    prisma.order.findUnique.mockResolvedValue(mockOrder);

    const res = await request(app)
      .get("/orders/order-uuid-1")
      .set("Authorization", `Bearer ${validToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.id).toBe("order-uuid-1");
  });

  it("returns 404 for non-existent order", async () => {
    prisma.order.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .get("/orders/nonexistent")
      .set("Authorization", `Bearer ${validToken}`);

    expect(res.statusCode).toBe(404);
  });

  it("returns 403 when order belongs to another user", async () => {
    prisma.order.findUnique.mockResolvedValue({
      ...mockOrder,
      userId: "other-user-id",
    });

    const res = await request(app)
      .get("/orders/order-uuid-1")
      .set("Authorization", `Bearer ${validToken}`);

    expect(res.statusCode).toBe(403);
  });
});

describe("Order Service — Cancel PATCH /orders/:id", () => {
  it("cancels a pending order", async () => {
    prisma.order.findUnique.mockResolvedValue(mockOrder); // pending
    prisma.order.update.mockResolvedValue({
      ...mockOrder,
      status: "cancelled",
    });
    axios.post.mockResolvedValueOnce({ data: {} }); // notify

    const res = await request(app)
      .patch("/orders/order-uuid-1")
      .set("Authorization", `Bearer ${validToken}`)
      .send({ status: "cancelled" });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.status).toBe("cancelled");
  });

  it("returns 400 when trying to cancel an already-cancelled order", async () => {
    prisma.order.findUnique.mockResolvedValue({
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

  it("returns 400 for invalid status value", async () => {
    const res = await request(app)
      .patch("/orders/order-uuid-1")
      .set("Authorization", `Bearer ${validToken}`)
      .send({ status: "shipped" }); // not an allowed value

    expect(res.statusCode).toBe(400);
  });
});

describe("Order Service — Delete DELETE /orders/:id", () => {
  it("deletes a cancelled order and cleans up payment", async () => {
    prisma.order.findUnique.mockResolvedValue({
      ...mockOrder,
      status: "cancelled",
    });
    axios.delete.mockResolvedValueOnce({ data: { status: "success" } });
    prisma.order.delete.mockResolvedValue(mockOrder);

    const res = await request(app)
      .delete("/orders/order-uuid-1")
      .set("Authorization", `Bearer ${validToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Order deleted");
    expect(axios.delete).toHaveBeenCalledWith(
      expect.stringContaining("/payments/order/order-uuid-1"),
    );
  });

  it("blocks deletion of a paid order", async () => {
    prisma.order.findUnique.mockResolvedValue({ ...mockOrder, status: "paid" });

    const res = await request(app)
      .delete("/orders/order-uuid-1")
      .set("Authorization", `Bearer ${validToken}`);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/cancel/i);
  });

  it("returns 404 for non-existent order", async () => {
    prisma.order.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .delete("/orders/nonexistent")
      .set("Authorization", `Bearer ${validToken}`);

    expect(res.statusCode).toBe(404);
  });
});
