/** @format */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Email templates — driven by structured data, nothing hardcoded.
 */
const templates = {
  order_confirmation: (data) => ({
    subject: "Order Confirmation",
    body: [
      "Hi there,",
      "",
      "Your order has been confirmed!",
      "",
      "  Order ID    : " + data.orderId,
      "  Product     : " + data.productName,
      "  Quantity    : " + data.quantity,
      "  Total Price : Rs " + Number(data.totalPrice).toLocaleString(),
      "  Status      : " + data.status,
      "  Date        : " + new Date(data.orderDate).toLocaleString(),
      "",
      "Thank you for your purchase!",
    ].join("\n"),
  }),

  payment_failed: (data) => ({
    subject: "Payment Failed",
    body: [
      "Hi there,",
      "",
      "Unfortunately, your payment could not be processed.",
      "",
      "  Order ID : " + data.orderId,
      "  Amount   : Rs " + Number(data.amount).toLocaleString(),
      "",
      "Please try again or contact support.",
    ].join("\n"),
  }),

  order_cancelled: (data) => ({
    subject: "Order Cancelled",
    body: [
      "Hi there,",
      "",
      "Your order has been successfully cancelled.",
      "",
      "  Order ID : " + data.orderId,
      "  Status   : " + data.status,
      "  Date     : " + new Date(data.orderDate).toLocaleString(),
      "",
      "If you did not request this, please contact support.",
    ].join("\n"),
  }),

  generic: (data) => ({
    subject: data.subject || "Notification",
    body: data.message || "You have a new notification.",
  }),
};

/**
 * POST /notify
 * { email, type?, subject?, data?, message? }
 */
async function notify(req, res, next) {
  try {
    const { email, type = "generic", data = {}, message, subject } = req.body;

    if (!email) {
      const err = new Error("Missing required field: email");
      err.statusCode = 400;
      throw err;
    }

    const templateData = { ...data, subject, message };
    const renderTemplate = templates[type] || templates.generic;
    const rendered = renderTemplate(templateData);

    // Persist to DB
    const notification = await prisma.notification.create({
      data: {
        email,
        type,
        subject: rendered.subject,
        body: rendered.body,
        status: "sent",
      },
    });

    // Log (acts as email send until SMTP is wired)
    console.log("[Notification Service] ─────────────────────────────────");
    console.log("  To      : " + email);
    console.log("  Subject : " + rendered.subject);
    console.log("  Type    : " + type);
    console.log("  Body    :\n" + rendered.body);
    console.log("[Notification Service] ─────────────────────────────────");

    /*
     * TODO: swap console.log above for real SMTP via nodemailer:
     *
     *   const transporter = nodemailer.createTransport({
     *     host: process.env.MAIL_HOST, port: process.env.MAIL_PORT,
     *     auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS }
     *   });
     *   await transporter.sendMail({
     *     from: process.env.MAIL_FROM, to: email,
     *     subject: rendered.subject, text: rendered.body
     *   });
     */

    res.status(200).json({ status: "success", data: notification });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /notifications
 * Returns all notifications, newest first
 */
async function listNotifications(req, res, next) {
  try {
    const notifications = await prisma.notification.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json({ status: "success", data: notifications });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /notifications/email/:email
 * Returns notifications for a specific email
 */
async function getNotificationsByEmail(req, res, next) {
  try {
    const notifications = await prisma.notification.findMany({
      where: { email: req.params.email },
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json({ status: "success", data: notifications });
  } catch (err) {
    next(err);
  }
}

module.exports = { notify, listNotifications, getNotificationsByEmail };
