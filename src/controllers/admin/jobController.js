const Job = require("../../models/admin/Job");
const Project = require("../../models/admin/Project");
const Payment = require("../../models/admin/Payment");
const DeveloperPayment = require("../../models/admin/DeveloperPayment");
const mongoose = require("mongoose");

exports.addJob = async (req, res) => {
  try {
    const {
      project_id,
      job_name,
      description,
      job_budget,
      paid_budget,
      developer_id,
      developer_budget,
      developer_paid,
      is_free,
      job_status,
      payment_status,
      start_time,
      estimate_finish_time,
    } = req.body;

    const project = await Project.findById(project_id);
    if (!project)
      return res
        .status(404)
        .json({ success: false, error: "Project not found!" });

    // ১. জব সেভ করা (Session ছাড়া)
    const job = new Job({
      project_id,
      client_id: project.client_id,
      developer_id: developer_id || null, // null চেক
      job_name,
      description,
      job_budget: Number(job_budget || 0),
      paid_budget: Number(paid_budget || 0),
      due_budget: Number(job_budget || 0) - Number(paid_budget || 0),
      developer_budget: Number(developer_budget || 0),
      developer_paid: Number(developer_paid || 0),
      developer_due:
        Number(developer_budget || 0) - Number(developer_paid || 0),
      is_free,
      job_status,
      payment_status,
      start_time,
      estimate_finish_time,
      created_by: "Admin",
    });

    const savedJob = await job.save();

    // ২. ক্লায়েন্ট পেমেন্ট হিস্টোরি
    if (Number(paid_budget) > 0) {
      await Payment.create({
        job_id: savedJob._id,
        project_id,
        client_id: project.client_id,
        paid_amount: Number(paid_budget),
        status: "completed",
      });
    }

    // ৩. ডেভেলপার পেমেন্ট হিস্টোরি
    if (Number(developer_paid) > 0 && developer_id) {
      await DeveloperPayment.create({
        developer_id,
        job_id: savedJob._id,
        paid_amount: Number(developer_paid),
        status: "completed",
      });
    }

    res
      .status(201)
      .json({
        success: true,
        message: "Job & Payments recorded successfully!",
      });
  } catch (error) {
    console.error("Job Add Error: ", error); // 🎯 টার্মিনালে এরর প্রিন্ট করবে
    res.status(500).json({ success: false, error: error.message });
  }
};


// @desc    সব জব অথবা প্রজেক্ট অনুযায়ী জব দেখা
// @route   GET /api/admin/jobs?project_id=ID
exports.getJobs = async (req, res, next) => {
    try {
        let query;
        // যদি URL-এ project_id থাকে
        if (req.query.project_id) {
            query = Job.find({ project_id: req.query.project_id });
        } else {
            // না থাকলে সব জব
            query = Job.find();
        }

        // পপুলেট করে ডাটা আনা (প্রজেক্ট ও ডেভেলপার ডিটেইলস সহ)
        const jobs = await query
            .populate('project_id', 'project_name')
            .populate('developer_id', 'name')
            .sort("-created_at");

        res.status(200).json({
            success: true,
            count: jobs.length,
            data: jobs
        });
    } catch (err) {
        next(err);
    }
};

// @desc    ড্রপডাউনের জন্য সব প্রজেক্টের লিস্ট (নাম ও ক্লায়েন্ট সহ)
// @route   GET /api/admin/jobs/projects-list
exports.getProjectsList = async (req, res, next) => {
    try {
        const projects = await Project.find()
            .select('project_name client_id')
            .populate('client_id', 'name email'); // ক্লায়েন্টের নাম ও ইমেইল সহ

        res.status(200).json({
            success: true,
            data: projects
        });
    } catch (err) {
        next(err);
    }
};