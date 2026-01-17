const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Note = require('../models/Note');
const auth = require('../middleware/auth');
const adminMiddleware = require('../middleware/adminMiddleware');

// Apply auth and admin middleware to all routes
router.use(auth, adminMiddleware);

// @route   GET /api/admin/users
// @desc    Get all users
router.get('/users', async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/admin/users/:id/suspend
// @desc    Toggle user suspension
router.put('/users/:id/suspend', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.isSuspended = !user.isSuspended;
        await user.save();

        res.json({ message: `User ${user.isSuspended ? 'suspended' : 'activated'}`, isSuspended: user.isSuspended });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete user and all their notes
router.delete('/users/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Prevent deleting self or other admins (optional but good practice)
        // If current user is trying to delete another admin, we might want to block it, or allow it.
        // For simplicity, let's allow admins to delete anyone, but maybe warn frontend.
        // Actually, preventing self-deletion is important.
        if (req.user.userId === user.id) {
            return res.status(400).json({ message: 'Cannot delete your own admin account.' });
        }

        // Delete all notes by this user
        await Note.deleteMany({ userId: user._id });

        // Delete the user
        await User.findByIdAndDelete(req.params.id);

        res.json({ message: 'User and their data deleted successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/admin/users/:userId/notes
// @desc    Get all notes for a specific user
router.get('/users/:userId/notes', async (req, res) => {
    try {
        const notes = await Note.find({ userId: req.params.userId }).sort({ updatedAt: -1 });
        res.json(notes);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/admin/notes/:id
// @desc    Delete any note (Admin Override)
router.delete('/notes/:id', async (req, res) => {
    try {
        const note = await Note.findByIdAndDelete(req.params.id);
        if (!note) {
            return res.status(404).json({ message: 'Note not found' });
        }
        res.json({ message: 'Note deleted by admin' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
