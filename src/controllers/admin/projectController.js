const Project = require("../../models/admin/Project");
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
exports.getProjects = async (req, res, next) => {
  try {
    const { client_id } = req.query;
    let query = {};

    if (client_id) {
      query.client_id = client_id;
    }

    // populate('client_id') দিলে ক্লায়েন্টের সব ডাটা প্রজেক্টের ভেতরে চলে আসবে
    const projects = await Project.find(query)
      .populate("client_id", "name image")
      .sort("-created_at");

    res.status(200).json({
      success: true,
      count: projects.length,
      data: projects,
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
    const project = await Project.findById(req.params.id).populate("client_id", "name");
    if (!project) {
      return next(new ErrorResponse("Project not found", 404));
    }
    res.status(200).json({ success: true, data: project });
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