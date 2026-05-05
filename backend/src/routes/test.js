const express = require('express');
const crypto = require('crypto');
const { sendVerificationEmail } = require('../utils/email');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const router = express.Router();

// REMOVE THIS ROUTE BEFORE PRODUCTION FINALIZATION
router.post('/send-verification-email', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const verificationUrl = `${frontendUrl}/verify-email?token=${token}`;

    const emailSent = await sendVerificationEmail(email, verificationUrl);
    
    if (emailSent) {
      console.log('Test email sent');
      res.json({ success: true, message: 'Test verification email sent successfully' });
    } else {
      res.status(500).json({ success: false, message: 'Email failed to send' });
    }
  } catch (error) {
    console.error('Test email route error:', error.message);
    res.status(500).json({ success: false, message: 'Email failed to send' });
  }
});

module.exports = router;
