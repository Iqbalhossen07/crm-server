const mongoose = require("mongoose");

const developerSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  image: { type: String }, // Cloudinary URL
  skills: {
    type: String, // 🎯 এখন আর Array না, সরাসরি String
    default: "",
  },
  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "active",
  },
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Developer", developerSchema);
