const express = require('express');
const { getUsers, getUser } = require('../controllers/userController');

const User = require('../models/User');

const router = express.Router({ mergeParams: true });

const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('Admin'));

router.route('/')
  .get(getUsers);

router.route('/:id')
  .get(getUser);

module.exports = router;
