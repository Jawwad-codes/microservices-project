/** @format */

const request = require("supertest");
const app = require("../src/app");

jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    notification: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  })),
}));

const { PrismaClient } = require("@prisma/client");
let prisma;

const mockNotification = {
  id: "notif-uuid-1",
  email: "user@example.com",
  type: "order_confirmation",
  subject: "Order Confirmation",
  body: "Hi there,\n\nYour order has been confirmed!",
  status: "sent",
  createdAt: new Date(),
};

beforeEach(() => {
  prisma = new PrismaClient();
  jest.clearAllMocks();
});

describe("Notification Service — Health", () => {
  it("GET /health returns ok", async () => {
    const res = await request(app).get("/health");
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.service).toBe("notification-service");
  });
});

describe("Notification Service — Notify POST /notify", () => {
  it("sends an order_confirmation notification", async () => {
    prisma.notification.create.mockResolvedValue(mockNotification);

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
    expect(prisma.notification.create).toHaveBeenCalledTimes(1);
  });

  it("sends an order_cancelled notification", async () => {
    const cancelled = {
      ...mockNotification,
      type: "order_cancelled",
      subject: "Order Cancelled",
    };
    prisma.notification.create.mockResolvedValue(cancelled);

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

  it("sends a payment_failed notification", async () => {
    const failed = {
      ...mockNotification,
      type: "payment_failed",
      subject: "Payment Failed",
    };
    prisma.notification.create.mockResolvedValue(failed);

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

  it("sends a generic notification with plain message", async () => {
    const generic = {
      ...mockNotification,
      type: "generic",
      subject: "Notification",
    };
    prisma.notification.create.mockResolvedValue(generic);

    const res = await request(app)
      .post("/notify")
      .send({
        email: "user@example.com",
        type: "generic",
        data: { message: "Hello there!", subject: "Hello" },
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.type).toBe("generic");
  });

  it("falls back to generic template for unknown type", async () => {
    prisma.notification.create.mockResolvedValue({
      ...mockNotification,
      type: "unknown_type",
    });

    const res = await request(app)
      .post("/notify")
      .send({
        email: "user@example.com",
        type: "unknown_type",
        data: { message: "Fallback message" },
      });

    expect(res.statusCode).toBe(200);
  });

  it("persists notification to DB", async () => {
    prisma.notification.create.mockResolvedValue(mockNotification);

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

    expect(prisma.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: "user@example.com",
          type: "order_confirmation",
          status: "sent",
        }),
      }),
    );
  });

  it("returns 400 when email is missing", async () => {
    const res = await request(app)
      .post("/notify")
      .send({
        type: "generic",
        data: { message: "No email provided" },
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.status).toBe("error");
    expect(res.body.message).toMatch(/email/i);
  });
});

describe("Notification Service — List GET /notifications", () => {
  it("returns all notifications", async () => {
    prisma.notification.findMany.mockResolvedValue([mockNotification]);

    const res = await request(app).get("/notifications");
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("success");
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data[0].email).toBe("user@example.com");
  });

  it("returns empty array when no notifications", async () => {
    prisma.notification.findMany.mockResolvedValue([]);

    const res = await request(app).get("/notifications");
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toEqual([]);
  });
});

describe("Notification Service — By Email GET /notifications/email/:email", () => {
  it("returns notifications for a given email", async () => {
    prisma.notification.findMany.mockResolvedValue([mockNotification]);

    const res = await request(app).get("/notifications/email/user@example.com");
    expect(res.statusCode).toBe(200);
    expect(res.body.data[0].email).toBe("user@example.com");
    expect(prisma.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { email: "user@example.com" },
      }),
    );
  });

  it("returns empty array when email has no notifications", async () => {
    prisma.notification.findMany.mockResolvedValue([]);

    const res = await request(app).get(
      "/notifications/email/nobody@example.com",
    );
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toEqual([]);
  });
});
