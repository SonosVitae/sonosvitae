const express = require('express');
const router = express.Router();
const Post = require('../models/Post');

// @route   GET api/posts
// @desc    Get all posts
// @access  Public
router.get('/', async (req, res) => {
    try {
        const posts = await Post.find().sort({ date: -1 }); // Sort by newest first
        res.json(posts);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/posts/:id
// @desc    Get post by ID
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const post = await Post.findOne({ id: req.params.id });
        if (!post) {
            return res.status(404).json({ msg: 'Post not found' });
        }
        res.json(post);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

const { sendBroadcast } = require('../utils/emailService');

// @route   POST api/posts
// @desc    Create a new post
// @access  Public (for now)
router.post('/', async (req, res) => {
    try {
        // Validation for unique ID if needed, but Mongo unique index usually handles it or we check manually
        // For simple update:
        const existing = await Post.findOne({ id: req.body.id });
        if (existing) {
            return res.status(400).json({ msg: 'Post with this ID already exists' });
        }

        const newPost = new Post(req.body);
        const post = await newPost.save();

        // Notify Subscribers
        // Construct basic HTML message
        const htmlContent = `
            <h2>New Gallery Post: ${post.title}</h2>
            <p>${post.text ? post.text.substring(0, 150) + '...' : 'A new post has been added to the gallery.'}</p>
            <br>
            <img src="${post.featuredImage ? 'https://sonosvitae.github.io/' + post.featuredImage : ''}" style="max-width:300px;border-radius:10px;">
            <br><br>
            <a href="https://sonosvitae.github.io/gallery.html" style="display:inline-block;padding:10px 20px;background:#a2d149;color:#000;text-decoration:none;border-radius:5px;">View Gallery</a>
            <br><br>
            <small>You received this notification because you subscribed to Sonos Vitae.</small>
        `;

        sendBroadcast(`New Post: ${post.title}`, htmlContent).catch(err => console.error("Auto-Broadcast Error:", err));

        res.json(post);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/posts/:id
// @desc    Update a post
// @access  Public (Protected by Admin UI)
router.put('/:id', async (req, res) => {
    try {
        const post = await Post.findOneAndUpdate(
            { id: req.params.id },
            { $set: req.body },
            { new: true }
        );
        if (!post) return res.status(404).json({ msg: 'Post not found' });
        res.json(post);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/posts/:id
// @desc    Delete a post
// @access  Public (Protected by Admin UI)
router.delete('/:id', async (req, res) => {
    try {
        const post = await Post.findOneAndDelete({ id: req.params.id });
        if (!post) return res.status(404).json({ msg: 'Post not found' });
        res.json({ msg: 'Post removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
