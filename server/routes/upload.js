const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

// Use Memory Storage to process image before saving
const storage = multer.memoryStorage();

// Filter
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('audio/')) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type! Please upload an image or audio file.'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // Allowed 50MB for audio files
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
// @desc    Upload an image (convert to WebP) or audio (save directly)
// @access  Public (Protected by Admin UI logic)
router.post('/', upload.any(), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ msg: 'No file uploaded' });
        }

        req.file = req.files[0]; // Assign the first file regardless of field name

        const action = req.query.action || 'rename';

        const nameWithoutExt = path.parse(req.file.originalname).name;
        // Sanitize string
        const sanitized = nameWithoutExt.replace(/[^a-z0-9]/gi, '_').toLowerCase();

        const isAudio = req.file.mimetype.startsWith('audio');
        const ext = isAudio ? path.extname(req.file.originalname).toLowerCase() : '.webp';

        // Default to mp3 if no ext found on audio (for the initial temp name)
        let finalExt = ext;
        if (isAudio && !finalExt) {
            if (req.file.mimetype.includes('wav')) finalExt = '.wav';
            else if (req.file.mimetype.includes('ogg')) finalExt = '.ogg';
            else finalExt = '.mp3';
        }

        // Target extensions
        let targetExt = isAudio ? '.opus' : '.webp';
        let targetFilename = sanitized + targetExt;

        // Branch save directory based on type
        const folderName = isAudio ? 'audio' : 'uploads';
        const uploadPath = path.join(__dirname, `../../assets/${folderName}`);

        // Ensure directory exists
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }

        // Handle Collision
        if (action === 'rename') {
            let counter = 1;
            while (fs.existsSync(path.join(uploadPath, targetFilename))) {
                targetFilename = `${sanitized}-${counter}${targetExt}`;
                counter++;
            }
        }

        if (isAudio) {
            // Audio Conversion to OPUS
            const tempFilename = sanitized + '_temp' + finalExt;
            const tempPath = path.join(uploadPath, tempFilename);
            const finalPath = path.join(uploadPath, targetFilename);

            // Step 1: Save buffer to temp file so ffmpeg can read it easily
            fs.writeFileSync(tempPath, req.file.buffer);

            // Step 2: Convert to OPUS
            await new Promise((resolve, reject) => {
                ffmpeg(tempPath)
                    .outputOptions([
                        '-c:a libopus',     // OPUS codec
                        '-b:a 128k',        // 128kbps (high quality for OPUS)
                        '-vbr on'           // Variable Bit Rate
                    ])
                    .save(finalPath)
                    .on('end', () => {
                        // Success
                        fs.unlinkSync(tempPath); // Clean up temp
                        resolve();
                    })
                    .on('error', (err) => {
                        console.error("FFmpeg Conversion Error:", err);
                        // Try to clean up temp on error
                        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
                        reject(err);
                    });
            });

        } else {
            // Process Image with Sharp
            const finalPath = path.join(uploadPath, targetFilename);
            await sharp(req.file.buffer)
                .webp({ quality: 80 })
                .resize({ width: 1920, withoutEnlargement: true })
                .toFile(finalPath);
        }

        // Return resource URL
        const fileUrl = `assets/${folderName}/${targetFilename}`;
        res.json({ url: fileUrl });

    } catch (err) {
        console.error("Upload Error:", err);
        res.status(500).send('Server Error during upload');
    }
});

module.exports = router;
