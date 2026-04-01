const User = require("../models/User");
const ErrorResponse = require("../utils/errorResponse");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // ১. ইউজার তৈরি করা (image ফিল্ড এখানে দিচ্ছি না, তাই ডিফল্ট null হবে)
    const user = await User.create({
      name,
      email,
      password,
      role,
    });

    // ২. সাকসেস রেসপন্স
    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        image: user.image, // এটি null আসবে
      },
    });
  } catch (err) {
    next(err); // গ্লোবাল এরর হ্যান্ডলারে পাঠিয়ে দিবে
  }
};


exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // ১. ইমেইল ও পাসওয়ার্ড চেক
    if (!email || !password) {
      return next(
        new ErrorResponse("Please provide an email and password", 400),
      );
    }

    // ২. ইউজার খোঁজা
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return next(new ErrorResponse("Invalid credentials", 401));
    }

    // ৩. 🔴 রোল চেক (শুধুমাত্র অ্যাডমিন লগইন করতে পারবে)
    if (user.role !== "admin") {
      return next(
        new ErrorResponse("Access Denied: Only admins can log in here", 403),
      );
    }

    // ৪. পাসওয়ার্ড ম্যাচ করা
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return next(new ErrorResponse("Invalid credentials", 401));
    }

    // ৫. টোকেন তৈরি
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      {
        expiresIn: "30d",
      },
    );

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
};