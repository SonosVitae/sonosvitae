const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
require('dotenv').config();

// Simple in-memory rate limiter: Map<IP, timestamp>
const rateLimit = new Map();
const COOLDOWN_SECONDS = 5 * 60; // 5 minutes

// @route   POST api/contact
// @desc    Send email via Gmail SMTP
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

    // Update timestamp
    rateLimit.set(ip, now);

    // 2. Validate Input
    if (!name || !email || !subject || !message) {
        return res.status(400).json({ msg: 'Please fill in all fields' });
    }

    try {
        // 3. Configure Transporter
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            },
            // Add Timeout settings to prevent hanging
            connectionTimeout: 10000, // 10 seconds
            greetingTimeout: 5000,
            socketTimeout: 10000
        });

        // Verify connection configuration
        await new Promise((resolve, reject) => {
            transporter.verify(function (error, success) {
                if (error) {
                    console.log("Transporter Error:", error);
                    reject(error);
                } else {
                    console.log("Server is ready to take our messages");
                    resolve(success);
                }
            });
        });

        // 4. Email Options
        const mailOptions = {
            from: `"${name}" <${process.env.EMAIL_USER}>`, // Sender address (must be authenticated user)
            replyTo: email, // User's email for reply
            to: process.env.EMAIL_RECEIVER, // filbarbog@gmail.com
            subject: `[Sonos Vitae Contact] ${subject}`,
            text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
            html: `
                <h3>New Message from Sonos Vitae</h3>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Subject:</strong> ${subject}</p>
                <br>
                <p><strong>Message:</strong></p>
                <p>${message.replace(/\n/g, '<br>')}</p>
            `
        };

        // 5. Send Email
        await transporter.sendMail(mailOptions);
        res.status(200).json({ msg: 'Message sent successfully!' });

    } catch (err) {
        console.error("Email Error:", err);
        res.status(500).json({ msg: 'Failed to send message. Please try again later.' });
    }
});

module.exports = router;
