const User = require("../../models/User");
const Developer = require("../../models/admin/Developer");
const ErrorResponse = require("../../utils/errorResponse");

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

// @desc    Get All Developers
// @route   GET /api/admin/developers
exports.getDevelopers = async (req, res, next) => {
  try {
    const developers = await Developer.find().sort("-created_at");
    res.status(200).json({
      success: true,
      count: developers.length,
      data: developers,
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
    const developer = await Developer.findById(req.params.id).populate("user_id", "image role");
    if (!developer) return next(new ErrorResponse("Developer not found", 404));
    
    res.status(200).json({ success: true, data: developer });
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