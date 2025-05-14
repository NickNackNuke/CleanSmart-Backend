const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true,
    minlength: 3
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 3
  }
}, {
  timestamps: true,
  collection: 'user'
});

// Drop all indexes and create only email index
userSchema.index({ email: 1 }, { unique: true });

// Generate JWT for password reset
userSchema.methods.generateResetToken = function() {
  return jwt.sign(
    { id: this._id, email: this.email },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '1h' }
  );
};

// Verify password reset token
userSchema.statics.verifyPasswordResetToken = function(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
  } catch (error) {
    return null;
  }
};

// Compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return candidatePassword === this.password;
};

userSchema.post('save', function(doc) {
  console.log('User saved:', {
    id: doc._id,
    fullName: doc.fullName,
    email: doc.email,
  });
});

userSchema.post('findOne', function(doc) {
  if (doc) {
    console.log('User found:', {
      id: doc._id,
      fullName: doc.fullName,
      email: doc.email,
    });
  } else {
    console.log('No user found');
  }
});

const User = mongoose.model('User', userSchema);

// Drop all indexes when the model is first loaded
User.collection.dropIndexes().catch(err => {
  if (err.code !== 26) { // Ignore error if collection doesn't exist
    console.error('Error dropping indexes:', err);
  }
});

module.exports = User; 