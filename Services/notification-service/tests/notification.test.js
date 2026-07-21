/** @format */

const request = require("supertest");

process.env.DATABASE_URL = "postgresql://fake:fake@localhost:5432/fake";

jest.mock("@prisma/client", () => {
  const mNotification = {
    create: jest.fn(),
    findMany: jest.fn(),
  };
  const instance = { notification: mNotification };
  const PrismaClient = jest.fn(() => instance);
  PrismaClient._instance = instance;
  return { PrismaClient };
});

const { PrismaClient } = require("@prisma/client");
const app = require("../src/app");
const db = PrismaClient._instance;

const mockNotification = {
  id: "notif-uuid-1",
  email: "user@example.com",
  type: "order_confirmation",
  subject: "Order Confirmation",
  body: "Hi there,\n\nYour order has been confirmed!",
  status: "sent",
  createdAt: new Date(),
};

beforeEach(() => jest.clearAllMocks());

// ─────────────────────────────────────────────────────────────────────────────
describe("Health", () => {
  it("GET /health → 200 ok", async () => {
    const res = await request(app).get("/health");
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.service).toBe("notification-service");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("POST /notify", () => {
  it("200 – order_confirmation notification", async () => {
    db.notification.create.mockResolvedValue(mockNotification);

    const res = await request(app)
      .post("/notify")
      .send({
        email: "user@example.com",
        type: "order_confirmation",
        data: {
          orderId: "order-1",
          productName: "Widget",
          quantity: 2,
          totalPrice: 1000,
          status: "paid",
          orderDate: new Date().toISOString(),
        },
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("success");
    expect(res.body.data.email).toBe("user@example.com");
    expect(res.body.data.type).toBe("order_confirmation");
  });

  it("200 – order_cancelled notification", async () => {
    const cancelled = {
      ...mockNotification,
      type: "order_cancelled",
      subject: "Order Cancelled",
    };
    db.notification.create.mockResolvedValue(cancelled);

    const res = await request(app)
      .post("/notify")
      .send({
        email: "user@example.com",
        type: "order_cancelled",
        data: {
          orderId: "order-1",
          status: "cancelled",
          orderDate: new Date().toISOString(),
        },
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.type).toBe("order_cancelled");
  });

  it("200 – payment_failed notification", async () => {
    const failed = {
      ...mockNotification,
      type: "payment_failed",
      subject: "Payment Failed",
    };
    db.notification.create.mockResolvedValue(failed);

    const res = await request(app)
      .post("/notify")
      .send({
        email: "user@example.com",
        type: "payment_failed",
        data: { orderId: "order-1", amount: 500 },
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.type).toBe("payment_failed");
  });

  it("200 – generic fallback for unknown type", async () => {
    db.notification.create.mockResolvedValue({
      ...mockNotification,
      type: "custom_type",
    });

    const res = await request(app)
      .post("/notify")
      .send({
        email: "user@example.com",
        type: "custom_type",
        data: { message: "Hello" },
      });

    expect(res.statusCode).toBe(200);
  });

  it("persists notification to DB with correct fields", async () => {
    db.notification.create.mockResolvedValue(mockNotification);

    await request(app)
      .post("/notify")
      .send({
        email: "user@example.com",
        type: "order_confirmation",
        data: {
          orderId: "order-1",
          productName: "Widget",
          quantity: 1,
          totalPrice: 500,
          status: "paid",
          orderDate: new Date().toISOString(),
        },
      });

    expect(db.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: "user@example.com",
          type: "order_confirmation",
          status: "sent",
        }),
      }),
    );
  });

  it("400 – missing email", async () => {
    const res = await request(app)
      .post("/notify")
      .send({
        type: "generic",
        data: { message: "No email" },
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.status).toBe("error");
    expect(res.body.message).toMatch(/email/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("GET /notifications", () => {
  it("200 – returns all notifications", async () => {
    db.notification.findMany.mockResolvedValue([mockNotification]);
    const res = await request(app).get("/notifications");
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data[0].email).toBe("user@example.com");
  });

  it("200 – empty array", async () => {
    db.notification.findMany.mockResolvedValue([]);
    const res = await request(app).get("/notifications");
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("GET /notifications/email/:email", () => {
  it("200 – returns notifications for email", async () => {
    db.notification.findMany.mockResolvedValue([mockNotification]);
    const res = await request(app).get("/notifications/email/user@example.com");
    expect(res.statusCode).toBe(200);
    expect(res.body.data[0].email).toBe("user@example.com");
    expect(db.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { email: "user@example.com" } }),
    );
  });

  it("200 – empty array when email has no notifications", async () => {
    db.notification.findMany.mockResolvedValue([]);
    const res = await request(app).get(
      "/notifications/email/nobody@example.com",
    );
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toEqual([]);
  });
});
