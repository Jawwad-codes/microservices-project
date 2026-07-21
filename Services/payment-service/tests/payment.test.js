/** @format */

const request = require("supertest");
const app = require("../src/app");

process.env.ENABLE_CARD = "true";
process.env.ENABLE_JAZZCASH = "true";
process.env.ENABLE_COD = "true";

jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    payment: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
    },
  })),
}));

const { PrismaClient } = require("@prisma/client");
let prisma;

const mockPayment = {
  id: "pay-uuid-1",
  orderId: "order-uuid-1",
  amount: 1500,
  method: "card",
  status: "success",
  createdAt: new Date(),
};

beforeEach(() => {
  prisma = new PrismaClient();
  jest.clearAllMocks();
});

describe("Payment Service — Health", () => {
  it("GET /health returns ok", async () => {
    const res = await request(app).get("/health");
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.service).toBe("payment-service");
  });
});

describe("Payment Service — Methods GET /payments/methods", () => {
  it("returns available payment methods", async () => {
    const res = await request(app).get("/payments/methods");
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("success");
    expect(res.body.data).toContain("card");
    expect(res.body.data).toContain("jazzcash");
    expect(res.body.data).toContain("cod");
  });
});

describe("Payment Service — Pay POST /pay", () => {
  it("processes a card payment successfully", async () => {
    prisma.payment.findUnique.mockResolvedValue(null);
    prisma.payment.create.mockResolvedValue(mockPayment);

    const res = await request(app)
      .post("/pay")
      .send({ orderId: "order-uuid-1", amount: 1500, method: "card" });

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("success");
    expect(res.body.data.method).toBe("card");
    expect(res.body.data.status).toBe("success");
  });

  it("processes jazzcash payment", async () => {
    prisma.payment.findUnique.mockResolvedValue(null);
    prisma.payment.create.mockResolvedValue({
      ...mockPayment,
      method: "jazzcash",
    });

    const res = await request(app)
      .post("/pay")
      .send({ orderId: "order-uuid-2", amount: 2000, method: "jazzcash" });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.method).toBe("jazzcash");
  });

  it("processes cod payment", async () => {
    prisma.payment.findUnique.mockResolvedValue(null);
    prisma.payment.create.mockResolvedValue({ ...mockPayment, method: "cod" });

    const res = await request(app)
      .post("/pay")
      .send({ orderId: "order-uuid-3", amount: 500, method: "cod" });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.method).toBe("cod");
  });

  it("defaults to card when method not provided", async () => {
    prisma.payment.findUnique.mockResolvedValue(null);
    prisma.payment.create.mockResolvedValue(mockPayment);

    const res = await request(app)
      .post("/pay")
      .send({ orderId: "order-uuid-1", amount: 1500 });

    expect(res.statusCode).toBe(200);
  });

  it("returns existing payment idempotently for duplicate orderId", async () => {
    prisma.payment.findUnique.mockResolvedValue(mockPayment);

    const res = await request(app)
      .post("/pay")
      .send({ orderId: "order-uuid-1", amount: 1500, method: "card" });

    expect(res.statusCode).toBe(200);
    expect(prisma.payment.create).not.toHaveBeenCalled();
  });

  it("returns 400 for missing orderId", async () => {
    const res = await request(app).post("/pay").send({ amount: 500 });
    expect(res.statusCode).toBe(400);
    expect(res.body.status).toBe("error");
  });

  it("returns 400 for missing amount", async () => {
    const res = await request(app)
      .post("/pay")
      .send({ orderId: "order-uuid-1" });
    expect(res.statusCode).toBe(400);
  });

  it("returns 400 for zero amount", async () => {
    prisma.payment.findUnique.mockResolvedValue(null);
    const res = await request(app)
      .post("/pay")
      .send({ orderId: "order-uuid-1", amount: 0 });
    expect(res.statusCode).toBe(400);
  });

  it("returns 400 for unsupported payment method", async () => {
    const res = await request(app)
      .post("/pay")
      .send({ orderId: "order-uuid-1", amount: 500, method: "bitcoin" });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/not supported/i);
  });
});

describe("Payment Service — List GET /payments", () => {
  it("returns all payments", async () => {
    prisma.payment.findMany.mockResolvedValue([mockPayment]);

    const res = await request(app).get("/payments");
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("success");
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data[0].orderId).toBe("order-uuid-1");
  });

  it("returns empty array when no payments", async () => {
    prisma.payment.findMany.mockResolvedValue([]);
    const res = await request(app).get("/payments");
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toEqual([]);
  });
});

describe("Payment Service — Get by Order GET /payments/order/:orderId", () => {
  it("returns payment for an existing order", async () => {
    prisma.payment.findUnique.mockResolvedValue(mockPayment);

    const res = await request(app).get("/payments/order/order-uuid-1");
    expect(res.statusCode).toBe(200);
    expect(res.body.data.orderId).toBe("order-uuid-1");
  });

  it("returns 404 when no payment for order", async () => {
    prisma.payment.findUnique.mockResolvedValue(null);

    const res = await request(app).get("/payments/order/nonexistent");
    expect(res.statusCode).toBe(404);
    expect(res.body.status).toBe("error");
  });
});

describe("Payment Service — Delete DELETE /payments/order/:orderId", () => {
  it("deletes an existing payment record", async () => {
    prisma.payment.findUnique.mockResolvedValue(mockPayment);
    prisma.payment.delete.mockResolvedValue(mockPayment);

    const res = await request(app).delete("/payments/order/order-uuid-1");
    expect(res.statusCode).toBe(200);
    expect(res.body.data.orderId).toBe("order-uuid-1");
    expect(prisma.payment.delete).toHaveBeenCalledWith({
      where: { orderId: "order-uuid-1" },
    });
  });

  it("returns success (idempotent) when no payment exists for orderId", async () => {
    prisma.payment.findUnique.mockResolvedValue(null);

    const res = await request(app).delete("/payments/order/nonexistent");
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("success");
    expect(res.body.data).toBeNull();
    expect(prisma.payment.delete).not.toHaveBeenCalled();
  });
});
