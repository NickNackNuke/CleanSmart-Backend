const mongoose = require('mongoose');
// const bcrypt = require('bcryptjs'); // No longer needed

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

// REMOVE password hashing middleware
// userSchema.pre('save', async function(next) {
//   try {
//     if (!this.isModified('password')) return next();
//     const salt = await bcrypt.genSalt(10);
//     this.password = await bcrypt.hash(this.password, salt);
//     next();
//   } catch (error) {
//     next(error);
//   }
// });

// Plain text password comparison
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