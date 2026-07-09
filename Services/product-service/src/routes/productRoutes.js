/** @format */

const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const {
  addProduct,
  listProducts,
  getProduct,
  editProduct,
  removeProduct,
  updateProductStock,
} = require("../controllers/productController");

router.post("/products", auth, addProduct);
router.get("/products", listProducts);
router.get("/products/:id", getProduct);
router.put("/products/:id", auth, editProduct);
router.delete("/products/:id", auth, removeProduct);
// Internal route called by order-service to adjust stock (no auth – internal network only)
router.patch("/products/:id/stock", updateProductStock);

module.exports = router;
