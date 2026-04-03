const User = require("../../models/User");
const Developer = require("../../models/admin/Developer");
const ErrorResponse = require("../../utils/errorResponse");
const Job = require("../../models/admin/Job");
const DeveloperPayment = require("../../models/admin/DeveloperPayment");

// @desc    Add New Developer
// @route   POST /api/admin/developers
// @desc    Add New Developer
// @route   POST /api/admin/developers
exports.addDeveloper = async (req, res, next) => {
  try {
    const { name, email, phone, skills } = req.body;

    // ১. ইমেইল চেক
    const userExists = await User.findOne({ email });
    if (userExists) {
      return next(new ErrorResponse("User with this email already exists", 400));
    }

    // ২. ইমেজ হ্যান্ডলিং
    let imageUrl = "";
    if (req.file) {
      imageUrl = req.file.path;
    }

    // ৩. User কালেকশনে ডাটা সেভ
    const user = await User.create({
      name,
      email,
      phone,
      password: phone, // ফোন নম্বর পাসওয়ার্ড
      image: imageUrl,
      role: "developer",
    });

    // ৪. Developer কালেকশনে ডাটা সেভ
    const developer = await Developer.create({
      user_id: user._id,
      name,
      email,
      phone,
      image: imageUrl,
      skills: skills || "", // 🎯 সরাসরি String হিসেবে সেভ হচ্ছে
      status: "active",
    });

    res.status(201).json({
      success: true,
      message: "Developer added successfully",
      data: developer,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get All Developers with Task & Payment Stats
// @route   GET /api/admin/developers
exports.getDevelopers = async (req, res, next) => {
  try {
    // ১. সব ডেভেলপার আনা
    const developers = await Developer.find().sort("-created_at").lean();

    // ২. প্রতিটি ডেভেলপারের জন্য জবের ডাটা ক্যালকুলেট করা
    const developersWithStats = await Promise.all(
      developers.map(async (dev) => {
        const stats = await Job.aggregate([
          { $match: { developer_id: dev._id } },
          {
            $group: {
              _id: null,
              totalTasks: { $sum: 1 },
              totalEarned: { $sum: "$developer_budget" },
              totalPaid: { $sum: "$developer_paid" },
              totalDue: { $sum: "$developer_due" },
            },
          },
        ]);

        return {
          ...dev,
          stats: stats[0] || {
            totalTasks: 0,
            totalEarned: 0,
            totalPaid: 0,
            totalDue: 0,
          },
        };
      })
    );

    res.status(200).json({
      success: true,
      count: developersWithStats.length,
      data: developersWithStats,
    });
  } catch (err) {
    next(err);
  }
};


// @desc    Delete Developer and User Account
// @route   DELETE /api/admin/developers/:id
exports.deleteDeveloper = async (req, res, next) => {
    try {
        const developer = await Developer.findById(req.params.id);

        if (!developer) {
            return next(new ErrorResponse("Developer not found", 404));
        }

        // ১. ইউজার অ্যাকাউন্ট ডিলিট করা
        await User.findByIdAndDelete(developer.user_id);

        // ২. ডেভেলপার প্রোফাইল ডিলিট করা
        await developer.deleteOne();

        res.status(200).json({
            success: true,
            message: "Developer and associated user account deleted successfully"
        });
    } catch (err) {
        next(err);
    }
};



// @desc    Get Single Developer
// @route   GET /api/admin/developers/:id
exports.getSingleDeveloper = async (req, res, next) => {
  try {
    const devId = req.params.id;

    // ১. ডেভেলপারের বেসিক ইনফো
    const developer = await Developer.findById(devId).lean();
    if (!developer)
      return res
        .status(404)
        .json({ success: false, error: "Developer not found" });

    // ২. ডেভেলপারের সব জব (Project নাম সহ)
    const jobs = await Job.find({ developer_id: devId })
      .populate("project_id", "project_name")
      .sort("-createdAt")
      .lean();

    // ৩. পেমেন্ট হিস্টোরি (Job নাম সহ)
    const payments = await DeveloperPayment.find({ developer_id: devId })
      .populate("job_id", "job_name")
      .sort("-createdAt")
      .lean();

    // ৪. স্ট্যাটস ক্যালকুলেশন
    const stats = jobs.reduce(
      (acc, job) => {
        acc.total_tasks += 1;
        acc.total_budget += Number(job.developer_budget || 0);
        acc.total_paid += Number(job.developer_paid || 0);
        acc.total_due += Number(job.developer_due || 0);
        return acc;
      },
      { total_tasks: 0, total_budget: 0, total_paid: 0, total_due: 0 },
    );

    res.status(200).json({
      success: true,
      data: {
        developer,
        stats,
        jobs,
        payments,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update Developer
// @route   PUT /api/admin/developers/:id
exports.updateDeveloper = async (req, res, next) => {
  try {
    let developer = await Developer.findById(req.params.id);
    if (!developer) return next(new ErrorResponse("Developer not found", 404));

    const { name, email, phone, skills, status } = req.body;

    // ১. ইমেজ আপডেট লজিক
    let imageUrl = developer.image;
    if (req.file) {
      imageUrl = req.file.path;
    }

    // ২. Developer কালেকশন আপডেট
    developer = await Developer.findByIdAndUpdate(req.params.id, {
      name, email, phone, skills, status, image: imageUrl
    }, { new: true, runValidators: true });

    // ৩. User কালেকশনেও নাম, ইমেইল এবং ছবি আপডেট (যদি ক্রেডেনশিয়াল চেঞ্জ হয়)
    await User.findByIdAndUpdate(developer.user_id, {
      name, email, image: imageUrl
    });

    res.status(200).json({ success: true, data: developer });
  } catch (err) {
    next(err);
  }
};