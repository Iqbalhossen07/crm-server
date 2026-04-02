const express = require("express");
const {
  addClient,
  getClients,
  deleteClient,
  getSingleClient,
  updateClient,
} = require("../../controllers/admin/clientController");
const { protect } = require("../../middlewares/authMiddleware");
const { upload } = require("../../utils/cloudinary");

const router = express.Router();

// ফোল্ডার ডাইনামিক করার জন্য মিডলওয়্যার
const setFolder = (req, res, next) => {
  req.folder = "setstech/clients_profiles";
  next();
};

// ১. মেইন ক্লায়েন্ট রুট (সব ক্লায়েন্ট দেখা এবং নতুন অ্যাড করা)
// পাথ: /api/admin/clients
router
  .route("/")
  .get(protect, getClients)
  .post(protect, setFolder, upload.single("image"), addClient);

// ২. স্পেসিফিক ক্লায়েন্ট রুট (আইডি দিয়ে দেখা, আপডেট এবং ডিলিট)
// পাথ: /api/admin/clients/:id
router
  .route("/:id")
  .get(protect, getSingleClient) // এডিট পেইজে ডাটা লোড করার জন্য
  .put(protect, setFolder, upload.single("image"), updateClient) // আপডেট সেভ করার জন্য
  .delete(protect, deleteClient); // ডিলিট করার জন্য

module.exports = router;
