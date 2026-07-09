/** @format */

const express = require("express");
const router = express.Router();
const {
  pay,
  listPayments,
  getPaymentByOrder,
  getPaymentMethods,
  deletePaymentByOrder,
} = require("../controllers/paymentController");

router.post("/pay", pay);
router.get("/payments", listPayments);
router.get("/payments/methods", getPaymentMethods);
router.get("/payments/order/:orderId", getPaymentByOrder);
router.delete("/payments/order/:orderId", deletePaymentByOrder);

module.exports = router;
