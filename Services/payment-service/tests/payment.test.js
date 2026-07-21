/** @format */

const request = require("supertest");

process.env.ENABLE_CARD = "true";
process.env.ENABLE_JAZZCASH = "true";
process.env.ENABLE_COD = "true";
process.env.DATABASE_URL = "postgresql://fake:fake@localhost:5432/fake";

jest.mock("@prisma/client", () => {
  const mPayment = {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    delete: jest.fn(),
  };
  const instance = { payment: mPayment };
  const PrismaClient = jest.fn(() => instance);
  PrismaClient._instance = instance;
  return { PrismaClient };
});

const { PrismaClient } = require("@prisma/client");
const app = require("../src/app");
const db = PrismaClient._instance;

const mockPayment = {
  id: "pay-uuid-1",
  orderId: "order-uuid-1",
  amount: 1500,
  method: "card",
  status: "success",
  createdAt: new Date(),
};

beforeEach(() => jest.clearAllMocks());

// ─────────────────────────────────────────────────────────────────────────────
describe("Health", () => {
  it("GET /health → 200 ok", async () => {
    const res = await request(app).get("/health");
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.service).toBe("payment-service");
  });
});

describe("GET /payments/methods", () => {
  it("200 – returns enabled methods", async () => {
    const res = await request(app).get("/payments/methods");
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toContain("card");
    expect(res.body.data).toContain("jazzcash");
    expect(res.body.data).toContain("cod");
  });
});

describe("POST /pay", () => {
  it("200 – processes card payment", async () => {
    db.payment.findUnique.mockResolvedValue(null);
    db.payment.create.mockResolvedValue(mockPayment);

    const res = await request(app)
      .post("/pay")
      .send({ orderId: "order-uuid-1", amount: 1500, method: "card" });

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("success");
    expect(res.body.data.method).toBe("card");
  });

  it("200 – processes jazzcash payment", async () => {
    db.payment.findUnique.mockResolvedValue(null);
    db.payment.create.mockResolvedValue({ ...mockPayment, method: "jazzcash" });

    const res = await request(app)
      .post("/pay")
      .send({ orderId: "order-uuid-2", amount: 2000, method: "jazzcash" });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.method).toBe("jazzcash");
  });

  it("200 – processes cod payment", async () => {
    db.payment.findUnique.mockResolvedValue(null);
    db.payment.create.mockResolvedValue({ ...mockPayment, method: "cod" });

    const res = await request(app)
      .post("/pay")
      .send({ orderId: "order-uuid-3", amount: 500, method: "cod" });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.method).toBe("cod");
  });

  it("200 – idempotent: returns existing payment for duplicate orderId", async () => {
    db.payment.findUnique.mockResolvedValue(mockPayment);

    const res = await request(app)
      .post("/pay")
      .send({ orderId: "order-uuid-1", amount: 1500 });

    expect(res.statusCode).toBe(200);
    expect(db.payment.create).not.toHaveBeenCalled();
  });

  it("400 – missing orderId", async () => {
    const res = await request(app).post("/pay").send({ amount: 500 });
    expect(res.statusCode).toBe(400);
  });

  it("400 – missing amount", async () => {
    const res = await request(app)
      .post("/pay")
      .send({ orderId: "order-uuid-1" });
    expect(res.statusCode).toBe(400);
  });

  it("400 – zero amount", async () => {
    db.payment.findUnique.mockResolvedValue(null);
    const res = await request(app)
      .post("/pay")
      .send({ orderId: "order-uuid-1", amount: 0 });
    expect(res.statusCode).toBe(400);
  });

  it("400 – unsupported payment method", async () => {
    const res = await request(app)
      .post("/pay")
      .send({ orderId: "order-uuid-1", amount: 500, method: "bitcoin" });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/not supported/i);
  });
});

describe("GET /payments", () => {
  it("200 – returns all payments", async () => {
    db.payment.findMany.mockResolvedValue([mockPayment]);
    const res = await request(app).get("/payments");
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data[0].orderId).toBe("order-uuid-1");
  });

  it("200 – empty array", async () => {
    db.payment.findMany.mockResolvedValue([]);
    const res = await request(app).get("/payments");
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toEqual([]);
  });
});

describe("GET /payments/order/:orderId", () => {
  it("200 – returns payment by order", async () => {
    db.payment.findUnique.mockResolvedValue(mockPayment);
    const res = await request(app).get("/payments/order/order-uuid-1");
    expect(res.statusCode).toBe(200);
    expect(res.body.data.orderId).toBe("order-uuid-1");
  });

  it("404 – payment not found", async () => {
    db.payment.findUnique.mockResolvedValue(null);
    const res = await request(app).get("/payments/order/nonexistent");
    expect(res.statusCode).toBe(404);
  });
});

describe("DELETE /payments/order/:orderId", () => {
  it("200 – deletes payment record", async () => {
    db.payment.findUnique.mockResolvedValue(mockPayment);
    db.payment.delete.mockResolvedValue(mockPayment);

    const res = await request(app).delete("/payments/order/order-uuid-1");
    expect(res.statusCode).toBe(200);
    expect(res.body.data.orderId).toBe("order-uuid-1");
  });

  it("200 – idempotent when no payment exists", async () => {
    db.payment.findUnique.mockResolvedValue(null);
    const res = await request(app).delete("/payments/order/nonexistent");
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toBeNull();
    expect(db.payment.delete).not.toHaveBeenCalled();
  });
});
