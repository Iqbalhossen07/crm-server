const mongoose = require("mongoose");

const ClientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  company_name: { type: String },
  notes: { type: String },
  image: { type: String }, // Cloudinary URL
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // User কালেকশনের সাথে লিঙ্ক করার জন্য
  },
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Client", ClientSchema);
