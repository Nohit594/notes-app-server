const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true,
        default: 'Untitled Group'
    },
    notes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Note'
    }],
    isPublic: {
        type: Boolean,
        default: false
    },
    shareCode: {
        type: String,
        unique: true,
        sparse: true // Allows null/undefined values to be non-unique
    }
}, { timestamps: true });

module.exports = mongoose.model('Group', groupSchema);
