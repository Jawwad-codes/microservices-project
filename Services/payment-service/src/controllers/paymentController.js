/** @format */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Enabled payment methods driven by env vars
const ENABLED_METHODS = {
  card: process.env.ENABLE_CARD !== "false",
  jazzcash: process.env.ENABLE_JAZZCASH !== "false",
  cod: process.env.ENABLE_COD !== "false",
};

/**
 * POST /pay
 * Body: { orderId, amount, method? }
 * method defaults to "card"
 */
async function pay(req, res, next) {
  try {
    const { orderId, amount, method = "card" } = req.body;

    if (!orderId || amount === undefined || amount === null) {
      const err = new Error("orderId and amount are required");
      err.statusCode = 400;
      throw err;
    }

    if (!ENABLED_METHODS[method]) {
      const err = new Error(
        `Payment method "${method}" is not supported. Available: ${Object.keys(
          ENABLED_METHODS,
        )
          .filter((k) => ENABLED_METHODS[k])
          .join(", ")}`,
      );
      err.statusCode = 400;
      throw err;
    }

    if (typeof amount !== "number" || amount <= 0) {
      const err = new Error("amount must be a positive number");
      err.statusCode = 400;
      throw err;
    }

    console.log(
      `[Payment Service] Processing ${method} payment | orderId: ${orderId} | amount: ${amount}`,
    );

    // Check for duplicate payment
    const existing = await prisma.payment.findUnique({ where: { orderId } });
    if (existing) {
      // Idempotent: return existing result
      return res.status(200).json({
        status: existing.status,
        data: existing,
      });
    }

    const payment = await prisma.payment.create({
      data: {
        orderId,
        amount,
        method,
        status: "success",
      },
    });

    console.log(
      `[Payment Service] Payment recorded | id: ${payment.id} | method: ${method}`,
    );

    res.status(200).json({ status: "success", data: payment });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /payments
 * Returns all payment records
 */
async function listPayments(req, res, next) {
  try {
    const payments = await prisma.payment.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json({ status: "success", data: payments });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /payments/:orderId
 * Returns payment for a specific order
 */
async function getPaymentByOrder(req, res, next) {
  try {
    const payment = await prisma.payment.findUnique({
      where: { orderId: req.params.orderId },
    });
    if (!payment) {
      const err = new Error("Payment not found for this order");
      err.statusCode = 404;
      throw err;
    }
    res.status(200).json({ status: "success", data: payment });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /payments/methods
 * Returns list of available payment methods
 */
function getPaymentMethods(req, res) {
  const methods = Object.entries(ENABLED_METHODS)
    .filter(([, enabled]) => enabled)
    .map(([key]) => key);
  res.status(200).json({ status: "success", data: methods });
}

/**
 * DELETE /payments/order/:orderId
 * Deletes the payment record for a given order (called by order-service on order delete)
 */
async function deletePaymentByOrder(req, res, next) {
  try {
    const existing = await prisma.payment.findUnique({
      where: { orderId: req.params.orderId },
    });

    if (!existing) {
      // Nothing to delete — treat as success (idempotent)
      return res.status(200).json({ status: "success", data: null });
    }

    await prisma.payment.delete({ where: { orderId: req.params.orderId } });
    console.log(
      `[Payment Service] Payment deleted for orderId: ${req.params.orderId}`,
    );
    res
      .status(200)
      .json({ status: "success", data: { orderId: req.params.orderId } });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  pay,
  listPayments,
  getPaymentByOrder,
  getPaymentMethods,
  deletePaymentByOrder,
};
