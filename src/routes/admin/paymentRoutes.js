const express = require("express");
const router = express.Router();
const {
  updatePaymentStatus,
  getAllPayments,
} = require("../../controllers/admin/paymentController");

// নিশ্চিত করুন এই লাইনটা আছে
router.get("/", getAllPayments);
// স্ট্যাটাস আপডেটের রাউট
router.put("/:id/status", updatePaymentStatus);

module.exports = router;
