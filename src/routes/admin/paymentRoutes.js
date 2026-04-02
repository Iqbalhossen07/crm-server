const express = require("express");
const router = express.Router();
const {
  updatePaymentStatus,
} = require("../../controllers/admin/paymentController");

// স্ট্যাটাস আপডেটের রাউট
router.put("/:id/status", updatePaymentStatus);

module.exports = router;
