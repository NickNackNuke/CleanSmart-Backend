const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { sendPasswordResetEmail } = require('../services/emailService');

// Signup Controller
exports.signup = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;
    console.log('Signup attempt:', { fullName, email });

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('User already exists:', { email });
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create new user
    const user = await User.create({
      fullName,
      email,
      password
    });

    console.log('User created successfully:', { id: user._id, fullName: user.fullName, email: user.email });

    res.status(201).json({
      success: true,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Login Controller
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt for:', email);

    const user = await User.findOne({ email });

    if (!user) {
      console.log('No user found with email:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log('Password mismatch for user:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Logout Controller
exports.logout = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Forgot Password Controller
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    console.log('Forgot password request for:', email);

    const user = await User.findOne({ email });
    if (!user) {
      // For security, always return success even if user doesn't exist
      return res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a reset link has been sent.'
      });
    }

    // Generate reset token
    const resetToken = user.generateResetToken();

    // Send reset email
    await sendPasswordResetEmail(email, resetToken);

    res.status(200).json({
      success: true,
      message: 'If an account with that email exists, a reset link has been sent.'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing password reset request'
    });
  }
};

// Reset Password Controller
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.query;
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password is required'
      });
    }

    // Verify the JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    if (!decoded) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Find user by ID from token
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting password'
    });
  }
};

// Change Password Controller (for logged-in users)
exports.changePassword = async (req, res) => {
  try {
    const { email, oldPassword, newPassword } = req.body;
    console.log('Password change attempt for:', email);

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify old password
    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    console.log('Password changed successfully for user:', email);

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error changing password'
    });
  }
};

// Get Reset Password Page
exports.getResetPasswordPage = async (req, res) => {
  try {
    const { token } = req.query;

    // Verify the JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    if (!decoded) {
      return res.status(400).send(`
        <html>
          <head>
            <title>Invalid Reset Link</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
              .error { color: red; }
            </style>
          </head>
          <body>
            <h1 class="error">Invalid Reset Link</h1>
            <p>The password reset link is invalid or has expired.</p>
          </body>
        </html>
      `);
    }

    // Return the reset password form
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Reset Password</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background-color: #f5f5f5;
            }
            .container {
              background: white;
              padding: 30px;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
              width: 100%;
              max-width: 400px;
            }
            h1 {
              text-align: center;
              color: #333;
              margin-bottom: 30px;
            }
            .form-group {
              margin-bottom: 20px;
            }
            label {
              display: block;
              margin-bottom: 5px;
              color: #666;
            }
            input {
              width: 100%;
              padding: 10px;
              border: 1px solid #ddd;
              border-radius: 4px;
              box-sizing: border-box;
            }
            button {
              width: 100%;
              padding: 12px;
              background-color: #007bff;
              color: white;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              font-size: 16px;
            }
            button:hover {
              background-color: #0056b3;
            }
            .message {
              margin-top: 20px;
              padding: 10px;
              border-radius: 4px;
              display: none;
            }
            .success {
              background-color: #d4edda;
              color: #155724;
            }
            .error {
              background-color: #f8d7da;
              color: #721c24;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Reset Password</h1>
            <form id="resetForm">
              <div class="form-group">
                <label for="newPassword">New Password</label>
                <input type="password" id="newPassword" name="newPassword" required>
              </div>
              <div class="form-group">
                <label for="confirmPassword">Confirm Password</label>
                <input type="password" id="confirmPassword" name="confirmPassword" required>
              </div>
              <button type="submit">Reset Password</button>
            </form>
            <div id="message" class="message"></div>
          </div>

          <script>
            document.getElementById('resetForm').addEventListener('submit', async (e) => {
              e.preventDefault();
              
              const newPassword = document.getElementById('newPassword').value;
              const confirmPassword = document.getElementById('confirmPassword').value;
              const messageDiv = document.getElementById('message');
              
              if (newPassword !== confirmPassword) {
                messageDiv.textContent = 'Passwords do not match';
                messageDiv.className = 'message error';
                messageDiv.style.display = 'block';
                return;
              }

              try {
                const response = await fetch(window.location.href, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ newPassword })
                });

                const data = await response.json();
                
                messageDiv.textContent = data.message;
                messageDiv.className = 'message ' + (data.success ? 'success' : 'error');
                messageDiv.style.display = 'block';

                if (data.success) {
                  // Redirect to Android app after 2 seconds
                  setTimeout(() => {
                    window.location.href = 'cleansmart://login';
                  }, 2000);
                }
              } catch (error) {
                messageDiv.textContent = 'Error resetting password';
                messageDiv.className = 'message error';
                messageDiv.style.display = 'block';
              }
            });
          </script>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).send(`
      <html>
        <head>
          <title>Error</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .error { color: red; }
          </style>
        </head>
        <body>
          <h1 class="error">Error</h1>
          <p>An error occurred while processing your request.</p>
        </body>
      </html>
    `);
  }
}; 