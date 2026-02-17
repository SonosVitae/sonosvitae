const mongoose = require('mongoose');

const AlbumSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    title: {
        type: String,
        required: true
    },
    artist: {
        type: String,
        required: true,
        default: "Sonos Vitae"
    },
    productionDate: {
        type: String, // Keeping as string to match "October 29, 2024" format user uses
        required: true
    },
    genre: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['ALBUM', 'SINGLE', 'SOUNDTRACK', 'EP', 'OTHER'],
        default: 'ALBUM'
    },
    description: {
        type: String
    },
    coverUrl: {
        type: String,
        required: true
    },
    color: {
        type: String
    },
    bandcampId: String,
    bandcampLink: String,
    youtubeLink: String,
    spotifyLink: String,
    tidalLink: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Album', AlbumSchema);
