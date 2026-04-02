const Project = require("../../models/admin/Project");
const Job = require("../../models/admin/Job");
const Payment = require("../../models/admin/Payment");
const ErrorResponse = require("../../utils/errorResponse");

// @desc    Add New Project
// @route   POST /api/admin/projects
exports.addProject = async (req, res, next) => {
  try {
    const { project_name, description, client_id } = req.body;

    if (!project_name || !client_id) {
      return next(
        new ErrorResponse("Please provide project name and client ID", 400),
      );
    }

    const project = await Project.create({
      project_name,
      description,
      client_id,
    });

    res.status(201).json({ success: true, data: project });
  } catch (err) {
    next(err);
  }
};

// @desc    Get All Projects
// @route   GET /api/admin/projects
// @desc    Get All Projects with Real-time Job Stats
// @route   GET /api/admin/projects
exports.getProjects = async (req, res, next) => {
  try {
    const { client_id } = req.query;
    let query = {};
    if (client_id) query.client_id = client_id;

    // ১. প্রজেক্টগুলো আনা
    const projects = await Project.find(query)
      .populate("client_id", "name image")
      .sort("-created_at")
      .lean(); // lean() ব্যবহার করলে ডাটা মডিফাই করা সহজ হয়

    // ২. প্রত্যেক প্রজেক্টের জন্য জবের ডাটা ক্যালকুলেট করা
    const projectsWithStats = await Promise.all(
      projects.map(async (proj) => {
        const jobs = await Job.find({ project_id: proj._id });

        let total_jobs = jobs.length;
        let pending_jobs = 0;
        let done_jobs = 0;
        let p_budget = 0;
        let p_paid = 0;
        let p_due = 0;

        jobs.forEach((job) => {
          // স্ট্যাটাস হিসাব (আপনার কন্ডিশন অনুযায়ী)
          if (job.job_status === "In Progress") pending_jobs++;
          if (job.job_status === "Completed") done_jobs++;

          // আর্থিক হিসাব
          p_budget += Number(job.job_budget || 0);
          p_paid += Number(job.paid_budget || 0);
          p_due += Number(job.due_budget || 0);
        });

        return {
          ...proj,
          total_jobs,
          pending_jobs,
          done_jobs,
          project_budget: p_budget,
          paid_budget: p_paid,
          due_budget: p_due,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: projectsWithStats.length,
      data: projectsWithStats,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete Project
// @route   DELETE /api/admin/projects/:id
exports.deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return next(new ErrorResponse("Project not found", 404));

    await project.deleteOne();

    res
      .status(200)
      .json({ success: true, message: "Project removed successfully" });
  } catch (err) {
    next(err);
  }
};


// @desc    Get Single Project
// @route   GET /api/admin/projects/:id
exports.getSingleProject = async (req, res, next) => {
  try {
    const projectId = req.params.id;

    // ১. প্রজেক্ট ডিটেইলস এবং ক্লায়েন্টের নাম আনা
    const project = await Project.findById(projectId).populate(
      "client_id",
      "name image",
    );
    if (!project) {
      return next(new ErrorResponse("Project not found", 404));
    }

    // ২. এই প্রজেক্টের সব জব (Tasks) আনা
    const jobs = await Job.find({ project_id: projectId }).sort("-created_at");

    // ৩. এই প্রজেক্টের সব পেমেন্ট হিস্টোরি আনা
    const payments = await Payment.find({ project_id: projectId })
      .populate("job_id", "job_name")
      .sort("-created_at");

    // ৪. 🎯 রিয়েল-টাইম ফিন্যান্সিয়াল সামারি (Jobs থেকে ক্যালকুলেট করা)
    let calc_total_budget = 0;
    let calc_paid_amount = 0;
    let calc_due_amount = 0;

    jobs.forEach((job) => {
      calc_total_budget += Number(job.job_budget || 0);
      calc_paid_amount += Number(job.paid_budget || 0);
      calc_due_amount += Number(job.due_budget || 0);
    });

    // ৫. ফ্রন্টএন্ডে একবারে সব ডাটা পাঠানো
    res.status(200).json({
      success: true,
      data: {
        project_info: project,
        stats: {
          calc_total_budget,
          calc_paid_amount,
          calc_due_amount,
        },
        jobs, // এইটাই Task Assignments হিসেবে ফ্রন্টএন্ডে দেখাবো
        payments, // Payment History
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update Project
// @route   PUT /api/admin/projects/:id
exports.updateProject = async (req, res, next) => {
  try {
    let project = await Project.findById(req.params.id);

    if (!project) {
      return next(new ErrorResponse("Project not found", 404));
    }

    project = await Project.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, data: project });
  } catch (err) {
    next(err);
  }
};