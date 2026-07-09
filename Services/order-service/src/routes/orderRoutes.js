/** @format */

const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const {
  createOrder,
  getOrders,
  getOrder,
  updateOrder,
  deleteOrder,
} = require("../controllers/orderController");

router.post("/orders", auth, createOrder);
router.get("/orders", auth, getOrders);
router.get("/orders/:id", auth, getOrder);
router.patch("/orders/:id", auth, updateOrder); // cancel an order
router.delete("/orders/:id", auth, deleteOrder); // hard delete (non-paid only)

module.exports = router;
