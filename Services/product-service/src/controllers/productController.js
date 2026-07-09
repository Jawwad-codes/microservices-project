/** @format */

const {
  createProductSchema,
  updateProductSchema,
  updateStockSchema,
} = require("../validators/productValidator");
const productService = require("../services/productService");

async function addProduct(req, res, next) {
  try {
    const data = createProductSchema.parse(req.body);
    const product = await productService.createProduct(data);
    res.status(201).json({ status: "success", data: product });
  } catch (err) {
    next(err);
  }
}

async function listProducts(req, res, next) {
  try {
    const products = await productService.listProducts();
    res.status(200).json({ status: "success", data: products });
  } catch (err) {
    next(err);
  }
}

async function getProduct(req, res, next) {
  try {
    const product = await productService.getProductById(req.params.id);
    res.status(200).json({ status: "success", data: product });
  } catch (err) {
    next(err);
  }
}

async function editProduct(req, res, next) {
  try {
    const data = updateProductSchema.parse(req.body);
    const product = await productService.updateProduct(req.params.id, data);
    res.status(200).json({ status: "success", data: product });
  } catch (err) {
    next(err);
  }
}

async function removeProduct(req, res, next) {
  try {
    await productService.deleteProduct(req.params.id);
    res.status(200).json({ status: "success", message: "Product deleted" });
  } catch (err) {
    next(err);
  }
}

async function updateProductStock(req, res, next) {
  try {
    const data = updateStockSchema.parse(req.body);
    const product = await productService.updateStock(
      req.params.id,
      data.quantity,
    );
    res.status(200).json({ status: "success", data: product });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  addProduct,
  listProducts,
  getProduct,
  editProduct,
  removeProduct,
  updateProductStock,
};
