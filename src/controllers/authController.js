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


// @desc    Update User Profile
// @route   PUT /api/auth/updateprofile
// @access  Private

// @desc    Get Current Logged in User Data
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    // req.user আসবে আমাদের 'protect' মিডলওয়্যার থেকে
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    next(err);
  }
};


exports.updateProfile = async (req, res, next) => {
  try {
    // ১. ইউজার খুঁজে বের করা
    const user = await User.findById(req.user.id).select("+password");

    if (!user) {
      // এখানে next না দিয়ে সরাসরি রেসপন্স দিলে 'next is not a function' এরর আসবে না
      return res.status(404).json({ success: false, error: "User not found" });
    }

    // ২. ডাটা আপডেট (যদি বডিতে থাকে তবেই আপডেট হবে)
    if (req.body.name) user.name = req.body.name;
    if (req.body.email) user.email = req.body.email;

    // ৩. ইমেজ আপডেট
    if (req.file) {
      user.image = req.file.path;
    }

    // ৪. পাসওয়ার্ড আপডেট লজিক (নিখুঁত হ্যান্ডলিং)
    // ইউজার যদি নতুন পাসওয়ার্ড ফিল্ডে কিছু লিখে তবেই এটি কাজ করবে
    if (req.body.newPassword && req.body.newPassword.trim() !== "") {
      if (!req.body.oldPassword) {
        return res.status(400).json({
          success: false,
          error: "Current password is required to set a new one",
        });
      }

      const isMatch = await bcrypt.compare(req.body.oldPassword, user.password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          error: "Current password is incorrect",
        });
      }

      user.password = req.body.newPassword;
    }

    // ৫. সেভ করা (কোনো ডাটা চেঞ্জ না করলেও এটি কাজ করবে)
    await user.save();

    // ৬. সাকসেস রেসপন্স
    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        image: user.image,
      },
    });
  } catch (err) {
    console.error("Update Profile Error:", err);
    // যদি next কাজ না করে, তবে সরাসরি এরর রেসপন্স পাঠিয়ে দিন
    if (typeof next !== "function") {
      return res.status(500).json({ success: false, error: err.message });
    }
    next(err);
  }
};