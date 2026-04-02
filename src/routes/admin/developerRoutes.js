const express = require("express");
const {
  addDeveloper,
  getDevelopers,
  deleteDeveloper,
  getSingleDeveloper,
  updateDeveloper,
} = require("../../controllers/admin/developerController");
const { protect } = require("../../middlewares/authMiddleware");
const { upload } = require("../../utils/cloudinary");

const router = express.Router();

// ডেভেলপারদের প্রোফাইল ছবির জন্য Cloudinary ফোল্ডার সেট করা
const setDevFolder = (req, res, next) => {
  req.folder = "setstech/developers_profiles";
  next();
};

// ১. ডেভেলপার রুট (Get All & Add)
router
  .route("/")
  .get(protect, getDevelopers)
  .post(protect, setDevFolder, upload.single("image"), addDeveloper);

// ২. সিঙ্গেল ডেভেলপার রুট (Get Single, Update & Delete)
router
  .route("/:id")
  .get(protect, getSingleDeveloper) // এডিট পেইজে ডাটা দেখানোর জন্য
  .put(protect, setDevFolder, upload.single("image"), updateDeveloper) // ডাটা আপডেট করার জন্য
  .delete(protect, deleteDeveloper); // ডিলিট করার জন্য

module.exports = router;
