/** @format */

const request = require("supertest");
const jwt = require("jsonwebtoken");
const app = require("../src/app");

process.env.JWT_SECRET = "test_jwt_secret";

// Mock Prisma
jest.mock("@prisma/client", () => {
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      product: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    })),
  };
});

const { PrismaClient } = require("@prisma/client");
let prisma;

const mockProduct = {
  id: "prod-uuid-1",
  name: "Test Product",
  description: "A test product",
  price: 1500,
  stock: 10,
  createdAt: new Date("2024-01-01"),
};

// Generate a valid JWT for authenticated routes
const validToken = jwt.sign(
  { id: "user-uuid-1", email: "admin@example.com", name: "Admin" },
  "test_jwt_secret",
);

beforeEach(() => {
  prisma = new PrismaClient();
  jest.clearAllMocks();
});

describe("Product Service — Health", () => {
  it("GET /health returns ok", async () => {
    const res = await request(app).get("/health");
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.service).toBe("product-service");
  });
});

describe("Product Service — List GET /products", () => {
  it("returns list of products without auth", async () => {
    prisma.product.findMany.mockResolvedValue([mockProduct]);

    const res = await request(app).get("/products");
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("success");
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data[0].name).toBe("Test Product");
  });

  it("returns empty array when no products", async () => {
    prisma.product.findMany.mockResolvedValue([]);

    const res = await request(app).get("/products");
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toEqual([]);
  });
});

describe("Product Service — Get one GET /products/:id", () => {
  it("returns a single product by id", async () => {
    prisma.product.findUnique.mockResolvedValue(mockProduct);

    const res = await request(app).get("/products/prod-uuid-1");
    expect(res.statusCode).toBe(200);
    expect(res.body.data.id).toBe("prod-uuid-1");
  });

  it("returns 404 for non-existent product", async () => {
    prisma.product.findUnique.mockResolvedValue(null);

    const res = await request(app).get("/products/nonexistent");
    expect(res.statusCode).toBe(404);
    expect(res.body.status).toBe("error");
  });
});

describe("Product Service — Create POST /products", () => {
  it("rejects creation without auth token", async () => {
    const res = await request(app)
      .post("/products")
      .send({ name: "New Product", price: 500, stock: 5 });
    expect(res.statusCode).toBe(401);
  });

  it("creates a product with valid auth and data", async () => {
    prisma.product.create.mockResolvedValue({
      ...mockProduct,
      name: "New Product",
    });

    const res = await request(app)
      .post("/products")
      .set("Authorization", `Bearer ${validToken}`)
      .send({ name: "New Product", price: 500, stock: 5 });

    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe("success");
    expect(res.body.data.name).toBe("New Product");
  });

  it("returns 400 for invalid product data (short name)", async () => {
    const res = await request(app)
      .post("/products")
      .set("Authorization", `Bearer ${validToken}`)
      .send({ name: "A", price: 500 });
    expect(res.statusCode).toBe(400);
  });

  it("returns 400 for negative price", async () => {
    const res = await request(app)
      .post("/products")
      .set("Authorization", `Bearer ${validToken}`)
      .send({ name: "Valid Name", price: -10 });
    expect(res.statusCode).toBe(400);
  });

  it("returns 400 for missing price", async () => {
    const res = await request(app)
      .post("/products")
      .set("Authorization", `Bearer ${validToken}`)
      .send({ name: "Valid Name", stock: 5 });
    expect(res.statusCode).toBe(400);
  });
});

describe("Product Service — Edit PUT /products/:id", () => {
  it("rejects edit without auth token", async () => {
    const res = await request(app)
      .put("/products/prod-uuid-1")
      .send({ price: 2000 });
    expect(res.statusCode).toBe(401);
  });

  it("updates a product with valid data", async () => {
    prisma.product.findUnique.mockResolvedValue(mockProduct);
    prisma.product.update.mockResolvedValue({ ...mockProduct, price: 2000 });

    const res = await request(app)
      .put("/products/prod-uuid-1")
      .set("Authorization", `Bearer ${validToken}`)
      .send({ price: 2000 });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.price).toBe(2000);
  });

  it("returns 400 when update body is empty", async () => {
    const res = await request(app)
      .put("/products/prod-uuid-1")
      .set("Authorization", `Bearer ${validToken}`)
      .send({});
    expect(res.statusCode).toBe(400);
  });

  it("returns 404 for non-existent product", async () => {
    prisma.product.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .put("/products/nonexistent")
      .set("Authorization", `Bearer ${validToken}`)
      .send({ price: 2000 });
    expect(res.statusCode).toBe(404);
  });
});

describe("Product Service — Delete DELETE /products/:id", () => {
  it("rejects delete without auth token", async () => {
    const res = await request(app).delete("/products/prod-uuid-1");
    expect(res.statusCode).toBe(401);
  });

  it("deletes a product successfully", async () => {
    prisma.product.findUnique.mockResolvedValue(mockProduct);
    prisma.product.delete.mockResolvedValue(mockProduct);

    const res = await request(app)
      .delete("/products/prod-uuid-1")
      .set("Authorization", `Bearer ${validToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("success");
    expect(res.body.message).toBe("Product deleted");
  });

  it("returns 404 when deleting non-existent product", async () => {
    prisma.product.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .delete("/products/nonexistent")
      .set("Authorization", `Bearer ${validToken}`);
    expect(res.statusCode).toBe(404);
  });
});

describe("Product Service — Stock PATCH /products/:id/stock", () => {
  it("decrements stock (negative quantity)", async () => {
    prisma.product.findUnique.mockResolvedValue(mockProduct);
    prisma.product.update.mockResolvedValue({ ...mockProduct, stock: 7 });

    const res = await request(app)
      .patch("/products/prod-uuid-1/stock")
      .send({ quantity: -3 });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.stock).toBe(7);
  });

  it("increments stock (positive quantity)", async () => {
    prisma.product.findUnique.mockResolvedValue(mockProduct);
    prisma.product.update.mockResolvedValue({ ...mockProduct, stock: 15 });

    const res = await request(app)
      .patch("/products/prod-uuid-1/stock")
      .send({ quantity: 5 });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.stock).toBe(15);
  });

  it("returns 400 for insufficient stock", async () => {
    prisma.product.findUnique.mockResolvedValue({ ...mockProduct, stock: 2 });

    const res = await request(app)
      .patch("/products/prod-uuid-1/stock")
      .send({ quantity: -5 }); // more than available

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/insufficient/i);
  });

  it("returns 400 for non-integer quantity", async () => {
    const res = await request(app)
      .patch("/products/prod-uuid-1/stock")
      .send({ quantity: 1.5 });
    expect(res.statusCode).toBe(400);
  });
});
