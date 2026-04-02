const mongoose = require("mongoose");

const ProjectSchema = new mongoose.Schema({
  project_name: { type: String, required: true },
  description: { type: String },
  client_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Client", // Client কালেকশনের সাথে কানেক্টেড
    required: true,
  },
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Project", ProjectSchema);
