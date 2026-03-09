const express = require('express');
const {
  getJobs,
  getJob,
  createJob,
  updateJob,
  deleteJob,
  archiveJob
} = require('../controllers/jobController');

const { applyJob, getJobApplications } = require('../controllers/applicationController');
const { upload } = require('../config/cloudinary');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

// Note: getJobs and getJob might be called without an auth token to view public jobs.
// We will use a soft protection check for those routes if needed, 
// but since the protect middleware strictly throws an error if no token, 
// we will just have the controller handle unauthenticated request cases directly 
// by relying on req.user population via an optional wrapper.
// Actually, let's create a custom 'optionalProtect' for GET routes if we need req.user for role checks.

const jwt = require('jsonwebtoken');
const User = require('../models/User');

const optionalProtect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id);
    } catch (error) {
       // if token is invalid, we don't throw error, just continue as guest
    }
  }
  next();
};

router.route('/')
  .get(optionalProtect, getJobs)
  .post(protect, authorize('Recruiter'), createJob);

router.route('/:id')
  .get(optionalProtect, getJob)
  .put(protect, authorize('Recruiter'), updateJob)
  .delete(protect, authorize('Recruiter'), deleteJob);

router.route('/:id/archive')
  .put(protect, authorize('Admin'), archiveJob);

router.route('/:jobId/apply')
  .post(protect, authorize('Jobseeker'), upload.single('resume'), applyJob);

router.route('/:jobId/applications')
  .get(protect, authorize('Recruiter', 'Admin'), getJobApplications);

module.exports = router;
