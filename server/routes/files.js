const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const Post = require('../models/Post');
const Album = require('../models/Album');

// Directories to scan
const SCAN_DIRS = [
    { name: 'uploads', dir: path.join(__dirname, '../../assets/uploads') },
    { name: 'audio', dir: path.join(__dirname, '../../assets/audio') },
    { name: 'gallery', dir: path.join(__dirname, '../../assets/gallery') },
    { name: 'files', dir: path.join(__dirname, '../../assets/files') }
];

// Helper to check if file URL is found in string/array
function isFileUsed(filePath, urlOrArray) {
    if (!urlOrArray) return false;
    const searchString = Array.isArray(urlOrArray) ? JSON.stringify(urlOrArray) : String(urlOrArray);
    return searchString.includes(filePath);
}

// @route   GET api/files
// @desc    Get all files and their usage status
router.get('/', async (req, res) => {
    try {
        let allFiles = [];

        // 1. Scan physical directories
        SCAN_DIRS.forEach(scanPath => {
            if (fs.existsSync(scanPath.dir)) {
                const files = fs.readdirSync(scanPath.dir);
                files.forEach(file => {
                    const stats = fs.statSync(path.join(scanPath.dir, file));
                    if (stats.isFile()) {
                        allFiles.push({
                            filename: file,
                            path: `assets/${scanPath.name}/${file}`,
                            size: stats.size,
                            directory: scanPath.name,
                            createdAt: stats.birthtime,
                            isUsed: false,
                            usedIn: [] // Array of item titles
                        });
                    }
                });
            }
        });

        // 2. Fetch all MongoDB documents
        const posts = await Post.find({});
        const albums = await Album.find({});

        // 3. Cross-reference files
        allFiles.forEach(fileObj => {
            const shortPath = fileObj.path;
            const pureName = fileObj.filename; // Sometimes only the filename is stored (e.g. earlier uploads)

            // Check Posts
            posts.forEach(post => {
                const usedInFeatured = isFileUsed(shortPath, post.featuredImage) || isFileUsed(pureName, post.featuredImage);
                const usedInStack = isFileUsed(shortPath, post.stackImages) || isFileUsed(pureName, post.stackImages);
                const usedInAttachments = isFileUsed(shortPath, post.attachments) || isFileUsed(pureName, post.attachments);
                const usedInText = isFileUsed(shortPath, post.text) || isFileUsed(pureName, post.text); // Rare but possible

                if (usedInFeatured || usedInStack || usedInAttachments || usedInText) {
                    fileObj.isUsed = true;
                    if (!fileObj.usedIn.includes(`Post: ${post.title}`)) fileObj.usedIn.push(`Post: ${post.title}`);
                }
            });

            // Check Albums
            albums.forEach(album => {
                const usedInCover = isFileUsed(shortPath, album.coverUrl) || isFileUsed(pureName, album.coverUrl);
                const usedInBandcamp = isFileUsed(shortPath, album.bandcampEmbedSrc) || isFileUsed(pureName, album.bandcampEmbedSrc);

                if (usedInCover || usedInBandcamp) {
                    fileObj.isUsed = true;
                    if (!fileObj.usedIn.includes(`Album: ${album.title}`)) fileObj.usedIn.push(`Album: ${album.title}`);
                }
            });

            // Check Demo Playlist
            try {
                const demoPath = path.join(__dirname, '../../config/demoPlaylist.json');
                if (fs.existsSync(demoPath)) {
                    const demoPlaylist = JSON.parse(fs.readFileSync(demoPath, 'utf8'));
                    demoPlaylist.forEach(track => {
                        const usedInTrack = isFileUsed(shortPath, track.src) || isFileUsed(pureName, track.src);
                        if (usedInTrack) {
                            fileObj.isUsed = true;
                            if (!fileObj.usedIn.includes('Demo Playlist')) fileObj.usedIn.push('Demo Playlist');
                        }
                    });
                }
            } catch (err) {
                console.error("Error parsing demoPlaylist in files.js :", err);
            }
        });

        // Sort: newest first
        allFiles.sort((a, b) => b.createdAt - a.createdAt);

        res.json(allFiles);

    } catch (err) {
        console.error("GET /api/files Error:", err);
        res.status(500).json({ msg: 'Server Error scanning files' });
    }
});

// @route   DELETE api/files
// @desc    Delete physical file
router.delete('/', express.json(), (req, res) => {
    try {
        const { filePath } = req.body;
        if (!filePath) return res.status(400).json({ msg: 'No filePath provided' });

        // Ensure path is within our assets directory for security
        if (!filePath.startsWith('assets/')) {
            return res.status(403).json({ msg: 'Invalid directory access' });
        }

        const fullPath = path.join(__dirname, '../../', filePath);

        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
            res.json({ msg: 'File deleted successfully' });
        } else {
            res.status(404).json({ msg: 'File not found on disk' });
        }
    } catch (err) {
        console.error("DELETE /api/files Error:", err);
        res.status(500).json({ msg: 'Server Error deleting file' });
    }
});

module.exports = router;
