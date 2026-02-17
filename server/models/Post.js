const mongoose = require('mongoose');

const SectionSchema = new mongoose.Schema({
    title: String,
    text: String,
    images: [String]
});

const AttachmentSchema = new mongoose.Schema({
    name: String,
    link: String,
    size: String
});

const PostSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    title: {
        type: String,
        required: true
    },
    year: {
        type: Number,
        required: true
    },
    date: {
        type: String,
        required: true
    },
    location: String,
    text: {
        type: String,
        required: true
    },
    featuredImage: String,
    stackImages: [String],
    sections: [SectionSchema],
    attachments: [AttachmentSchema]
}, {
    timestamps: true
});

module.exports = mongoose.model('Post', PostSchema);
