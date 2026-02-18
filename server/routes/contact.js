const express = require('express');
const router = express.Router();
const { Resend } = require('resend');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const apiKey = process.env.RESEND_API_KEY;
const resend = apiKey ? new Resend(apiKey) : null;

// Simple in-memory rate limiter: Map<IP, timestamp>
const rateLimit = new Map();
const COOLDOWN_SECONDS = 5 * 60; // 5 minutes

// @route   POST api/contact
// @desc    Send email via Resend API
// @access  Public
router.post('/', async (req, res) => {
    const { name, email, subject, message } = req.body;
    const ip = req.ip;

    // 1. Check Rate Limit
    const lastRequest = rateLimit.get(ip);
    const now = Date.now();

    if (lastRequest && (now - lastRequest) < COOLDOWN_SECONDS * 1000) {
        const remaining = Math.ceil((COOLDOWN_SECONDS * 1000 - (now - lastRequest)) / 1000);
        return res.status(429).json({ msg: `Please wait ${remaining} seconds before sending another message.` });
    }

    // 2. Validate Input
    if (!name || !email || !subject || !message) {
        return res.status(400).json({ msg: 'Please fill in all fields' });
    }

    try {
        // 3. Send Email via Resend
        // Note: For 'from', use 'onboarding@resend.dev' until you verify your domain.
        // For 'to', use your own email (that you verified/are testing with).
        if (!resend) {
            console.error("Resend Client not initialized (Missing API Key)");
            return res.status(500).json({ msg: 'Email service configuration error.' });
        }

        // 3. Send Email via Resend
        // Note: For 'from', use 'onboarding@resend.dev' until you verify your domain.
        // For 'to', use your own email (that you verified/are testing with).
        const { data, error } = await resend.emails.send({
            from: 'Sonos Vitae Contact <onboarding@resend.dev>',
            to: [process.env.EMAIL_RECEIVER || 'filbarbog@gmail.com'],
            reply_to: email,
            subject: `[Sonos Vitae Contact] ${subject}`,
            html: `
                <h3>New Message from Sonos Vitae</h3>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Subject:</strong> ${subject}</p>
                <br>
                <p><strong>Message:</strong></p>
                <p>${message.replace(/\n/g, '<br>')}</p>
            `
        });

        if (error) {
            console.error("Resend API Error:", error);
            // DO NOT update rate limit on failure
            return res.status(500).json({ msg: 'Failed to send message via Resend. Check logs.' });
        }

        // 4. Success
        // Update rate limit ONLY on success
        rateLimit.set(ip, now);

        console.log("Email sent successfully:", data);
        res.status(200).json({ msg: 'Message sent successfully!' });

    } catch (err) {
        console.error("Contact Route Error:", err);
        res.status(500).json({ msg: 'Server Error. Please try again later.' });
    }
});

module.exports = router;
