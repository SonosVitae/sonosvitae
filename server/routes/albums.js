const express = require('express');
const router = express.Router();
const Album = require('../models/Album');

// @route   GET api/albums
// @desc    Get all albums
// @access  Public
router.get('/', async (req, res) => {
    try {
        const albums = await Album.find();


        // Helper to safely parse dates (handles "October 24, 2024", "24.10.2024", "2024")
        const parseDate = (dateStr) => {
            if (!dateStr) return new Date(0); // Treat empty as very old

            // 1. Try standard Date parse first (Handles "October 24, 2024", "2024-10-24")
            let d = new Date(dateStr);
            if (!isNaN(d.getTime())) return d;

            // 2. Handle European format "DD.MM.YYYY" or "DD/MM/YYYY"
            // Split by dot, slash, or dash
            const parts = dateStr.match(/(\d{1,2})[./-](\d{1,2})[./-](\d{4})/);
            if (parts) {
                // parts[1] is day, parts[2] is month, parts[3] is year
                // Note: Month is 0-indexed in JS Date
                d = new Date(parts[3], parts[2] - 1, parts[1]);
                if (!isNaN(d.getTime())) return d;
            }

            // 3. Fallback: Try just year?
            const yearMatch = dateStr.match(/(\d{4})/);
            if (yearMatch) {
                return new Date(yearMatch[1], 0, 1);
            }

            return new Date(0); // Invalid
        };

        // Sort by productionDate (Newest First)
        albums.sort((a, b) => {
            const dateA = parseDate(a.productionDate);
            const dateB = parseDate(b.productionDate);
            return dateB - dateA; // Descending
        });

        res.json(albums);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

const { sendBroadcast } = require('../utils/emailService');

// @route   POST api/albums
// @desc    Create a new album
// @access  Private (Protected by frontend pass for now)
router.post('/', async (req, res) => {
    try {
        const newAlbum = new Album(req.body);
        const album = await newAlbum.save();

        // Notify Subscribers
        const htmlContent = `
            <h2>New Album Release: ${album.title}</h2>
            <p><strong>Artist:</strong> ${album.artist}</p>
            <p>${album.description ? album.description.substring(0, 150) + '...' : 'Check out the latest release!'}</p>
            <br>
            <img src="${album.coverUrl ? 'https://sonosvitae.github.io/' + album.coverUrl : ''}" style="max-width:300px;border-radius:10px;">
            <br><br>
            <a href="https://sonosvitae.github.io/#music" style="display:inline-block;padding:10px 20px;background:#a2d149;color:#000;text-decoration:none;border-radius:5px;">Listen Now</a>
            <br><br>
            <small>You received this notification because you subscribed to Sonos Vitae.</small>
        `;

        sendBroadcast(`New Album: ${album.title}`, htmlContent).catch(err => console.error("Auto-Broadcast Error:", err));

        res.json(album);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error: ' + err.message);
    }
});

// @route   PUT api/albums/:id
// @desc    Update an album
// @access  Private
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // If ID in body differs from param, ensure we don't create a duplicate or leave orphan? 
        // For now, assume ID in body matches or is ignored if immutable.
        // Actually, we usually don't allow changing the ID primary key easily in this setup.

        const album = await Album.findOneAndUpdate({ id: id }, updateData, { new: true });

        if (!album) {
            return res.status(404).json({ msg: 'Album not found' });
        }

        res.json(album);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/albums/:id
// @desc    Delete an album
// @access  Private
router.delete('/:id', async (req, res) => {
    try {
        const album = await Album.findOneAndDelete({ id: req.params.id });
        if (!album) {
            return res.status(404).json({ msg: 'Album not found' });
        }
        res.json({ msg: 'Album removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
