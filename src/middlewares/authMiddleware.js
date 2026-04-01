const jwt = require("jsonwebtoken");
const User = require("../models/User");
const ErrorResponse = require("../utils/errorResponse");

exports.protect = async (req, res, next) => {
  let token;

  // ১. হেডার থেকে টোকেন চেক করা
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  // ২. টোকেন না থাকলে সরাসরি আউট
  if (!token) {
    return next(new ErrorResponse("Not authorized to access this route", 401));
  }

  try {
    // ৩. টোকেন ডিকোড করা
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 🎯 ৪. বুদ্ধিমান আইডি চেক (id বা _id যেটাতেই থাকুক সে ধরে নিবে)
    const userId = decoded.id || decoded._id;

    if (!userId) {
      return next(new ErrorResponse("Invalid token structure", 401));
    }

    // ৫. ডাটাবেস থেকে ইউজার খোঁজা
    const user = await User.findById(userId);

    // ৬. যদি ইউজার না থাকে (সলিড সিকিউরিটি চেক)
    if (!user) {
      return next(
        new ErrorResponse("User belonging to this token no longer exists", 401),
      );
    }

    // ৭. রিকোয়েস্টে ইউজার ডাটা পুশ করা এবং পরের ধাপে যাওয়া
    req.user = user;
    next();
  } catch (err) {
    console.error("Auth Middleware Error:", err.message);
    return next(new ErrorResponse("Not authorized to access this route", 401));
  }
};
