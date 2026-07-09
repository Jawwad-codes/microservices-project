/** @format */

const { PrismaClient } = require("@prisma/client");
const axios = require("axios");

const prisma = new PrismaClient();

const PRODUCT_SERVICE_URL =
  process.env.PRODUCT_SERVICE_URL || "http://localhost:4002";
const PAYMENT_SERVICE_URL =
  process.env.PAYMENT_SERVICE_URL || "http://localhost:4004";
const NOTIFICATION_SERVICE_URL =
  process.env.NOTIFICATION_SERVICE_URL || "http://localhost:4005";

async function createOrder({
  userId,
  userEmail,
  productId,
  quantity,
  paymentMethod = "card",
}) {
  // 1. Verify product exists via Product Service
  let product;
  try {
    const response = await axios.get(
      PRODUCT_SERVICE_URL + "/products/" + productId,
    );
    product = response.data.data;
  } catch (err) {
    const e = new Error("Product not found or Product Service unavailable");
    e.statusCode = 404;
    throw e;
  }

  // 1.5 Check if sufficient stock is available
  if (product.stock < quantity) {
    const e = new Error(
      "Insufficient stock. Available: " +
        product.stock +
        ", Requested: " +
        quantity,
    );
    e.statusCode = 400;
    throw e;
  }

  const totalPrice = product.price * quantity;

  // 2. Create order record with pending status
  let order = await prisma.order.create({
    data: { userId, productId, quantity, totalPrice, status: "pending" },
  });

  // 3. Call Payment Service
  try {
    const payResponse = await axios.post(PAYMENT_SERVICE_URL + "/pay", {
      orderId: order.id,
      amount: totalPrice,
      method: paymentMethod,
    });

    if (payResponse.data.status === "success") {
      order = await prisma.order.update({
        where: { id: order.id },
        data: { status: "paid" },
      });

      // 3.5 Decrement stock after successful payment
      try {
        await axios.patch(
          PRODUCT_SERVICE_URL + "/products/" + productId + "/stock",
          { quantity: -quantity }, // negative to decrement
        );
      } catch (stockErr) {
        console.error(
          "[Order Service] Failed to update stock:",
          stockErr.message,
        );
        // Mark order as having stock issue for manual reconciliation
        order = await prisma.order.update({
          where: { id: order.id },
          data: { status: "paid_stock_update_failed" },
        });
      }
    }
  } catch (err) {
    order = await prisma.order.update({
      where: { id: order.id },
      data: { status: "payment_failed" },
    });
    const e = new Error("Payment failed, order was not completed");
    e.statusCode = 402;
    throw e;
  }

  // 4. Notify user (best-effort, does not fail the order if it errors)
  try {
    await axios.post(NOTIFICATION_SERVICE_URL + "/notify", {
      email: userEmail,
      type: "order_confirmation",
      data: {
        orderId: order.id,
        productName: product.name,
        quantity: quantity,
        totalPrice: totalPrice,
        status: order.status,
        orderDate: order.createdAt || new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error(
      "[Order Service] Notification Service call failed:",
      err.message,
    );
  }

  return order;
}

async function getOrderHistory(userId) {
  return prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

async function getOrderById(orderId, userId) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    const e = new Error("Order not found");
    e.statusCode = 404;
    throw e;
  }
  if (order.userId !== userId) {
    const e = new Error("Forbidden: this order does not belong to you");
    e.statusCode = 403;
    throw e;
  }
  return order;
}

async function cancelOrder(orderId, userId, userEmail) {
  const order = await getOrderById(orderId, userId);

  const cancellableStatuses = ["pending", "paid", "paid_stock_update_failed"];
  if (!cancellableStatuses.includes(order.status)) {
    const e = new Error(
      "Order cannot be cancelled. Current status: " + order.status,
    );
    e.statusCode = 400;
    throw e;
  }

  // Restore stock if payment had already gone through
  if (order.status === "paid") {
    try {
      await axios.patch(
        PRODUCT_SERVICE_URL + "/products/" + order.productId + "/stock",
        { quantity: order.quantity }, // positive to restore
      );
    } catch (stockErr) {
      console.error(
        "[Order Service] Failed to restore stock on cancellation:",
        stockErr.message,
      );
    }
  }

  const cancelled = await prisma.order.update({
    where: { id: orderId },
    data: { status: "cancelled" },
  });

  // Notify user (best-effort)
  try {
    await axios.post(NOTIFICATION_SERVICE_URL + "/notify", {
      email: userEmail,
      type: "order_cancelled",
      data: {
        orderId: cancelled.id,
        status: cancelled.status,
        orderDate: cancelled.createdAt,
      },
    });
  } catch (err) {
    console.error(
      "[Order Service] Notification Service call failed on cancel:",
      err.message,
    );
  }

  return cancelled;
}

async function deleteOrder(orderId, userId) {
  const order = await getOrderById(orderId, userId);

  // Block delete only on active paid orders — must cancel first to restore stock
  if (order.status === "paid" || order.status === "paid_stock_update_failed") {
    const e = new Error(
      "Paid orders cannot be deleted. Cancel the order first to restore stock.",
    );
    e.statusCode = 400;
    throw e;
  }

  // Delete associated payment record (best-effort — don't fail if payment service is down)
  try {
    await axios.delete(PAYMENT_SERVICE_URL + "/payments/order/" + orderId);
  } catch (payErr) {
    console.error(
      "[Order Service] Failed to delete payment record for order " +
        orderId +
        ":",
      payErr.message,
    );
  }

  await prisma.order.delete({ where: { id: orderId } });
  return { id: orderId };
}

module.exports = {
  createOrder,
  getOrderHistory,
  getOrderById,
  cancelOrder,
  deleteOrder,
};
