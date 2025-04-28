const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
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
  },
  sessionId: {
    type: String,
    default: null
  },
  lastActive: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  collection: 'user'
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  try {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) return next();

    // Generate a salt
    const salt = await bcrypt.genSalt(10);
    
    // Hash the password along with our new salt
    const hashedPassword = await bcrypt.hash(this.password, salt);
    
    // Override the cleartext password with the hashed one
    this.password = hashedPassword;
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    // Use bcrypt to compare the provided password with the hashed password
    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    return isMatch;
  } catch (error) {
    throw error;
  }
};

// Add logging for model operations
userSchema.post('save', function(doc) {
  console.log('User saved:', {
    id: doc._id,
    username: doc.username,
    email: doc.email,
    // Don't log the password
  });
});

userSchema.post('findOne', function(doc) {
  if (doc) {
    console.log('User found:', {
      id: doc._id,
      username: doc.username,
      email: doc.email,
      // Don't log the password
    });
  } else {
    console.log('No user found');
  }
});

const User = mongoose.model('User', userSchema);

module.exports = User; 