const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Note = require('../models/Note');

// @route   GET /api/notes
// @desc    Get all notes for the authenticated user
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const notes = await Note.find({ userId: req.user.userId }).sort({ updatedAt: -1 });
        res.json(notes);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/notes/:id
// @desc    Get a specific note
// @access  Private
router.get('/:id', auth, async (req, res) => {
    try {
        const note = await Note.findById(req.params.id);

        if (!note) {
            return res.status(404).json({ msg: 'Note not found' });
        }

        // Ensure user owns the note OR is admin
        if (note.userId.toString() !== req.user.userId && !req.user.isAdmin) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        res.json(note);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Note not found' });
        }
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/notes/:id/share
// @desc    Toggle public sharing of a note
// @access  Private
router.put('/:id/share', auth, async (req, res) => {
    try {
        let note = await Note.findById(req.params.id);

        if (!note) return res.status(404).json({ msg: 'Note not found' });

        // Ensure user owns note
        if (note.userId.toString() !== req.user.userId) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        // Toggle share status
        note.isPublic = !note.isPublic;
        await note.save();

        res.json(note);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/notes/public/:id
// @desc    Get a public note (No Auth Required)
// @access  Public
router.get('/public/:id', async (req, res) => {
    try {
        const note = await Note.findById(req.params.id);

        if (!note) {
            return res.status(404).json({ msg: 'Note not found' });
        }

        // Check if note is public
        if (!note.isPublic) {
            return res.status(403).json({ msg: 'This note is private' });
        }

        res.json(note);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Note not found' });
        }
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/notes
// @desc    Create a new note
// @access  Private
router.post('/', auth, async (req, res) => {
    const { title, type, content, language, tags } = req.body;

    console.log('DEBUG: Creating Note. User:', req.user); // Debug log

    try {
        const newNote = new Note({
            userId: req.user.userId, // JWT payload has userId
            title,
            type,
            content,
            language,
            tags
        });

        const note = await newNote.save();
        res.json(note);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/notes/:id
// @desc    Update a note
// @access  Private
router.put('/:id', auth, async (req, res) => {
    const { title, content, language, tags, isFavorite } = req.body;

    // Build note object
    const noteFields = {};
    if (title) noteFields.title = title;
    if (content !== undefined) noteFields.content = content;
    if (language) noteFields.language = language;
    if (tags) noteFields.tags = tags;
    if (isFavorite !== undefined) noteFields.isFavorite = isFavorite;

    try {
        let note = await Note.findById(req.params.id);

        if (!note) return res.status(404).json({ msg: 'Note not found' });

        // Ensure user owns note OR is admin
        if (note.userId.toString() !== req.user.userId && !req.user.isAdmin) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        note = await Note.findByIdAndUpdate(
            req.params.id,
            { $set: noteFields },
            { new: true }
        );

        res.json(note);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/notes/:id
// @desc    Delete a note
// @access  Private
router.delete('/:id', auth, async (req, res) => {
    try {
        const note = await Note.findById(req.params.id);

        if (!note) return res.status(404).json({ msg: 'Note not found' });

        // Ensure user owns note
        if (note.userId.toString() !== req.user.userId) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        await Note.findByIdAndDelete(req.params.id);

        res.json({ msg: 'Note removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
