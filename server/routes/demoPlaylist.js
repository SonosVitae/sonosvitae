const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

const configPath = path.join(__dirname, '../config/demoPlaylist.json');

// Ensure file exists
if (!fs.existsSync(configPath)) {
    // Write an empty array initially if it does not exist
    if (!fs.existsSync(path.dirname(configPath))) {
        fs.mkdirSync(path.dirname(configPath), { recursive: true });
    }
    fs.writeFileSync(configPath, JSON.stringify([]), 'utf-8');
}

// @route   GET api/demo-playlist
// @desc    Get playlist tracks
// @access  Public
router.get('/', (req, res) => {
    try {
        const data = fs.readFileSync(configPath, 'utf-8');
        res.setHeader('Content-Type', 'application/json');
        res.send(data);
    } catch (err) {
        console.error("Error reading playlist:", err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   POST api/demo-playlist
// @desc    Update playlist tracks array
// @access  Private (Needs admin auth realistically, but following existing patterns)
router.post('/', express.json(), (req, res) => {
    try {
        // req.body should be an array of tracks: [{ id, title, url }]
        fs.writeFileSync(configPath, JSON.stringify(req.body, null, 2), 'utf-8');
        res.json({ msg: 'Playlist updated successfully' });
    } catch (err) {
        console.error("Error writing playlist:", err);
        res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;
