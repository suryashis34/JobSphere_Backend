const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config();

mongoose.connect(process.env.MONGO_URI);

const seedAdmin = async () => {
  try {
    const adminExists = await User.findOne({ email: 'admin@jobsphere.com' });

    if (adminExists) {
      console.log('Admin user already exists');
      process.exit();
    }

    await User.create({
      name: 'System Admin',
      email: 'admin@jobsphere.com',
      password: process.env.ADMIN_PASSWORD,
      role: 'Admin'
    });

    console.log('Admin inserted successfully');
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seedAdmin();
