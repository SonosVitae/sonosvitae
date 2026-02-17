const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

// Use Memory Storage to process image before saving
const storage = multer.memoryStorage();

// Filter
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Not an image! Please upload an image.'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit (we compress it anyway)
    fileFilter: fileFilter
});

// @route   POST api/upload/check
// @desc    Check if file exists
router.post('/check', express.json(), (req, res) => {
    try {
        const { filename } = req.body;
        if (!filename) return res.status(400).json({ msg: 'No filename provided' });

        const nameWithoutExt = path.parse(filename).name;
        // Sanitize
        const sanitized = nameWithoutExt.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const targetFilename = sanitized + '.webp';

        const uploadPath = path.join(__dirname, '../../assets/uploads');
        const fullPath = path.join(uploadPath, targetFilename);

        const exists = fs.existsSync(fullPath);

        res.json({
            exists,
            targetName: targetFilename,
            url: `assets/uploads/${targetFilename}`
        });

    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/upload
// @desc    Upload an image, convert to WebP, optimize
// @access  Public (Protected by Admin UI logic)
router.post('/', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ msg: 'No file uploaded' });
        }

        const action = req.query.action || 'rename'; // 'rename' | 'replace'

        const nameWithoutExt = path.parse(req.file.originalname).name;
        const sanitized = nameWithoutExt.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        let filename = sanitized + '.webp';

        const uploadPath = path.join(__dirname, '../../assets/uploads');

        // Ensure directory exists
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }

        // Handle Collision
        if (action === 'rename') {
            let counter = 1;
            while (fs.existsSync(path.join(uploadPath, filename))) {
                filename = `${sanitized}-${counter}.webp`;
                counter++;
            }
        }
        // If 'replace', we just use the filename and overwrite.

        // Process with Sharp
        await sharp(req.file.buffer)
            .webp({ quality: 80 }) // Convert to WebP with 80% quality
            .resize({ width: 1920, withoutEnlargement: true }) // Max width 1920px, don't upscale
            .toFile(path.join(uploadPath, filename));

        // Return resource URL
        const fileUrl = `assets/uploads/${filename}`;
        res.json({ url: fileUrl });

    } catch (err) {
        console.error("Upload Error:", err);
        res.status(500).send('Server Error during upload');
    }
});

module.exports = router;
