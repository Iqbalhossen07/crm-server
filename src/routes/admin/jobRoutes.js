const express = require("express");
const router = express.Router();
const {
  addJob,
  getJobs,
  getProjectsList,
} = require("../../controllers/admin/jobController");
const { protect } = require("../../middlewares/authMiddleware");

// ১. ড্রপডাউনের জন্য প্রজেক্ট লিস্ট (এটি উপরে রাখা হয়েছে যাতে সার্চ ফিল্টার কাজ করে)
// GET: /api/admin/jobs/projects-list
router.get("/projects-list", protect, getProjectsList);

// ২. মেইন জব রাউট (সব জব দেখা এবং নতুন জব অ্যাড করা)
// GET: /api/admin/jobs (সব জব অথবা ?project_id=ID দিয়ে ফিল্টার)
// POST: /api/admin/jobs (নতুন জব অ্যাড)
router.route("/").get(protect, getJobs).post(protect, addJob);

module.exports = router;
