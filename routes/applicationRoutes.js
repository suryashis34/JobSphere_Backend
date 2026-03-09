const express = require('express');
const {
  getMyApplications,
  cancelApplication,
  updateApplicationStatus,
  getApplications
} = require('../controllers/applicationController');

const router = express.Router({ mergeParams: true });

const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.route('/me')
  .get(authorize('Jobseeker'), getMyApplications);

router.route('/:id')
  .delete(authorize('Jobseeker'), cancelApplication);

router.route('/:id/status')
  .put(authorize('Recruiter'), updateApplicationStatus);

// Admin routes
router.route('/')
  .get(authorize('Admin'), getApplications);

module.exports = router;
