/** @format */

const { z } = require("zod");

const createProductSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  price: z.number().positive("Price must be a positive number"),
  stock: z.number().int().nonnegative().optional(),
});

// All fields optional – only include what you want to change
const updateProductSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters").optional(),
    description: z.string().optional(),
    price: z.number().positive("Price must be a positive number").optional(),
    stock: z.number().int().nonnegative("Stock cannot be negative").optional(),
  })
  .refine((obj) => Object.keys(obj).length > 0, {
    message: "At least one field must be provided to update",
  });

// quantity is a signed integer:
//   negative = decrement stock (e.g. order placed)
//   positive = increment stock (e.g. restock / cancellation)
const updateStockSchema = z.object({
  quantity: z.number().int({ message: "Quantity must be an integer" }),
});

module.exports = {
  createProductSchema,
  updateProductSchema,
  updateStockSchema,
};
