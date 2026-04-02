const mongoose = require("mongoose");

const devPaymentSchema = new mongoose.Schema(
  {
    developer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Developer",
      required: true,
    },
    job_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    paid_amount: { type: Number, required: true },
    payment_date: { type: Date, default: Date.now },
    payment_screenshot: { type: String, default: null },
    status: { type: String, default: "completed" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("DeveloperPayment", devPaymentSchema);
