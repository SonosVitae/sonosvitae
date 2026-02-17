// Contact Form Logic
document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.getElementById('contactForm');
    if (!contactForm) return;

    const submitBtn = contactForm.querySelector('.btn-submit');
    const originalBtnText = submitBtn.innerText;

    // Cooldown State
    let isCooldown = false;
    const COOLDOWN_TIME = 5 * 60; // 5 minutes

    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // 1. Check Cooldown
        if (isCooldown) {
            showStatus('Please wait a few seconds before sending another message.', 'error');
            return;
        }

        // 2. Prepare Data
        const formData = new FormData(contactForm);
        const data = {
            name: formData.get('name'),
            email: formData.get('email'),
            subject: formData.get('subject'),
            message: formData.get('message')
        };

        // 3. UI Loading State
        submitBtn.disabled = true;
        submitBtn.innerText = 'Sending...';

        try {
            // 4. Send Request
            // Dynamic API URL: Use relative in prod/same-port, localhost:5000 for dev separate port
            const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && window.location.port !== '5000'
                ? 'http://localhost:5000'
                : '';
            const API_URL = `${API_BASE}/api/contact`;

            const res = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await res.json();

            if (res.ok) {
                showStatus('Message sent successfully!', 'success');
                contactForm.reset();
                startCooldown();
            } else {
                // Handle Backend Errors (including rate limit 429)
                showStatus(result.msg || 'Failed to send message.', 'error');
                if (res.status === 429) {
                    startCooldown(); // Enforce client-side cooldown if backend says so
                }
            }

        } catch (err) {
            console.error('Contact Form Error:', err);
            showStatus('Network error. Please try again later.', 'error');
        } finally {
            // Restore Button if not in cooldown (startCooldown handles its own state)
            if (!isCooldown) {
                submitBtn.disabled = false;
                submitBtn.innerText = originalBtnText;
            }
        }
    });

    function showStatus(message, type) {
        // Remove existing status if any
        const existing = contactForm.querySelector('.form-status');
        if (existing) existing.remove();

        // Create status element
        const statusEl = document.createElement('div');
        statusEl.className = `form-status ${type}`;
        statusEl.innerText = message;

        // Style (Basic inline for now, ideally css class)
        statusEl.style.marginTop = '15px';
        statusEl.style.padding = '10px';
        statusEl.style.borderRadius = '5px';
        statusEl.style.fontSize = '0.9rem';
        statusEl.style.textAlign = 'center';

        if (type === 'success') {
            statusEl.style.backgroundColor = 'rgba(162, 209, 73, 0.2)';
            statusEl.style.color = '#a2d149';
            statusEl.style.border = '1px solid #a2d149';
        } else {
            statusEl.style.backgroundColor = 'rgba(255, 99, 71, 0.2)';
            statusEl.style.color = '#ff6347';
            statusEl.style.border = '1px solid #ff6347';
        }

        contactForm.appendChild(statusEl);

        // Auto remove after 5s
        setTimeout(() => {
            if (statusEl && statusEl.parentNode) statusEl.remove();
        }, 5000);
    }

    function startCooldown() {
        isCooldown = true;
        submitBtn.disabled = true;

        let remaining = COOLDOWN_TIME;

        // Initial Text
        submitBtn.innerText = `Wait ${remaining}s`;

        const interval = setInterval(() => {
            remaining--;
            if (remaining > 0) {
                submitBtn.innerText = `Wait ${remaining}s`;
            } else {
                clearInterval(interval);
                isCooldown = false;
                submitBtn.disabled = false;
                submitBtn.innerText = originalBtnText;
            }
        }, 1000);
    }
});
