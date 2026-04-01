const express = require("express");
const {
  register,
  login,
  updateProfile,
  getMe,
} = require("../controllers/authController");
const { protect } = require("../middlewares/authMiddleware");
const { upload } = require("../utils/cloudinary"); // আপনার সেই utils ফাইল

const router = express.Router();

router.post("/register", register);
router.post("/login", login);


router.get("/me", protect, getMe);
// প্রোফাইল আপডেট রাউট (Protect + Upload Middleware)
router.put(
  "/updateprofile",
  protect, // ১. আগে লগইন চেক
  (req, res, next) => {
    req.folder = "setstech/admin_profiles";
    next(); // এটি অবশ্যই থাকতে হবে
  },
  upload.single("image"), // ২. তারপর ইমেজ প্রসেস
  updateProfile, // ৩. শেষে কন্ট্রোলার
);

module.exports = router;
