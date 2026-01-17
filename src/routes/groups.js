const express = require('express');
const router = express.Router();
const Group = require('../models/Group');
const Note = require('../models/Note');
const auth = require('../middleware/auth');

const crypto = require('crypto');

// @route   POST /api/groups/import
// @desc    Import a group using a share code
// @access  Private
router.post('/import', auth, async (req, res) => {
    const { shareCode } = req.body;

    if (!shareCode) {
        return res.status(400).json({ msg: 'Share Code is required' });
    }

    try {
        const sourceGroup = await Group.findOne({ shareCode }).populate('notes');

        if (!sourceGroup) {
            return res.status(404).json({ msg: 'Invalid Share Code' });
        }

        // Deep Clone Logic
        const newNoteIds = [];

        for (const note of sourceGroup.notes) {
            const newNote = new Note({
                userId: req.user.userId,
                title: note.title,
                type: note.type,
                content: note.content,
                language: note.language,
                tags: note.tags,
                isFavorite: false, // Reset
                isPublic: false    // Reset
            });
            const savedNote = await newNote.save();
            newNoteIds.push(savedNote._id);
        }

        const newGroup = new Group({
            userId: req.user.userId,
            title: `${sourceGroup.title} (Imported)`,
            notes: newNoteIds
        });

        await newGroup.save();
        await newGroup.populate('notes');

        res.json(newGroup);

    } catch (error) {
        console.error('Error importing group:', error);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/groups/:id/share
// @desc    Generate a Share Code for a group
// @access  Private
router.put('/:id/share', auth, async (req, res) => {
    try {
        const group = await Group.findOne({ _id: req.params.id, userId: req.user.userId });

        if (!group) {
            return res.status(404).json({ msg: 'Group not found' });
        }

        // If code exists, return it (or we could provide an option to regenerate)
        if (group.shareCode) {
            return res.json({ shareCode: group.shareCode });
        }

        // Generate a random 6-character code
        let code;
        let isUnique = false;

        while (!isUnique) {
            code = crypto.randomBytes(3).toString('hex').toUpperCase(); // 6 chars
            const existing = await Group.findOne({ shareCode: code });
            if (!existing) isUnique = true;
        }

        group.shareCode = code;
        group.isPublic = true; // Keep this for now as a flag
        await group.save();

        res.json({ shareCode: code });
    } catch (error) {
        console.error('Error generating share code:', error);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/groups
// @desc    Create a new group
// @access  Private
router.post('/', auth, async (req, res) => {
    try {
        const { title, noteIds } = req.body;

        if (!noteIds || noteIds.length < 2) {
            return res.status(400).json({ msg: 'Please select at least 2 notes.' });
        }

        // Fetch all selected notes to validate ownership and types
        const notes = await Note.find({
            _id: { $in: noteIds },
            userId: req.user.userId
        });

        if (notes.length !== noteIds.length) {
            return res.status(400).json({ msg: 'One or more selected notes are invalid.' });
        }

        // Validate Composition: Min 1 Text + 1 Code
        const hasText = notes.some(n => n.type === 'text');
        const hasCode = notes.some(n => n.type === 'code');

        if (!hasText || !hasCode) {
            return res.status(400).json({ msg: 'Group must contain at least 1 Text Note and 1 Code Note.' });
        }

        const newGroup = new Group({
            userId: req.user.userId,
            title,
            notes: noteIds
        });

        const savedGroup = await newGroup.save();

        // Populate notes for the response
        await savedGroup.populate('notes');

        res.status(201).json(savedGroup);
    } catch (error) {
        console.error('Error creating group:', error);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/groups
// @desc    Get all groups for user
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const groups = await Group.find({ userId: req.user.userId })
            .populate('notes')
            .sort({ createdAt: -1 });
        res.json(groups);
    } catch (error) {
        console.error('Error fetching groups:', error);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/groups/:id
// @desc    Delete a group
// @access  Private
router.delete('/:id', auth, async (req, res) => {
    try {
        const group = await Group.findOne({ _id: req.params.id, userId: req.user.userId });

        if (!group) {
            return res.status(404).json({ msg: 'Group not found' });
        }

        await group.deleteOne();
        res.json({ msg: 'Group removed' });
    } catch (error) {
        console.error('Error deleting group:', error);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
