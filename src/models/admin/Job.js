const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    project_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    client_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },
    developer_id: { type: mongoose.Schema.Types.ObjectId, ref: "Developer" },
    job_name: { type: String, required: true },
    description: { type: String },
    created_by: { type: String, default: "Admin" },
    job_budget: { type: Number, default: 0 },
    paid_budget: { type: Number, default: 0 },
    due_budget: { type: Number, default: 0 },
    developer_budget: { type: Number, default: 0 },
    developer_paid: { type: Number, default: 0 },
    developer_due: { type: Number, default: 0 },
    is_free: { type: String, enum: ["0", "1"], default: "0" },
    payment_status: { type: String, default: "Incompleted" },
    job_status: { type: String, default: "In Progress" },
    start_time: { type: Date },
    estimate_finish_time: { type: Date },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Job", jobSchema);
