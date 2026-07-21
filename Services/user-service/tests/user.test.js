/**
 * User Service Tests
 * Prisma is mocked so tests never need a real database.
 *
 * @format
 */

const request = require("supertest");

process.env.JWT_SECRET = "test_jwt_secret";
process.env.DATABASE_URL = "postgresql://fake:fake@localhost:5432/fake";

// jest.mock is hoisted, so we cannot reference variables declared above it.
// We return a stable singleton via the factory and retrieve it after via require.
jest.mock("@prisma/client", () => {
  const mUser = {
    findUnique: jest.fn(),
    create: jest.fn(),
  };
  const instance = { user: mUser };
  const PrismaClient = jest.fn(() => instance);
  PrismaClient._instance = instance; // expose for tests
  return { PrismaClient };
});

jest.mock("bcryptjs", () => ({
  hash: jest.fn().mockResolvedValue("$2a$10$hashed"),
  compare: jest.fn(),
}));

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const app = require("../src/app");

// Grab the singleton the service will use
const db = PrismaClient._instance;

const validUser = {
  id: "user-uuid-1",
  name: "Test User",
  email: "test@example.com",
  password: "$2a$10$hashed",
  createdAt: new Date("2024-01-01"),
};

beforeEach(() => jest.clearAllMocks());

// ─────────────────────────────────────────────────────────────────────────────
describe("Health", () => {
  it("GET /health → 200 ok", async () => {
    const res = await request(app).get("/health");
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.service).toBe("user-service");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("POST /register", () => {
  it("201 – creates a new user", async () => {
    db.user.findUnique.mockResolvedValue(null);
    db.user.create.mockResolvedValue(validUser);

    const res = await request(app)
      .post("/register")
      .send({
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe("success");
    expect(res.body.data.email).toBe("test@example.com");
    expect(res.body.data.password).toBeUndefined();
  });

  it("409 – duplicate email", async () => {
    db.user.findUnique.mockResolvedValue(validUser);

    const res = await request(app)
      .post("/register")
      .send({
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      });

    expect(res.statusCode).toBe(409);
    expect(res.body.status).toBe("error");
  });

  it("400 – missing name", async () => {
    const res = await request(app)
      .post("/register")
      .send({ email: "test@example.com", password: "password123" });
    expect(res.statusCode).toBe(400);
  });

  it("400 – invalid email", async () => {
    const res = await request(app)
      .post("/register")
      .send({
        name: "Test User",
        email: "not-an-email",
        password: "password123",
      });
    expect(res.statusCode).toBe(400);
  });

  it("400 – password too short", async () => {
    const res = await request(app)
      .post("/register")
      .send({ name: "Test User", email: "test@example.com", password: "123" });
    expect(res.statusCode).toBe(400);
  });

  it("400 – name too short", async () => {
    const res = await request(app)
      .post("/register")
      .send({ name: "A", email: "test@example.com", password: "password123" });
    expect(res.statusCode).toBe(400);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("POST /login", () => {
  it("200 – valid credentials", async () => {
    db.user.findUnique.mockResolvedValue(validUser);
    bcrypt.compare.mockResolvedValue(true);

    const res = await request(app)
      .post("/login")
      .send({ email: "test@example.com", password: "password123" });

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("success");
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe("test@example.com");
  });

  it("401 – user not found", async () => {
    db.user.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .post("/login")
      .send({ email: "nobody@example.com", password: "password123" });

    expect(res.statusCode).toBe(401);
  });

  it("401 – wrong password", async () => {
    db.user.findUnique.mockResolvedValue(validUser);
    bcrypt.compare.mockResolvedValue(false);

    const res = await request(app)
      .post("/login")
      .send({ email: "test@example.com", password: "wrongpass" });

    expect(res.statusCode).toBe(401);
  });

  it("400 – missing password", async () => {
    const res = await request(app)
      .post("/login")
      .send({ email: "test@example.com" });
    expect(res.statusCode).toBe(400);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("GET /users/:id", () => {
  it("200 – returns user profile", async () => {
    db.user.findUnique.mockResolvedValue(validUser);

    const res = await request(app).get("/users/user-uuid-1");

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("success");
    expect(res.body.data.id).toBe("user-uuid-1");
    expect(res.body.data.email).toBe("test@example.com");
  });

  it("404 – user not found", async () => {
    db.user.findUnique.mockResolvedValue(null);

    const res = await request(app).get("/users/nonexistent");

    expect(res.statusCode).toBe(404);
    expect(res.body.status).toBe("error");
  });
});
