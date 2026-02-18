const { Resend } = require('resend');
const Subscriber = require('../models/Subscriber');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const apiKey = process.env.RESEND_API_KEY;
if (!apiKey) {
    console.error("CRITICAL: RESEND_API_KEY is missing from .env file!");
}
const resend = apiKey ? new Resend(apiKey) : null;

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

        const emails = subscribers.map(sub => sub.email);

        // Resend supports sending to multiple recipients in 'bcc' or loop for individual
        // For privacy, using BCC or batch sending is best. 
        // Resend Free Tier limits: 100 emails/day, 3000/mo.

        if (!resend) {
            return { success: false, msg: 'Email service not configured (Missing API Key)' };
        }

        // Note: 'from' must be a verified domain on Resend
        const { data, error } = await resend.emails.send({
            from: 'Sonos Vitae <onboarding@resend.dev>', // Update this after domain verification
            to: ['delivered@resend.dev'], // Must send to verified address or self in testing
            bcc: emails,
            subject: `[Sonos Vitae Update] ${subject}`,
            html: htmlContent
        });

        if (error) {
            console.error("Resend Broadcast Error:", error);
            return { success: false, msg: error.message };
        }

        console.log(`Broadcast sent. ID: ${data.id}`);
        return { success: true, count: emails.length, msg: `Broadcast queued for ${emails.length} subscribers.` };

    } catch (err) {
        console.error("Broadcast Logic Error:", err);
        return { success: false, msg: err.message };
    }
};

/**
 * Send a welcome email to a single recipient
 * @param {string} email - Recipient email
 */
const sendWelcomeEmail = async (email) => {
    try {
        if (!resend) return;

        const { data, error } = await resend.emails.send({
            from: 'Sonos Vitae <onboarding@resend.dev>', // Update this after domain verification
            to: [email],
            subject: 'Welcome to Sonos Vitae Newsletter',
            html: `
                <h3>Welcome!</h3>
                <p>Thank you for subscribing to Sonos Vitae. You will be notified of new gallery posts and album releases.</p>
                <p>- Filip</p>
            `
        });

        if (error) console.error("Resend Welcome Error:", error);
    } catch (err) {
        console.error("Welcome Logic Error:", err);
    }
};

module.exports = { sendBroadcast, sendWelcomeEmail };
