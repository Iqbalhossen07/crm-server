const Client = require("../../models/admin/Client");
const User = require("../../models/User");
const ErrorResponse = require("../../utils/errorResponse");

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

// @desc    Get All Clients
// @route   GET /api/admin/clients
// @access  Private (Admin Only)
exports.getClients = async (req, res, next) => {
  try {
    const clients = await Client.find().sort("-created_at");
    res
      .status(200)
      .json({ success: true, count: clients.length, data: clients });
  } catch (err) {
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