const Payment = require("../../models/admin/Payment");
const Job = require("../../models/admin/Job"); // 🎯 জব মডেল ইম্পোর্ট করতে ভুলবেন না

// @desc    Update Payment Status
// @route   PUT /api/admin/payments/:id/status
exports.updatePaymentStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    const payment = await Payment.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true },
    );

    if (!payment)
      return res
        .status(404)
        .json({ success: false, error: "Payment not found" });

    res
      .status(200)
      .json({ success: true, data: payment, message: "Status updated!" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};




// @desc    Get All Payments with Stats from Jobs
// @route   GET /api/admin/payments
exports.getAllPayments = async (req, res, next) => {
  try {
    const { client_id, start_date, end_date } = req.query;

    // --- ১. পেমেন্ট লিস্টের জন্য কুয়েরি ---
    let paymentQuery = {};
    if (client_id) paymentQuery.client_id = client_id;
    if (start_date && end_date) {
      paymentQuery.createdAt = {
        $gte: new Date(start_date),
        $lte: new Date(new Date(end_date).setHours(23, 59, 59)),
      };
    }

    // পেমেন্ট ডাটা ফেচ
    const payments = await Payment.find(paymentQuery)
      .populate("client_id", "name image")
      .populate("project_id", "project_name")
      .populate("job_id", "job_name")
      .sort("-createdAt")
      .lean();

    // --- ২. স্ট্যাটস ক্যালকুলেশন (Job কালেকশন থেকে) ---
    // যদি ক্লায়েন্ট ফিল্টার থাকে তবে শুধু সেই ক্লায়েন্টের জব, নাহলে সব জব
    let jobQuery = {};
    if (client_id) jobQuery.client_id = client_id;

    const allRelevantJobs = await Job.find(jobQuery).lean();

    const stats = allRelevantJobs.reduce(
      (acc, job) => {
        // বাজেট এবং পেইড হিসেব (পেমেন্ট স্ট্যাটাস Completed হলেই তো আমরা জবে পেইড আপডেট করি)
        const budget = Number(job.job_budget || 0);
        const paid = Number(job.paid_budget || 0);
        const due = Number(job.due_budget || 0);

        acc.total += budget; // মোট কত টাকার প্রজেক্ট/জব হাতে আছে
        acc.approved += paid; // মোট কত টাকা রিসিভ হয়েছে (Approved)
        acc.pending += due; // মোট কত টাকা এখনো পাওনা (Pending)

        return acc;
      },
      { total: 0, approved: 0, pending: 0 },
    );

    // ৩. রেসপন্স পাঠানো
    res.status(200).json({
      success: true,
      count: payments.length,
      stats, // 🎯 এই স্ট্যাটস এখন সরাসরি জবস থেকে আসছে
      data: payments,
    });
  } catch (err) {
    next(err);
  }
};