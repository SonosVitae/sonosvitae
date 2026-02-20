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

        if (!resend) {
            return { success: false, msg: 'Email service not configured (Missing API Key)' };
        }

        // Send emails individually instead of BCC to bypass Resend test domain restrictions
        // and prevent accidentally exposing user emails in the "To" field.
        const sendPromises = emails.map(email => {
            return resend.emails.send({
                from: 'Sonos Vitae <onboarding@resend.dev>', // Update this after domain verification
                to: [email],
                subject: `[Sonos Vitae Update] ${subject}`,
                html: htmlContent
            }).catch(err => {
                console.error(`Failed to send to ${email}:`, err);
                return { error: err };
            });
        });

        // Wait for all individual emails to dispatch
        const results = await Promise.all(sendPromises);

        // Count successful deliveries
        let successCount = 0;
        for (const res of results) {
            if (!res.error && res.data) successCount++;
        }

        return { success: true, count: successCount, msg: `Broadcast queued individually for ${successCount} subscribers.` };

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
