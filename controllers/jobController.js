const ErrorResponse = require('../utils/errorResponse');
const Job = require('../models/Job');

// @desc    Get all jobs
// @route   GET /api/jobs
// @access  Public
exports.getJobs = async (req, res, next) => {
  try {
    let query;
    const reqQuery = { ...req.query };

    // Fields to exclude from filtering
    const removeFields = ['select', 'sort', 'page', 'limit', 'keyword'];
    removeFields.forEach(param => delete reqQuery[param]);

    // Create query string
    let queryStr = JSON.stringify(reqQuery);
    // Create operators ($gt, $gte, etc)
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

    // Parse back to object
    let parsedQuery = JSON.parse(queryStr);

    // Only show unarchived jobs for public
    if (!req.user || req.user.role !== 'Admin') {
       parsedQuery.isArchived = false;
    }

    // Keyword search over title or company
    if (req.query.keyword) {
      parsedQuery.$or = [
        { title: { $regex: req.query.keyword, $options: 'i' } },
        { company: { $regex: req.query.keyword, $options: 'i' } }
      ];
    }

    query = Job.find(parsedQuery).populate({
      path: 'postedBy',
      select: 'name email'
    });

    // Sort
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt');
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Job.countDocuments(parsedQuery);

    query = query.skip(startIndex).limit(limit);

    const jobs = await query;

    // Pagination result
    const pagination = {};

    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }

    res.status(200).json({
      success: true,
      count: jobs.length,
      pagination,
      data: jobs
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single job
// @route   GET /api/jobs/:id
// @access  Public
exports.getJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id).populate({
      path: 'postedBy',
      select: 'name email'
    });

    if (!job) {
      return next(new ErrorResponse(`Job not found with id of ${req.params.id}`, 404));
    }

    // Only Admin can see archived jobs
    if (job.isArchived && (!req.user || req.user.role !== 'Admin')) {
       return next(new ErrorResponse(`Job not found with id of ${req.params.id}`, 404));
    }

    res.status(200).json({
      success: true,
      data: job
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new job
// @route   POST /api/jobs
// @access  Private/Recruiter
exports.createJob = async (req, res, next) => {
  try {
    // Add user to req.body
    req.body.postedBy = req.user.id;

    const job = await Job.create(req.body);

    res.status(201).json({
      success: true,
      data: job
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update job
// @route   PUT /api/jobs/:id
// @access  Private/Recruiter
exports.updateJob = async (req, res, next) => {
  try {
    let job = await Job.findById(req.params.id);

    if (!job) {
      return next(new ErrorResponse(`Job not found with id of ${req.params.id}`, 404));
    }

    // Make sure user is job owner
    if (job.postedBy.toString() !== req.user.id && req.user.role !== 'Admin') {
      return next(new ErrorResponse(`User ${req.user.id} is not authorized to update this job`, 401));
    }

    job = await Job.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: job
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete job
// @route   DELETE /api/jobs/:id
// @access  Private/Recruiter
exports.deleteJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return next(new ErrorResponse(`Job not found with id of ${req.params.id}`, 404));
    }

    // Make sure user is job owner
    if (job.postedBy.toString() !== req.user.id && req.user.role !== 'Admin') {
      return next(new ErrorResponse(`User ${req.user.id} is not authorized to delete this job`, 401));
    }

    await job.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Soft Delete (Archive) job
// @route   PUT /api/jobs/:id/archive
// @access  Private/Admin
exports.archiveJob = async (req, res, next) => {
  try {
    let job = await Job.findById(req.params.id);

    if (!job) {
      return next(new ErrorResponse(`Job not found with id of ${req.params.id}`, 404));
    }

    job.isArchived = true;
    await job.save();

    res.status(200).json({
      success: true,
      data: job
    });
  } catch (err) {
    next(err);
  }
};
