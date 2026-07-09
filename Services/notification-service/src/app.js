/** @format */

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const notificationRoutes = require("./routes/notificationRoutes");
const errorHandler = require("./middleware/errorHandler");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (req, res) =>
  res.json({ status: "ok", service: "notification-service" }),
);
app.use("/", notificationRoutes);

app.use(errorHandler);

module.exports = app;
