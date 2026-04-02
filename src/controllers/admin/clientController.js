const Client = require("../../models/admin/Client");
const Project = require("../../models/admin/Project");
const Payment = require("../../models/admin/Payment");
const User = require("../../models/User");
const ErrorResponse = require("../../utils/errorResponse");
const Job = require("../../models/admin/Job");

// @desc    Create new Client and User Account
// @route   POST /api/admin/clients
// @access  Private (Admin Only)
exports.addClient = async (req, res, next) => {
  try {
    const { name, email, phone, company_name, notes } = req.body;

    // ১. চেক করা ক্লায়েন্ট অলরেডি আছে কি না
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(
        new ErrorResponse("User with this email already exists", 400),
      );
    }

    // ২. ইমেজ হ্যান্ডলিং (Cloudinary)
    let imageUrl = "";
    if (req.file) {
      imageUrl = req.file.path;
    }

    // ৩. প্রথমে User কালেকশনে একাউন্ট তৈরি করা
    // পাসওয়ার্ড হিসেবে ফোন নম্বর ব্যবহার করা হচ্ছে
    const user = await User.create({
      name,
      email,
      password: phone,
      role: "client",
      image: imageUrl,
    });

    // ৪. এবার Client কালেকশনে ডাটা সেভ করা
    const client = await Client.create({
      name,
      email,
      phone,
      company_name,
      notes,
      image: imageUrl,
      user_id: user._id, // User এর সাথে কানেক্ট করে দিলাম
    });

    res.status(201).json({
      success: true,
      message: "Client added and User account created successfully!",
      data: client,
    });
  } catch (err) {
    next(err);
  }
};


// @route   GET /api/admin/clients
// @access  Private (Admin Only)
exports.getClients = async (req, res, next) => {
  try {
    // ১. সব ক্লায়েন্ট লিস্ট আনা
    const clients = await Client.find().sort("-created_at").lean();

    // ২. প্রত্যেক ক্লায়েন্টের জন্য জব টেবিল থেকে হিসাব বের করা
    const clientsWithStats = await Promise.all(
      clients.map(async (client) => {
        // এই ক্লায়েন্টের আন্ডারে যতগুলো জব (Task) আছে সব আনা
        const jobs = await Job.find({ client_id: client._id });

        let total_bill = 0;
        let total_paid = 0;
        let total_due = 0;

        // ৩. লুপ চালিয়ে জব থেকে হিসাব বের করা
        jobs.forEach((job) => {
          total_bill += Number(job.job_budget || 0);
          total_paid += Number(job.paid_budget || 0);
          total_due += Number(job.due_budget || 0);
        });

        // ক্লায়েন্ট ডাটার সাথে হিসাবগুলো যোগ করে রিটার্ন করা
        return {
          ...client,
          total_bill,
          total_paid,
          total_due,
          total_projects_count: jobs.length, // ঐচ্ছিক: কয়টি টাস্ক আছে তাও দেখতে পারবেন
        };
      }),
    );

    res.status(200).json({
      success: true,
      count: clientsWithStats.length,
      data: clientsWithStats,
    });
  } catch (err) {
    console.error("Get Clients Error:", err);
    next(err);
  }
};



// @desc    Delete Client and associated User
// @route   DELETE /api/admin/clients/:id
// @access  Private (Admin Only)
exports.deleteClient = async (req, res, next) => {
  try {
    const client = await Client.findById(req.params.id);

    if (!client) {
      return next(new ErrorResponse("Client not found", 404));
    }

    // ১. ইউজার অ্যাকাউন্ট ডিলিট করা
    await User.findByIdAndDelete(client.user_id);

    // ২. ক্লায়েন্ট প্রোফাইল ডিলিট করা
    await client.deleteOne();

    res.status(200).json({
      success: true,
      message: "Client and associated user account deleted successfully"
    });
  } catch (err) {
    next(err);
  }
};



// @desc    Get Single Client
// @route   GET /api/admin/clients/:id
exports.getSingleClient = async (req, res, next) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return next(new ErrorResponse("Client not found", 404));
    
    res.status(200).json({ success: true, data: client });
  } catch (err) {
    next(err);
  }
};


// @desc    Get Client Overview (Details, Stats, Projects, Payments)
// @route   GET /api/admin/clients/:id/overview
// @access  Private (Admin Only)
exports.getClientOverview = async (req, res, next) => {
  try {
    const clientId = req.params.id;

    // ১. ক্লায়েন্টের বেসিক ডাটা
    const client = await Client.findById(clientId).lean();
    if (!client) return next(new ErrorResponse("Client not found", 404));

    // ২. প্রজেক্ট এবং পেমেন্ট আনা
    const rawProjects = await Project.find({ client_id: clientId })
      .sort("-created_at")
      .lean();
    const payments = await Payment.find({ client_id: clientId })
      .populate("project_id", "project_name")
      .populate("job_id", "job_name")
      .sort("-created_at");

    // ৩. 🎯 সব জব নিয়ে আসা
    const allJobs = await Job.find({ client_id: clientId });

    let total_bill = 0;
    let total_paid = 0;
    let total_due = 0;

    // ৪. ক্লায়েন্টের টোটাল হিসাব
    allJobs.forEach((job) => {
      total_bill += Number(job.job_budget || 0);
      total_paid += Number(job.paid_budget || 0);
      total_due += Number(job.due_budget || 0);
    });

    // ৫. 🎯 FIX: প্রত্যেকটা প্রজেক্টের আলাদা হিসাব বের করা
    const projectsWithStats = rawProjects.map((proj) => {
      // এই নির্দিষ্ট প্রজেক্টের জবগুলো ফিল্টার করা
      const projJobs = allJobs.filter(
        (job) => String(job.project_id) === String(proj._id),
      );

      let p_budget = 0;
      let p_paid = 0;
      let p_due = 0;

      projJobs.forEach((job) => {
        p_budget += Number(job.job_budget || 0);
        p_paid += Number(job.paid_budget || 0);
        p_due += Number(job.due_budget || 0);
      });

      return {
        ...proj,
        project_budget: p_budget,
        paid_budget: p_paid,
        due_budget: p_due,
      };
    });

    // ৬. ডাটা পাঠানো
    res.status(200).json({
      success: true,
      data: {
        client_info: client,
        stats: {
          total_bill,
          total_paid,
          total_due,
          total_projects: rawProjects.length,
        },
        projects: projectsWithStats, // 🎯 আপডেট করা প্রজেক্ট লিস্ট
        payments,
      },
    });
  } catch (err) {
    console.error("Client Overview Error:", err);
    next(err);
  }
};

// @desc    Update Client
// @route   PUT /api/admin/clients/:id
exports.updateClient = async (req, res, next) => {
  try {
    let client = await Client.findById(req.params.id);
    if (!client) return next(new ErrorResponse("Client not found", 404));

    // ১. ডাটা আপডেট অবজেক্ট
    const updateData = {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      company_name: req.body.company_name,
      notes: req.body.notes,
    };

    // ২. ইমেজ আপডেট (যদি নতুন ছবি আপলোড করে)
    if (req.file) {
      updateData.image = req.file.path;
    }

    // ৩. ক্লায়েন্ট প্রোফাইল আপডেট
    client = await Client.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    // ৪. ইউজার কালেকশনেও নাম, ইমেইল এবং ছবি আপডেট করা
    await User.findByIdAndUpdate(client.user_id, {
      name: updateData.name,
      email: updateData.email,
      image: client.image // নতুন বা পুরাতন যেটা আছে
    });

    res.status(200).json({ success: true, data: client });
  } catch (err) {
    next(err);
  }
};


