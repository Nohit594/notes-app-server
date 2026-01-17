const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        default: 'Untitled Note'
    },
    type: {
        type: String,
        enum: ['text', 'code', 'drawing'],
        required: true
    },
    content: {
        // Can be text string, code string, or drawing JSON/Base64
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    language: {
        type: String, // Only for 'code' type
        default: null
    },
    tags: [{
        type: String,
        trim: true
    }],
    isFavorite: {
        type: Boolean,
        default: false
    },
    isPublic: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = mongoose.model('Note', noteSchema);
