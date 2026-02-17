const express = require('express');
const router = express.Router();

// @route   POST api/auth/login
// @desc    Authenticate user
// @access  Public
router.post('/login', (req, res) => {
    const { username, password } = req.body;

    // Hardcoded credentials as requested
    // Login: Arsen, Password: filip3
    if (username === 'Arsen' && password === 'filip3') {
        res.json({
            success: true,
            token: 'dummy-token-777', // In a real app, use JWT. Here just a flag.
            msg: 'Logged in successfully'
        });
    } else {
        res.status(401).json({ success: false, msg: 'Invalid credentials' });
    }
});

module.exports = router;
