const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');
const generateToken = require('../utils/generateToken');
const Joi = require('joi');

// @desc    Auth user & get token (Deprecated)
// @route   POST /auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
    res.status(400);
    throw new Error('Email/Password login is no longer supported. Please use Google Login.');
});

// @desc    Register a new user (Deprecated)
// @route   POST /auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
    res.status(400);
    throw new Error('Registration via email/password is no longer supported. Please use Google Login.');
});

// @desc    Logout user / clear cookie
// @route   POST /auth/logout
// @access  Public
const logoutUser = asyncHandler(async (req, res) => {
    // Since we are using stateless JWT, mostly frontend just clears token.
    // We can respond with a success message.
    res.json({ message: 'Logged out successfully' });
});

// @desc    Google Login
// @route   POST /auth/google
// @access  Public
const googleLogin = asyncHandler(async (req, res) => {
    const { token } = req.body;
    const { OAuth2Client } = require('google-auth-library');

    if (!token) {
        res.status(400);
        throw new Error('Google token is missing');
    }

    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

    try {
        console.log('Attempting to verify Google token...');
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: [
                process.env.GOOGLE_CLIENT_ID,
                process.env.ANDROID_CLIENT_ID
            ],
        });

        const payload = ticket.getPayload();
        console.log('Google token verified successfully for:', payload.email);

        const { name, email, sub: googleId } = payload;

        let user = await User.findOne({ $or: [{ email }, { googleId }] });

        if (user) {
            console.log('Found existing user:', user.email);
            if (!user.googleId) {
                user.googleId = googleId;
                await user.save();
            }
        } else {
            console.log('Creating new user for:', email);
            user = await User.create({
                name,
                email,
                googleId,
                password: '',
                role: 'employee',
            });
        }

        res.json({
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
            token: generateToken(user._id),
        });

    } catch (error) {
        console.error('Google Auth Error Details:', error.message);
        res.status(401);
        throw new Error('Google authentication failed: ' + error.message);
    }
});

// @desc    Get user profile
// @route   GET /auth/me
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        res.json({
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

module.exports = {
    loginUser,
    registerUser,
    logoutUser,
    getUserProfile,
    googleLogin,
};
