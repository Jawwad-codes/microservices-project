/** @format */

const {
  createOrderSchema,
  updateOrderSchema,
} = require("../validators/orderValidator");
const orderService = require("../services/orderService");

async function createOrder(req, res, next) {
  try {
    const data = createOrderSchema.parse(req.body);
    const order = await orderService.createOrder({
      userId: req.user.id,
      userEmail: req.user.email,
      productId: data.productId,
      quantity: data.quantity,
      paymentMethod: data.paymentMethod || "card",
    });
    res.status(201).json({ status: "success", data: order });
  } catch (err) {
    next(err);
  }
}

async function getOrders(req, res, next) {
  try {
    const orders = await orderService.getOrderHistory(req.user.id);
    res.status(200).json({ status: "success", data: orders });
  } catch (err) {
    next(err);
  }
}

async function getOrder(req, res, next) {
  try {
    const order = await orderService.getOrderById(req.params.id, req.user.id);
    res.status(200).json({ status: "success", data: order });
  } catch (err) {
    next(err);
  }
}

async function updateOrder(req, res, next) {
  try {
    const data = updateOrderSchema.parse(req.body);
    // Currently only 'cancelled' is an allowed status update from the client
    const order = await orderService.cancelOrder(
      req.params.id,
      req.user.id,
      req.user.email,
    );
    res.status(200).json({ status: "success", data: order });
  } catch (err) {
    next(err);
  }
}

async function deleteOrder(req, res, next) {
  try {
    await orderService.deleteOrder(req.params.id, req.user.id);
    res.status(200).json({ status: "success", message: "Order deleted" });
  } catch (err) {
    next(err);
  }
}

module.exports = { createOrder, getOrders, getOrder, updateOrder, deleteOrder };
