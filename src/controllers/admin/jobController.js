const Job = require("../../models/admin/Job");
const Project = require("../../models/admin/Project");
const Payment = require("../../models/admin/Payment");
const DeveloperPayment = require("../../models/admin/DeveloperPayment");
const mongoose = require("mongoose");



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
      .populate("project_id", "project_name")
      .populate("developer_id", "name")
      .sort("-created_at");

    res.status(200).json({
      success: true,
      count: jobs.length,
      data: jobs,
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
      .select("project_name client_id")
      .populate("client_id", "name email"); // ক্লায়েন্টের নাম ও ইমেইল সহ

    res.status(200).json({
      success: true,
      data: projects,
    });
  } catch (err) {
    next(err);
  }
};

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
      start_time,
      estimate_finish_time,
    } = req.body;

    const project = await Project.findById(project_id);
    if (!project)
      return res
        .status(404)
        .json({ success: false, error: "Project not found!" });

    // 🎯 ডাইনামিক পেমেন্ট স্ট্যাটাস লজিক
    // যদি বাজেট এবং পেইড অ্যামাউন্ট সমান হয়, তবে স্ট্যাটাস Completed, নয়তো Incompleted
    const finalJobBudget = Number(job_budget || 0);
    const finalPaidBudget = Number(paid_budget || 0);
    const calculatedPaymentStatus =
      finalPaidBudget >= finalJobBudget && finalJobBudget > 0
        ? "Completed"
        : "Incompleted";

    // ১. জব সেভ করা
    const job = new Job({
      project_id,
      client_id: project.client_id,
      developer_id: developer_id || null,
      job_name,
      description,
      job_budget: finalJobBudget,
      paid_budget: finalPaidBudget,
      due_budget: finalJobBudget - finalPaidBudget,
      developer_budget: Number(developer_budget || 0),
      developer_paid: Number(developer_paid || 0),
      developer_due:
        Number(developer_budget || 0) - Number(developer_paid || 0),
      is_free,
      job_status: job_status || "In Progress",
      payment_status: calculatedPaymentStatus, // 🎯 এখানে ডাইনামিক স্ট্যাটাস বসছে
      start_time,
      estimate_finish_time,
      created_by: "Admin",
    });

    const savedJob = await job.save();

    // ২. ক্লায়েন্ট পেমেন্ট হিস্টোরি
    if (finalPaidBudget > 0) {
      await Payment.create({
        job_id: savedJob._id,
        project_id,
        client_id: project.client_id,
        paid_amount: finalPaidBudget,
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

    res.status(201).json({
      success: true,
      message: "Job & Payments recorded successfully!",
      payment_status: calculatedPaymentStatus, // রেসপন্সেও পাঠিয়ে দিলাম দেখার জন্য
    });
  } catch (error) {
    console.error("Job Add Error: ", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update Job
// @route   PUT /api/admin/jobs/:id
exports.updateJob = async (req, res) => {
  const session = await mongoose.startSession(); // ট্রানজেকশন শুরু (যাতে এক জায়গায় এরর হলে কোথাও ডাটা সেভ না হয়)
  session.startTransaction();

  try {
    const jobId = req.params.id;
    const newData = req.body;
    const oldJob = await Job.findById(jobId).session(session);

    if (!oldJob) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, error: "Job not found" });
    }

    // ১. Paid to Free Restriction
    if (oldJob.paid_budget > 0 && newData.is_free === "1") {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        error:
          "This job has existing payments. You cannot convert it to a Free Task.",
      });
    }

    // ২. ক্যালকুলেশন ভেরিয়েবল
    const updatedJobBudget =
      newData.is_free === "1" ? 0 : Number(newData.job_budget || 0);
    const updatedPaidBudget =
      newData.is_free === "1" ? 0 : Number(newData.paid_budget || 0);
    const updatedDevBudget = Number(newData.developer_budget || 0);
    const updatedDevPaid = Number(newData.developer_paid || 0);

    // ৩. ক্লায়েন্ট পেমেন্ট হিস্টোরি আপডেট (No Duplicate History - Only Update)
    // যখন আমরা জব এডিট করছি, তখন আগের পেমেন্ট রেকর্ডটা আপডেট হবে
    if (updatedPaidBudget !== oldJob.paid_budget) {
      await Payment.findOneAndUpdate(
        { job_id: jobId },
        {
          paid_amount: updatedPaidBudget,
          project_id: oldJob.project_id,
          client_id: oldJob.client_id,
        },
        { upsert: true, session }, // upsert true মানে যদি না থাকে তবে তৈরি করবে
      );
    }

    // ৪. ডেভেলপার সুইচিং এবং পেমেন্ট লজিক
    const isDevChanged =
      newData.developer_id &&
      String(oldJob.developer_id) !== String(newData.developer_id);

    if (isDevChanged) {
      // লজিক: ডেভেলপার চেঞ্জ হলে নতুন হিস্টোরি তৈরি হবে (The Handover)
      if (updatedDevPaid > 0) {
        await DeveloperPayment.create(
          [
            {
              developer_id: newData.developer_id,
              job_id: jobId,
              paid_amount: updatedDevPaid,
              status: "completed",
            },
          ],
          { session },
        );
      }
      // নোট: পুরনো ডেভেলপারের পেমেন্ট রেকর্ড ডিলিট হবে না (হিস্টোরি রাখার জন্য),
      // কিন্তু এই জবের সাথে তার বকেয়া সম্পর্ক ছিন্ন হবে।
    } else {
      // যদি ডেভেলপার একই থাকে কিন্তু বাজেট বা পেইড অ্যামাউন্ট চেঞ্জ হয়
      if (updatedDevPaid !== oldJob.developer_paid) {
        await DeveloperPayment.findOneAndUpdate(
          { job_id: jobId, developer_id: oldJob.developer_id },
          { paid_amount: updatedDevPaid },
          { upsert: true, session },
        );
      }
    }

    // ৫. জব কালেকশন আপডেট
    const calculatedPaymentStatus =
      updatedPaidBudget >= updatedJobBudget && updatedJobBudget > 0
        ? "Completed"
        : "Incompleted";

    const finalUpdate = {
      ...newData,
      job_budget: updatedJobBudget,
      paid_budget: updatedPaidBudget,
      due_budget: updatedJobBudget - updatedPaidBudget,
      developer_budget: updatedDevBudget,
      developer_paid: updatedDevPaid,
      developer_due: updatedDevBudget - updatedDevPaid,
      payment_status: calculatedPaymentStatus,
    };

    const result = await Job.findByIdAndUpdate(jobId, finalUpdate, {
      new: true,
      runValidators: true,
      session,
    });

    await session.commitTransaction(); // সব সফল হলে ডাটা সেভ হবে
    session.endSession();

    return res.status(200).json({
      success: true,
      message: "Job & Financial records updated successfully!",
      data: result,
    });
  } catch (error) {
    await session.abortTransaction(); // এরর হলে সব আগের মতো হয়ে যাবে
    session.endSession();
    console.error("Update Master Error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get Single Job (Edit পেজে ডাটা লোড করার জন্য এটি লাগবেই)
// @desc    Get Single Job (with client and developer payments)
// @route   GET /api/admin/jobs/:id
exports.getJobById = async (req, res) => {
  try {
    const jobId = req.params.id;

    // ১. জবের ডিটেইলস আনা
    const job = await Job.findById(jobId)
      .populate("project_id", "project_name")
      .populate("developer_id", "name")
    .populate("client_id", "name");

    if (!job) {
      return res.status(404).json({ success: false, error: "Job not found" });
    }

    // ২. এই জবের ক্লায়েন্ট পেমেন্ট হিস্টোরি আনা
    const clientPayments = await Payment.find({ job_id: jobId }).sort("-createdAt");

    // ৩. এই জবের ডেভেলপার পেমেন্ট হিস্টোরি আনা
    const developerPayments = await DeveloperPayment.find({ job_id: jobId }).sort("-createdAt");

    res.status(200).json({ 
      success: true, 
      data: {
        job,
        client_payments: clientPayments,
        developer_payments: developerPayments
      } 
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// deleteJob ফাংশনটি শেষে curly brace } দিয়ে ক্লোজ করতে ভুলবেন না।

// @desc    ডিলিট জব (জব এবং এর সাথে সম্পর্কিত সব পেমেন্ট রিমুভ করা হবে)
// @route   DELETE /api/admin/jobs/:id
exports.deleteJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ success: false, error: "Job not found" });
    }

    // জবের সাথে জড়িত ক্লায়েন্ট পেমেন্টগুলো ডিলিট করা
    await Payment.deleteMany({ job_id: job._id });

    // জবের সাথে জড়িত ডেভেলপার পেমেন্টগুলো ডিলিট করা
    await DeveloperPayment.deleteMany({ job_id: job._id });

    // সবশেষে জবটা ডিলিট করা
    await job.deleteOne();

    res.status(200).json({
      success: true,
      message: "Job and all associated records deleted successfully!",
    });
  } catch (error) {
    console.error("Delete Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};


