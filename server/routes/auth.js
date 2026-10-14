const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { extractSkillsFromResume } = require('../utils/resumeParser');
const User = require('../models/User');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Middleware to verify JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token.' });
    }
    req.user = user;
    next();
  });
}

// Register with resume upload
router.post('/register', upload.single('resume'), async (req, res) => {
  try {
    const { name, email, phone, password, confirmPassword } = req.body;
    
    if (!name || !email || !phone || !password || !confirmPassword) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    // Validate phone number (10 digits)
    if (!/^[0-9]{10}$/.test(phone)) {
      return res.status(400).json({ error: 'Phone number must be 10 digits' });
    }
    
    // Check password confirmation
    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }
    
    // Check password length
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Extract skills from resume if uploaded
    let skills = [];
    let resumePath = null;
    
    if (req.file) {
      resumePath = req.file.path;
      skills = await extractSkillsFromResume(resumePath);
    }
    
    // Create new user
    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      phone,
      password: hashedPassword,
      resumePath,
      skills
    });
    
    // Generate token
    const token = jwt.sign(
      { id: newUser._id, email: newUser.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        skills: newUser.skills
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ error: 'User already exists' });
    }
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        skills: user.skills
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      gender: user.gender,
      location: user.location,
      skills: user.skills,
      education: user.education,
      languages: user.languages,
      preferences: user.preferences,
      profilePhoto: user.profilePhoto,
      resumePath: user.resumePath,
      createdAt: user.createdAt
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, upload.fields([
  { name: 'profilePhoto', maxCount: 1 },
  { name: 'resume', maxCount: 1 }
]), async (req, res) => {
  try {
    const { name, phone, skills, gender, location, education, languages, preferences } = req.body;
    const userId = req.user.id;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Update basic fields
    if (name) user.name = name;
    if (gender) user.gender = gender;
    if (location) user.location = location;
    
    if (phone) {
      if (!/^[0-9]{10}$/.test(phone)) {
        return res.status(400).json({ error: 'Phone number must be 10 digits' });
      }
      user.phone = phone;
    }
    
    // Update skills (expects JSON string or array)
    if (skills) {
      user.skills = typeof skills === 'string' ? JSON.parse(skills) : skills;
    }
    
    // Update education (expects JSON string or array)
    if (education) {
      user.education = typeof education === 'string' ? JSON.parse(education) : education;
    }
    
    // Update languages (expects JSON string or array)
    if (languages) {
      user.languages = typeof languages === 'string' ? JSON.parse(languages) : languages;
    }
    
    // Update preferences (expects JSON object or string)
    if (preferences) {
      user.preferences = typeof preferences === 'string' ? JSON.parse(preferences) : preferences;
    }
    
    // Update profile photo if uploaded
    if (req.files && req.files.profilePhoto) {
      // Delete old photo if exists
      if (user.profilePhoto && fs.existsSync(user.profilePhoto)) {
        try {
          fs.unlinkSync(user.profilePhoto);
        } catch (err) {
          console.log('Could not delete old photo:', err);
        }
      }
      user.profilePhoto = req.files.profilePhoto[0].path;
    }
    
    // Update resume if uploaded and extract skills
    if (req.files && req.files.resume) {
      // Delete old resume if exists
      if (user.resumePath && fs.existsSync(user.resumePath)) {
        try {
          fs.unlinkSync(user.resumePath);
        } catch (err) {
          console.log('Could not delete old resume:', err);
        }
      }
      user.resumePath = req.files.resume[0].path;
      
      // Extract new skills from resume
      try {
        const extractedSkills = await extractSkillsFromResume(user.resumePath);
        if (extractedSkills && extractedSkills.length > 0) {
          user.skills = [...new Set([...user.skills, ...extractedSkills])];
        }
      } catch (err) {
        console.log('Could not extract skills:', err);
      }
    }
    
    await user.save();
    
    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        gender: user.gender,
        location: user.location,
        skills: user.skills,
        education: user.education,
        languages: user.languages,
        preferences: user.preferences,
        profilePhoto: user.profilePhoto,
        resumePath: user.resumePath,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

module.exports = router;
