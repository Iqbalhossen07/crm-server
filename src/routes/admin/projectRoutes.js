const express = require("express");
const {
  addProject,
  getProjects,
  deleteProject,
  getSingleProject, // 🎯 নতুন
  updateProject, // 🎯 নতুন
} = require("../../controllers/admin/projectController");
const { protect } = require("../../middlewares/authMiddleware");

const router = express.Router();

router.route("/").get(protect, getProjects).post(protect, addProject);

router
  .route("/:id")
  .get(protect, getSingleProject) // এডিট পেইজে ডাটা লোড করার জন্য
  .put(protect, updateProject) // আপডেট সেভ করার জন্য
  .delete(protect, deleteProject);

module.exports = router;
