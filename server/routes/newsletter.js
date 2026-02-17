const express = require('express');
const router = express.Router();
const Subscriber = require('../models/Subscriber');
require('dotenv').config();

const { sendBroadcast, sendWelcomeEmail } = require('../utils/emailService');

// @route   POST api/newsletter/subscribe
// @desc    Subscribe to newsletter
// @access  Public
router.post('/subscribe', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ msg: 'Email is required' });
    }

    try {
        // Check if already subscribed
        let subscriber = await Subscriber.findOne({ email });
        if (subscriber) {
            return res.status(400).json({ msg: 'This email is already subscribed' });
        }

        subscriber = new Subscriber({ email });
        await subscriber.save();

        // Send welcome email
        await sendWelcomeEmail(email);

        res.status(201).json({ msg: 'Subscribed successfully!' });

    } catch (err) {
        console.error("Subscribe Error:", err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   POST api/newsletter/broadcast
// @desc    Send email to all subscribers (Admin only - protected in real app)
// @access  Public (for now)
router.post('/broadcast', async (req, res) => {
    const { subject, message, link, linkText } = req.body;

    if (!subject || !message) {
        return res.status(400).json({ msg: 'Subject and message are required' });
    }

    try {
        const htmlContent = `
            <h2>${subject}</h2>
            <p>${message}</p>
            ${link ? `<a href="${link}" style="display:inline-block;padding:10px 20px;background:#a2d149;color:#000;text-decoration:none;border-radius:5px;">${linkText || 'Check it out'}</a>` : ''}
            <br><br>
            <small>You received this because you are subscribed to Sonos Vitae updates.</small>
        `;

        const result = await sendBroadcast(subject, htmlContent);

        if (result.success) {
            res.status(200).json({ msg: result.msg });
        } else {
            res.status(500).json({ msg: 'Failed to broadcast message' });
        }

    } catch (err) {
        console.error("Broadcast Error:", err);
        res.status(500).json({ msg: 'Failed to broadcast message' });
    }
});

// @route   GET api/newsletter
// @desc    Get all subscribers
// @access  Private
router.get('/', async (req, res) => {
    try {
        const subscribers = await Subscriber.find().sort({ subscribedAt: -1 });
        res.json(subscribers);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/newsletter/:id
// @desc    Remove subscriber
// @access  Private
router.delete('/:id', async (req, res) => {
    try {
        await Subscriber.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Subscriber removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
