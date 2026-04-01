const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please add a name"],
  },
  email: {
    type: String,
    required: [true, "Please add an email"],
    unique: true, // একই ইমেইল দিয়ে দুইবার একাউন্ট খোলা যাবে না
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      "Please add a valid email",
    ],
  },
  password: {
    type: String,
    required: [true, "Please add a password"],
    minlength: 6,
    select: false, // সিকিউরিটির জন্য পাসওয়ার্ড অটোমেটিক আসবে না
  },
  role: {
    type: String,
    enum: ["admin", "developer", "client"],
    default: "client",
  },
  image: {
    type: String,
    default: null, // রেজিস্ট্রেশনের সময় এটি খালি বা নাল থাকবে
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// পাসওয়ার্ড সেভ করার আগে এনক্রিপ্ট করার মিডলওয়্যার
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

module.exports = mongoose.model("User", UserSchema);
