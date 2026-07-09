/** @format */

const { z } = require("zod");

const createOrderSchema = z.object({
  productId: z.string().min(1, "productId is required"),
  quantity: z.number().int().positive("quantity must be a positive integer"),
  paymentMethod: z.enum(["card", "jazzcash", "cod"]).optional().default("card"),
});

// Only status can be updated (e.g. cancelled by the user)
const updateOrderSchema = z.object({
  status: z.enum(["cancelled"], {
    errorMap: () => ({ message: "status must be 'cancelled'" }),
  }),
});

module.exports = { createOrderSchema, updateOrderSchema };
