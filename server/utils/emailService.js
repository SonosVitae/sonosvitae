const nodemailer = require('nodemailer');
const Subscriber = require('../models/Subscriber');
require('dotenv').config();

// Helper: Create Transporter
const createTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
};

/**
 * Send a broadcast email to all subscribers
 * @param {string} subject - Email subject
 * @param {string} htmlContent - HTML content of the email
 * @returns {Promise<{success: boolean, count: number, msg: string}>}
 */
const sendBroadcast = async (subject, htmlContent) => {
    try {
        const subscribers = await Subscriber.find();
        if (subscribers.length === 0) {
            return { success: true, count: 0, msg: 'No subscribers to notify.' };
        }

        const transporter = createTransporter();
        const emails = subscribers.map(sub => sub.email);

        // Send as BCC to protect privacy
        const mailOptions = {
            from: `"Sonos Vitae" <${process.env.EMAIL_USER}>`,
            bcc: emails,
            subject: `[Sonos Vitae Update] ${subject}`,
            html: htmlContent
        };

        await transporter.sendMail(mailOptions);
        console.log(`Broadcast sent to ${subscribers.length} subscribers.`);
        return { success: true, count: subscribers.length, msg: `Broadcast sent to ${subscribers.length} subscribers.` };

    } catch (err) {
        console.error("Broadcast Error:", err);
        return { success: false, msg: err.message };
    }
};

/**
 * Send a welcome email to a single recipient
 * @param {string} email - Recipient email
 */
const sendWelcomeEmail = async (email) => {
    try {
        const transporter = createTransporter();
        const mailOptions = {
            from: `"Sonos Vitae" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Welcome to Sonos Vitae Newsletter',
            html: `
                <h3>Welcome!</h3>
                <p>Thank you for subscribing to Sonos Vitae. You will be notified of new gallery posts and album releases.</p>
                <p>- Filip</p>
            `
        };
        await transporter.sendMail(mailOptions);
    } catch (err) {
        console.error("Welcome Email Error:", err);
    }
};

module.exports = { sendBroadcast, sendWelcomeEmail };
