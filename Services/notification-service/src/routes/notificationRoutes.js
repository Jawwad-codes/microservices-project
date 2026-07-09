/** @format */

const express = require("express");
const router = express.Router();
const {
  notify,
  listNotifications,
  getNotificationsByEmail,
} = require("../controllers/notificationController");

router.post("/notify", notify);
router.get("/notifications", listNotifications);
router.get("/notifications/email/:email", getNotificationsByEmail);

module.exports = router;
