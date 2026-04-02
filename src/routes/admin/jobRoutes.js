const express = require("express");
const router = express.Router();
const {
  addJob,
  getJobs,
  getProjectsList,
  deleteJob,
  updateJob, // নতুন অ্যাড করা হলো
  getJobById, // নতুন অ্যাড করা হলো
} = require("../../controllers/admin/jobController");
const { protect } = require("../../middlewares/authMiddleware");

// ড্রপডাউন প্রজেক্ট লিস্ট
router.get("/projects-list", protect, getProjectsList);

// মেইন জব রাউট (Get all & Post new)
router.route("/").get(protect, getJobs).post(protect, addJob);

// স্পেসিফিক আইডি রাউট (Get single, Update & Delete)
router
  .route("/:id")
  .get(protect, getJobById) // এডিট পেজ ওপেন করার সময় ডাটা পাওয়ার জন্য
  .put(protect, updateJob) // এডিট সেভ করার জন্য
  .delete(protect, deleteJob); // ডিলিট করার জন্য

module.exports = router;
