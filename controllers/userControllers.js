import User from '../models/user.model.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken'; // ✅ Added
import nodemailer from 'nodemailer'; // ✅ Added
import { generateToken} from '../middleware/auth.js'; // ✅ Import secretKey too
import {secretKey} from '../middleware/config.js'; // ✅ New import for secret key
import validator from "validator";

const registerUser = async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).send({ message: 'All fields are required' });
  }
if (!validator.isStrongPassword(password)) {
  return res.status(400).json({ message: "Password is too weak" });
}
  try {
    const hash = await bcrypt.hash(password, 10);
    await User.create({ username, email, password: hash });
    res.status(201).send({ message: 'User registered successfully' });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: 'An error occurred!!' });
  }
};

const loginUser = async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).send({ message: 'User not found' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).send({ message: 'Invalid login credentials' });
    }

    const payload = { userId: user._id };
    const token = generateToken(payload);

    // ✅ Updated cookie settings for cross-domain
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // true in production
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 6 * 60 * 60 * 1000 // 6 hours
    });

    res.status(200).json({ message: 'Login successful' });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: 'An error occurred while logging in' });
  }
};

const logoutUser = (req, res) => {
  try {
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    });
    res.status(200).json({ message: 'Logout successful' });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: 'An error occurred while logging out' });
  }
}

const getUsers = async (req, res) => {
  try {
    const users = await User.find({});
    res.json(users);
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: 'An error occurred!!' });
  }
};

// ✅ FIXED: Request password reset
// const requestPasswordReset = async (req, res) => {
//   const { email } = req.body;

//   try {
//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(404).json({ message: "User doesn't exist" });
//     }

//     // Create a secret using secretKey + user's current password hash
//     // This ensures token becomes invalid when password changes
//     const secret = secretKey + user.password;
//     const token = jwt.sign(
//       { id: user._id, email: user.email },
//       secret,
//       { expiresIn: '1h' }
//     );

//     // ✅ Update this URL to match your frontend
//     const resetURL = `${process.env.FRONTEND_URL}/reset-password?id=${user._id}&token=${token}`;

//     const transporter = nodemailer.createTransport({
//       service: 'gmail',
//       auth: {
//         user: process.env.EMAIL_USER, // Your email
//         pass: process.env.EMAIL_PASS, // ⚠️ Use Gmail App Password, not regular password
//       },
//     });

//     const mailOptions = {
//       to: user.email,
//       from: process.env.EMAIL_USER,
//       subject: 'Password Reset Request',
//       text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n
//       Please click on the following link, or paste this into your browser to complete the process:\n\n
//       ${resetURL}\n\n
//       If you did not request this, please ignore this email and your password will remain unchanged.\n`,
//     };

//     await transporter.sendMail(mailOptions);

//     res.status(200).json({ message: 'Password reset link sent to your email' });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Something went wrong', error: error.message });
//   }
// };



const requestPasswordReset = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User doesn't exist" });
    }

    const secret = secretKey + user.password;
    const token = jwt.sign(
      { id: user._id, email: user.email },
      secret,
      { expiresIn: '1h' }
    );

    const resetURL = `${process.env.FRONTEND_URL}/reset-password?id=${user._id}&token=${token}`;

    // ✅ Add these settings for better Gmail compatibility
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // App Password here
      },
      tls: {
        rejectUnauthorized: false // Add this for some hosting environments
      }
    });

    const mailOptions = {
      to: user.email,
      from: process.env.EMAIL_USER,
      subject: 'Password Reset Request',
      html: `
        <h3>Password Reset Request</h3>
        <p>You are receiving this because you (or someone else) have requested to reset your password.</p>
        <p>Please click on the following link to complete the process:</p>
        <a href="${resetURL}" style="padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0;">Reset Password</a>
        <p>Or copy and paste this link in your browser:</p>
        <p>${resetURL}</p>
        <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
        <p><strong>This link will expire in 1 hour.</strong></p>
      `,
    };

    // ✅ Add timeout and better error handling
    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'Password reset link sent to your email' });
  } catch (error) {
    console.error('❌ Email Error:', error); // Better logging
    res.status(500).json({ 
      message: 'Failed to send email', 
      error: error.message 
    });
  }
};

// ✅ FIXED: Reset password
const resetPassword = async (req, res) => {
  const { id, token } = req.query; // ✅ Get from query params (from URL)
  const { password } = req.body; // ✅ Get new password from request body

if (!validator.isStrongPassword(password)) {
  return res.status(400).json({ message: "Password is too weak" });
}

  try {
    // Validate inputs
    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    if (!id || !token) {
      return res.status(400).json({ message: 'Invalid reset link' });
    }

    // Find the user
    const user = await User.findOne({ _id: id });
    if (!user) {
      return res.status(400).json({ message: 'User does not exist!' });
    }

    // Verify token using the same secret (secretKey + old password hash)
    const secret = secretKey + user.password;

    try {
      jwt.verify(token, secret);
    } catch (err) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    // Hash the new password
    const encryptedPassword = await bcrypt.hash(password, 10);

    // Update user's password
    await User.updateOne(
      { _id: id },
      { $set: { password: encryptedPassword } }
    );

    res.status(200).json({ message: 'Password has been reset successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong', error: error.message });
  }
};


export const userControllers = {
  registerUser,
  loginUser,
  logoutUser,
  getUsers,
  requestPasswordReset,
  resetPassword,
};