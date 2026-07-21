/** @format */

const request = require("supertest");
const app = require("../src/app");

// Mock Prisma so tests never touch the real DB
jest.mock("@prisma/client", () => {
  const mockUser = {
    id: "user-uuid-1",
    name: "Test User",
    email: "test@example.com",
    password: "$2a$10$hashedpassword",
    createdAt: new Date("2024-01-01"),
  };

  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    })),
  };
});

// Mock bcryptjs
jest.mock("bcryptjs", () => ({
  hash: jest.fn().mockResolvedValue("$2a$10$hashedpassword"),
  compare: jest.fn().mockResolvedValue(true),
}));

// Set JWT secret for tests
process.env.JWT_SECRET = "test_jwt_secret";

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

let prisma;

beforeEach(() => {
  prisma = new PrismaClient();
  jest.clearAllMocks();
});

describe("User Service — Health", () => {
  it("GET /health returns ok", async () => {
    const res = await request(app).get("/health");
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.service).toBe("user-service");
  });
});

describe("User Service — Register POST /register", () => {
  it("registers a new user successfully", async () => {
    prisma.user.findUnique.mockResolvedValue(null); // no existing user
    prisma.user.create.mockResolvedValue({
      id: "user-uuid-1",
      name: "Test User",
      email: "test@example.com",
      password: "$2a$10$hashedpassword",
    });

    const res = await request(app).post("/register").send({
      name: "Test User",
      email: "test@example.com",
      password: "password123",
    });

    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe("success");
    expect(res.body.data.email).toBe("test@example.com");
    expect(res.body.data.password).toBeUndefined(); // password not returned
  });

  it("returns 409 when email already exists", async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: "existing",
      email: "test@example.com",
    });

    const res = await request(app).post("/register").send({
      name: "Test User",
      email: "test@example.com",
      password: "password123",
    });

    expect(res.statusCode).toBe(409);
    expect(res.body.status).toBe("error");
  });

  it("returns 400 for missing name", async () => {
    const res = await request(app).post("/register").send({
      email: "test@example.com",
      password: "password123",
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.status).toBe("error");
  });

  it("returns 400 for invalid email", async () => {
    const res = await request(app).post("/register").send({
      name: "Test User",
      email: "not-an-email",
      password: "password123",
    });
    expect(res.statusCode).toBe(400);
  });

  it("returns 400 for password shorter than 6 chars", async () => {
    const res = await request(app).post("/register").send({
      name: "Test User",
      email: "test@example.com",
      password: "123",
    });
    expect(res.statusCode).toBe(400);
  });

  it("returns 400 for name shorter than 2 chars", async () => {
    const res = await request(app).post("/register").send({
      name: "A",
      email: "test@example.com",
      password: "password123",
    });
    expect(res.statusCode).toBe(400);
  });
});

describe("User Service — Login POST /login", () => {
  it("logs in with valid credentials", async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: "user-uuid-1",
      name: "Test User",
      email: "test@example.com",
      password: "$2a$10$hashedpassword",
    });
    bcrypt.compare.mockResolvedValue(true);

    const res = await request(app).post("/login").send({
      email: "test@example.com",
      password: "password123",
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("success");
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe("test@example.com");
  });

  it("returns 401 for non-existent user", async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    const res = await request(app).post("/login").send({
      email: "nobody@example.com",
      password: "password123",
    });

    expect(res.statusCode).toBe(401);
    expect(res.body.status).toBe("error");
  });

  it("returns 401 for wrong password", async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: "user-uuid-1",
      email: "test@example.com",
      password: "$2a$10$hashedpassword",
    });
    bcrypt.compare.mockResolvedValue(false);

    const res = await request(app).post("/login").send({
      email: "test@example.com",
      password: "wrongpassword",
    });

    expect(res.statusCode).toBe(401);
  });

  it("returns 400 for missing password field", async () => {
    const res = await request(app).post("/login").send({
      email: "test@example.com",
    });
    expect(res.statusCode).toBe(400);
  });
});

describe("User Service — Profile GET /users/:id", () => {
  it("returns user profile by id", async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: "user-uuid-1",
      name: "Test User",
      email: "test@example.com",
      createdAt: new Date("2024-01-01"),
    });

    const res = await request(app).get("/users/user-uuid-1");

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("success");
    expect(res.body.data.id).toBe("user-uuid-1");
    expect(res.body.data.email).toBe("test@example.com");
  });

  it("returns 404 for non-existent user id", async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    const res = await request(app).get("/users/nonexistent-id");

    expect(res.statusCode).toBe(404);
    expect(res.body.status).toBe("error");
  });
});
