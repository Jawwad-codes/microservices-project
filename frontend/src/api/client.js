/** @format */

import axios from "axios";

const GATEWAY = import.meta.env.VITE_GATEWAY_URL || "http://localhost:4000";

const client = axios.create({ baseURL: GATEWAY });

// Inject auth token on every request
client.interceptors.request.use((config) => {
  const token = localStorage.getItem("sf_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auth endpoints
export const authApi = {
  register: (data) => client.post("/api/auth/register", data),
  login: (data) => client.post("/api/auth/login", data),
  profile: (id) => client.get(`/api/users/${id}`),
};

// Products endpoints
export const productsApi = {
  list: () => client.get("/api/products"),
  get: (id) => client.get(`/api/products/${id}`),
  create: (data) => client.post("/api/products", data),
  update: (id, data) => client.put(`/api/products/${id}`, data),
  remove: (id) => client.delete(`/api/products/${id}`),
};

// Orders endpoints
export const ordersApi = {
  list: () => client.get("/api/orders"),
  create: (data) => client.post("/api/orders", data),
  cancel: (id) => client.patch(`/api/orders/${id}`, { status: "cancelled" }),
  remove: (id) => client.delete(`/api/orders/${id}`),
};

// Payments endpoints
export const paymentsApi = {
  list: () => client.get("/api/payments/payments"),
  methods: () => client.get("/api/payments/payments/methods"),
  getByOrder: (orderId) =>
    client.get(`/api/payments/payments/order/${orderId}`),
};

// Notifications endpoints
export const notificationsApi = {
  list: () => client.get("/api/notifications/notifications"),
  byEmail: (email) =>
    client.get(`/api/notifications/notifications/email/${email}`),
};

// Health — uses the gateway's aggregated /health/all endpoint
export async function checkHealth() {
  try {
    const res = await axios.get(`${GATEWAY}/health/all`, { timeout: 3000 });
    // response shape: { status, service, services: { 'user-service': 'up', ... } }
    // add the gateway itself from the top-level status
    return {
      "api-gateway": res.data.status === "ok" ? "up" : "down",
      ...res.data.services,
    };
  } catch {
    // gateway itself is down — mark everything as down
    return {
      "api-gateway": "down",
      "user-service": "down",
      "product-service": "down",
      "order-service": "down",
      "payment-service": "down",
      "notification-service": "down",
    };
  }
}
