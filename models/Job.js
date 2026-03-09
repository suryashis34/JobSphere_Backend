const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a job title'],
    trim: true,
    maxlength: [100, 'Title can not be more than 100 characters']
  },
  company: {
    type: String,
    required: [true, 'Please add a company name'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Please add a category'],
    trim: true
  },
  employmentType: {
    type: String,
    enum: ['Full Time', 'Part Time', 'Internship'],
    required: [true, 'Please add employment type']
  },
  location: {
    type: String,
    required: [true, 'Please add a location']
  },
  salary: {
    type: Number,
    required: [true, 'Please add an annual salary']
  },
  description: {
    type: String,
    required: false
  },
  postedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  isArchived: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Job', jobSchema);
