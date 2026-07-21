/** @format */

const request = require("supertest");
const jwt = require("jsonwebtoken");

process.env.JWT_SECRET = "test_jwt_secret";
process.env.DATABASE_URL = "postgresql://fake:fake@localhost:5432/fake";

jest.mock("@prisma/client", () => {
  const mProduct = {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
  const instance = { product: mProduct };
  const PrismaClient = jest.fn(() => instance);
  PrismaClient._instance = instance;
  return { PrismaClient };
});

const { PrismaClient } = require("@prisma/client");
const app = require("../src/app");
const db = PrismaClient._instance;

const validToken = jwt.sign(
  { id: "user-uuid-1", email: "admin@example.com", name: "Admin" },
  "test_jwt_secret",
);

const mockProduct = {
  id: "prod-uuid-1",
  name: "Test Product",
  description: "A test product",
  price: 1500,
  stock: 10,
  createdAt: new Date("2024-01-01"),
};

beforeEach(() => jest.clearAllMocks());

// ─────────────────────────────────────────────────────────────────────────────
describe("Health", () => {
  it("GET /health → 200 ok", async () => {
    const res = await request(app).get("/health");
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.service).toBe("product-service");
  });
});

describe("GET /products", () => {
  it("200 – list products (no auth)", async () => {
    db.product.findMany.mockResolvedValue([mockProduct]);
    const res = await request(app).get("/products");
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("success");
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data[0].name).toBe("Test Product");
  });

  it("200 – returns empty array", async () => {
    db.product.findMany.mockResolvedValue([]);
    const res = await request(app).get("/products");
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toEqual([]);
  });
});

describe("GET /products/:id", () => {
  it("200 – returns product", async () => {
    db.product.findUnique.mockResolvedValue(mockProduct);
    const res = await request(app).get("/products/prod-uuid-1");
    expect(res.statusCode).toBe(200);
    expect(res.body.data.id).toBe("prod-uuid-1");
  });

  it("404 – not found", async () => {
    db.product.findUnique.mockResolvedValue(null);
    const res = await request(app).get("/products/nonexistent");
    expect(res.statusCode).toBe(404);
  });
});

describe("POST /products", () => {
  it("401 – no token", async () => {
    const res = await request(app)
      .post("/products")
      .send({ name: "X", price: 100 });
    expect(res.statusCode).toBe(401);
  });

  it("201 – creates product", async () => {
    db.product.create.mockResolvedValue({
      ...mockProduct,
      name: "New Product",
    });
    const res = await request(app)
      .post("/products")
      .set("Authorization", `Bearer ${validToken}`)
      .send({ name: "New Product", price: 500, stock: 5 });
    expect(res.statusCode).toBe(201);
    expect(res.body.data.name).toBe("New Product");
  });

  it("400 – name too short", async () => {
    const res = await request(app)
      .post("/products")
      .set("Authorization", `Bearer ${validToken}`)
      .send({ name: "A", price: 500 });
    expect(res.statusCode).toBe(400);
  });

  it("400 – negative price", async () => {
    const res = await request(app)
      .post("/products")
      .set("Authorization", `Bearer ${validToken}`)
      .send({ name: "Widget", price: -10 });
    expect(res.statusCode).toBe(400);
  });

  it("400 – missing price", async () => {
    const res = await request(app)
      .post("/products")
      .set("Authorization", `Bearer ${validToken}`)
      .send({ name: "Widget", stock: 5 });
    expect(res.statusCode).toBe(400);
  });
});

describe("PUT /products/:id", () => {
  it("401 – no token", async () => {
    const res = await request(app)
      .put("/products/prod-uuid-1")
      .send({ price: 2000 });
    expect(res.statusCode).toBe(401);
  });

  it("200 – updates product", async () => {
    db.product.findUnique.mockResolvedValue(mockProduct);
    db.product.update.mockResolvedValue({ ...mockProduct, price: 2000 });
    const res = await request(app)
      .put("/products/prod-uuid-1")
      .set("Authorization", `Bearer ${validToken}`)
      .send({ price: 2000 });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.price).toBe(2000);
  });

  it("400 – empty body", async () => {
    const res = await request(app)
      .put("/products/prod-uuid-1")
      .set("Authorization", `Bearer ${validToken}`)
      .send({});
    expect(res.statusCode).toBe(400);
  });

  it("404 – not found", async () => {
    db.product.findUnique.mockResolvedValue(null);
    const res = await request(app)
      .put("/products/nonexistent")
      .set("Authorization", `Bearer ${validToken}`)
      .send({ price: 2000 });
    expect(res.statusCode).toBe(404);
  });
});

describe("DELETE /products/:id", () => {
  it("401 – no token", async () => {
    const res = await request(app).delete("/products/prod-uuid-1");
    expect(res.statusCode).toBe(401);
  });

  it("200 – deletes product", async () => {
    db.product.findUnique.mockResolvedValue(mockProduct);
    db.product.delete.mockResolvedValue(mockProduct);
    const res = await request(app)
      .delete("/products/prod-uuid-1")
      .set("Authorization", `Bearer ${validToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Product deleted");
  });

  it("404 – not found", async () => {
    db.product.findUnique.mockResolvedValue(null);
    const res = await request(app)
      .delete("/products/nonexistent")
      .set("Authorization", `Bearer ${validToken}`);
    expect(res.statusCode).toBe(404);
  });
});

describe("PATCH /products/:id/stock", () => {
  it("200 – decrements stock", async () => {
    db.product.findUnique.mockResolvedValue(mockProduct); // stock:10
    db.product.update.mockResolvedValue({ ...mockProduct, stock: 7 });
    const res = await request(app)
      .patch("/products/prod-uuid-1/stock")
      .send({ quantity: -3 });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.stock).toBe(7);
  });

  it("200 – increments stock", async () => {
    db.product.findUnique.mockResolvedValue(mockProduct);
    db.product.update.mockResolvedValue({ ...mockProduct, stock: 15 });
    const res = await request(app)
      .patch("/products/prod-uuid-1/stock")
      .send({ quantity: 5 });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.stock).toBe(15);
  });

  it("400 – insufficient stock", async () => {
    db.product.findUnique.mockResolvedValue({ ...mockProduct, stock: 2 });
    const res = await request(app)
      .patch("/products/prod-uuid-1/stock")
      .send({ quantity: -5 });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/insufficient/i);
  });

  it("400 – non-integer quantity", async () => {
    const res = await request(app)
      .patch("/products/prod-uuid-1/stock")
      .send({ quantity: 1.5 });
    expect(res.statusCode).toBe(400);
  });
});
