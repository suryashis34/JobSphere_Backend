const ErrorResponse = require('../utils/errorResponse');
const Application = require('../models/Application');
const Job = require('../models/Job');
const { cloudinary } = require('../config/cloudinary');

// @desc    Apply for a job (Jobseeker)
// @route   POST /api/jobs/:jobId/apply
// @access  Private/Jobseeker
exports.applyJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.jobId);

    if (!job) {
      return next(new ErrorResponse(`No job with the id of ${req.params.jobId}`, 404));
    }

    // Check if user has already applied
    let application = await Application.findOne({
      job: req.params.jobId,
      applicant: req.user.id
    });

    if (application) {
      return next(new ErrorResponse(`You have already applied for this job`, 400));
    }

    if (!req.file) {
      return next(new ErrorResponse(`Please upload a resume`, 400));
    }

    application = await Application.create({
      job: req.params.jobId,
      applicant: req.user.id,
      resume: {
        url: req.file.path,
        public_id: req.file.filename
      }
    });

    res.status(201).json({
      success: true,
      data: application
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get applied jobs (Jobseeker)
// @route   GET /api/applications/me
// @access  Private/Jobseeker
exports.getMyApplications = async (req, res, next) => {
  try {
    const applications = await Application.find({ applicant: req.user.id })
      .populate({
        path: 'job',
        select: 'title company location salary employmentType'
      });

    res.status(200).json({
      success: true,
      count: applications.length,
      data: applications
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Cancel application (Jobseeker)
// @route   DELETE /api/applications/:id
// @access  Private/Jobseeker
exports.cancelApplication = async (req, res, next) => {
  try {
    const application = await Application.findById(req.params.id);

    if (!application) {
      return next(new ErrorResponse(`No application with the id of ${req.params.id}`, 404));
    }

    // Make sure user is application owner
    if (application.applicant.toString() !== req.user.id) {
      return next(new ErrorResponse(`Not authorized to cancel this application`, 401));
    }

    // Delete resume from cloudinary
    if (application.resume && application.resume.public_id) {
      await cloudinary.uploader.destroy(application.resume.public_id, { resource_type: 'raw' });
    }

    await application.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get applications for a job (Recruiter)
// @route   GET /api/jobs/:jobId/applications
// @access  Private/Recruiter
exports.getJobApplications = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.jobId);

    if (!job) {
      return next(new ErrorResponse(`No job with the id of ${req.params.jobId}`, 404));
    }

    // Make sure user is job owner
    if (job.postedBy.toString() !== req.user.id && req.user.role !== 'Admin') {
      return next(new ErrorResponse(`Not authorized to view these applications`, 401));
    }

    const applications = await Application.find({ job: req.params.jobId })
      .populate({
        path: 'applicant',
        select: 'name email'
      });

    res.status(200).json({
      success: true,
      count: applications.length,
      data: applications
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update application status (Recruiter)
// @route   PUT /api/applications/:id/status
// @access  Private/Recruiter
exports.updateApplicationStatus = async (req, res, next) => {
  try {
    let application = await Application.findById(req.params.id).populate('job');

    if (!application) {
      return next(new ErrorResponse(`No application with the id of ${req.params.id}`, 404));
    }

    const job = await Job.findById(application.job);

    // Make sure user is job owner
    if (job.postedBy.toString() !== req.user.id && req.user.role !== 'Admin') {
       return next(new ErrorResponse(`Not authorized to update this application`, 401));
    }

    const { status } = req.body;
    if (!['Pending', 'Accepted', 'Rejected'].includes(status)) {
       return next(new ErrorResponse(`Invalid status`, 400));
    }

    application.status = status;
    await application.save();

    res.status(200).json({
      success: true,
      data: application
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all applications (Admin)
// @route   GET /api/applications
// @access  Private/Admin
exports.getApplications = async (req, res, next) => {
  try {
    const applications = await Application.find()
      .populate({
        path: 'job',
        select: 'title company postedBy'
      })
      .populate({
        path: 'applicant',
        select: 'name email'
      });

    res.status(200).json({
      success: true,
      count: applications.length,
      data: applications
    });
  } catch (err) {
    next(err);
  }
};
