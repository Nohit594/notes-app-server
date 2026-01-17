const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const router = express.Router();

// Register User
router.get('/register', (req, res) => {
    res.json({ msg: 'This is the Register endpoint. Please use POST request with username, email, and password.' });
});

router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    try {
        // Check if user exists
        let user = await User.findOne({ $or: [{ email }, { username }] });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create new user
        user = new User({
            username,
            email,
            password
        });

        await user.save();

        // Create JWT payload
        const payload = {
            userId: user._id,
            username: user.username,
            isAdmin: user.isAdmin
        };

        // Sign Token
        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '7d' },
            (err, token) => {
                if (err) throw err;
                res.status(201).json({
                    token,
                    user: {
                        id: user._id,
                        username: user.username,
                        email: user.email,
                        isAdmin: user.isAdmin
                    }
                });
            }
        );

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Login User
router.get('/login', (req, res) => {
    res.json({ msg: 'This is the Login endpoint. Please use POST request with email and password.' });
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Check for user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid Credentials' });
        }

        // Check if suspended
        if (user.isSuspended) {
            return res.status(403).json({ message: 'Account Suspended. Please contact support.' });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid Credentials' });
        }

        // Return JWT
        const payload = {
            userId: user._id,
            username: user.username,
            isAdmin: user.isAdmin
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '7d' },
            (err, token) => {
                if (err) throw err;
                res.json({
                    token,
                    user: {
                        id: user._id,
                        username: user.username,
                        email: user.email,
                        isAdmin: user.isAdmin
                    }
                });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Google Auth Route (Sync)
router.post('/google', async (req, res) => {
    const { email, username, auth0Id, picture } = req.body;

    try {
        let user = await User.findOne({ email });

        if (user) {
            // User exists - Update auth0Id if missing
            if (!user.auth0Id) {
                user.auth0Id = auth0Id;
                await user.save();
            }

            // Check if suspended
            if (user.isSuspended) {
                return res.status(403).json({ message: 'Account Suspended' });
            }
        } else {
            // Create new Google User
            user = new User({
                username, // Auth0 name or part of email
                email,
                auth0Id,
                password: crypto.randomBytes(16).toString('hex') // Random dummy password
            });
            await user.save();
        }

        // Generate Internal JWT
        const payload = {
            userId: user._id,
            username: user.username,
            isAdmin: user.isAdmin
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '7d' },
            (err, token) => {
                if (err) throw err;
                res.json({
                    token,
                    user: {
                        id: user._id,
                        username: user.username,
                        email: user.email,
                        isAdmin: user.isAdmin
                    }
                });
            }
        );

    } catch (err) {
        console.error('Google Auth Error:', err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
