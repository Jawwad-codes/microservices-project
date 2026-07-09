/** @format */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function createProduct(data) {
  return prisma.product.create({ data });
}

async function listProducts() {
  return prisma.product.findMany({ orderBy: { createdAt: "desc" } });
}

async function getProductById(id) {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) {
    const err = new Error("Product not found");
    err.statusCode = 404;
    throw err;
  }
  return product;
}

async function updateStock(id, quantity) {
  // Fetch the product first to check current stock
  const product = await getProductById(id);

  const newStock = product.stock + quantity;

  if (newStock < 0) {
    const err = new Error("Insufficient stock available");
    err.statusCode = 400;
    throw err;
  }

  return prisma.product.update({
    where: { id },
    data: { stock: newStock },
  });
}

async function updateProduct(id, data) {
  // Ensure product exists first
  await getProductById(id);
  return prisma.product.update({
    where: { id },
    data,
  });
}

async function deleteProduct(id) {
  // Ensure product exists first
  await getProductById(id);
  return prisma.product.delete({ where: { id } });
}

module.exports = {
  createProduct,
  listProducts,
  getProductById,
  updateProduct,
  updateStock,
  deleteProduct,
};
