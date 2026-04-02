const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    job_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    project_id: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
    client_id: { type: mongoose.Schema.Types.ObjectId, ref: "Client" },
    paid_amount: { type: Number, required: true },
    payment_screenshot: { type: String, default: null },
    payment_date: { type: Date, default: Date.now },
    status: { type: String, default: "completed" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Payment", paymentSchema);
