const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit phone number']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6
  },
  resumePath: {
    type: String,
    default: null
  },
  profilePhoto: {
    type: String,
    default: null
  },
  skills: {
    type: [String],
    default: []
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    default: 'Male'
  },
  location: {
    type: String,
    default: 'India'
  },
  education: [{
    degree: String,
    institution: String,
    year: String,
    percentage: String
  }],
  languages: {
    type: [String],
    default: []
  },
  preferences: {
    jobType: {
      type: String,
      default: 'Jobs, Internships'
    },
    preferredLocation: {
      type: String,
      default: 'Bangalore/Bengaluru, Mumbai, Pune'
    },
    availability: {
      type: String,
      default: '15 Days or less'
    }
  }
}, {
  timestamps: true
});

// Index for faster email lookups
userSchema.index({ email: 1 });

module.exports = mongoose.model('User', userSchema);
