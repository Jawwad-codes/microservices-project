/** @format */

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const { createProxyMiddleware } = require("http-proxy-middleware");
const requestLogger = require("./middleware/requestLogger");

const USER_SERVICE_URL =
  process.env.USER_SERVICE_URL || "http://localhost:4001";
const PRODUCT_SERVICE_URL =
  process.env.PRODUCT_SERVICE_URL || "http://localhost:4002";
const ORDER_SERVICE_URL =
  process.env.ORDER_SERVICE_URL || "http://localhost:4003";
const PAYMENT_SERVICE_URL =
  process.env.PAYMENT_SERVICE_URL || "http://localhost:4004";
const NOTIFICATION_SERVICE_URL =
  process.env.NOTIFICATION_SERVICE_URL || "http://localhost:4005";

const app = express();
app.use(cors());
app.use(requestLogger);

// NOTE: no express.json() here on purpose. Body parsing is left to each
// downstream service - if we parse the body here, http-proxy-middleware
// can't re-stream it and the proxied request hangs.

// Gateway's own health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "api-gateway" });
});

// Aggregated health check - pings every downstream service
app.get("/health/all", async (req, res) => {
  const services = {
    "user-service": USER_SERVICE_URL,
    "product-service": PRODUCT_SERVICE_URL,
    "order-service": ORDER_SERVICE_URL,
    "payment-service": PAYMENT_SERVICE_URL,
    "notification-service": NOTIFICATION_SERVICE_URL,
  };

  const results = await Promise.all(
    Object.entries(services).map(async ([name, url]) => {
      try {
        await axios.get(`${url}/health`, { timeout: 2000 });
        return [name, "up"];
      } catch (err) {
        return [name, "down"];
      }
    }),
  );

  res.json({
    status: "ok",
    service: "api-gateway",
    services: Object.fromEntries(results),
  });
});

// /api/auth/*  -> user-service /* (register, login)
app.use(
  "/api/auth",
  createProxyMiddleware({
    target: USER_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { "^/api/auth": "" },
  }),
);

// /api/users/* -> user-service /users/*
app.use(
  "/api/users",
  createProxyMiddleware({
    target: USER_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { "^/api/users": "/users" },
  }),
);

// /api/products/* -> product-service /products/*
app.use(
  "/api/products",
  createProxyMiddleware({
    target: PRODUCT_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { "^/api/products": "/products" },
  }),
);

// /api/orders/* -> order-service /orders/*
app.use(
  "/api/orders",
  createProxyMiddleware({
    target: ORDER_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { "^/api/orders": "/orders" },
  }),
);

// /api/payments/* -> payment-service /*
app.use(
  "/api/payments",
  createProxyMiddleware({
    target: PAYMENT_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { "^/api/payments": "" },
  }),
);

// /api/notifications/* -> notification-service /*
app.use(
  "/api/notifications",
  createProxyMiddleware({
    target: NOTIFICATION_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { "^/api/notifications": "" },
  }),
);

app.use((req, res) => {
  res
    .status(404)
    .json({ status: "error", message: "Route not found on API Gateway" });
});

module.exports = app;
