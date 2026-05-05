const nodemailer = require('nodemailer');

const dns = require('dns');

let transporterOptions = {
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  requireTLS: true,
  family: 4,
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
};

let transporter = nodemailer.createTransport(transporterOptions);

// Strict IPv4 resolution strategy for Render environments
dns.resolve4('smtp.gmail.com', (err, addresses) => {
  if (!err && addresses && addresses.length > 0) {
    const ipv4Address = addresses[0];
    transporterOptions.host = ipv4Address;
    transporterOptions.tls = { servername: 'smtp.gmail.com' };
    transporter = nodemailer.createTransport(transporterOptions);
  }

  transporter.verify((error, success) => {
    if (error) {
      console.error('Email service failed to connect:', error.code || error.message);
    } else {
      console.log('Email service ready (transporter.verify() passed)');
    }
  });
});

/**
 * Dispatches a password reset email to a user.
 * Security reasoning: Delivers a time-sensitive, unguessable recovery link.
 * Includes a disclaimer to ignore the email if unauthorized, protecting user awareness.
 */
const sendPasswordResetEmail = async (toEmail, resetUrl) => {
  try {
    const mailOptions = {
      from: `"UniTickets" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: 'Reset your UniTickets password',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #059669;">Reset your UniTickets password</h2>
          <p>We received a request to reset your password. Click the button below to choose a new password.</p>
          <p style="margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Reset Password
            </a>
          </p>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p><a href="${resetUrl}" style="color: #059669; word-break: break-all;">${resetUrl}</a></p>
          <p style="margin-top: 30px; font-size: 12px; color: #6b7280;">If you did not request this, you can safely ignore this email.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${toEmail}. MessageId: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('Email send error:', error.message);
    return false;
  }
};

/**
 * Dispatches an initial account verification email.
 * Security reasoning: Verifies email ownership via an out-of-band communication 
 * channel before granting access to the system.
 */
const sendVerificationEmail = async (toEmail, verificationUrl) => {
  try {
    const mailOptions = {
      from: `"UniTickets" <${process.env.EMAIL_USER}>`,
      replyTo: process.env.EMAIL_USER,
      to: toEmail,
      subject: 'Verify your UniTickets account',
      text: `You requested access to UniTickets.\n\nPlease verify your University of Aruba email by clicking the link below or pasting it into your browser:\n${verificationUrl}\n\nIf you do not see this email, check your spam or junk folder.\nIf you did not request this account, you can safely ignore this email.`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #059669;">Welcome to UniTickets</h2>
          <p>You requested access to UniTickets. Please verify your University of Aruba email by clicking the link below.</p>
          <p style="margin: 30px 0;">
            <a href="${verificationUrl}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Verify Email
            </a>
          </p>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p><a href="${verificationUrl}" style="color: #059669; word-break: break-all;">${verificationUrl}</a></p>
          <p style="margin-top: 15px; font-weight: bold;">Note: If you do not see this email, check your spam or junk folder.</p>
          <p style="margin-top: 30px; font-size: 12px; color: #6b7280;">If you did not request this account, you can safely ignore this email.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${toEmail}. MessageId: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('Email send error:', error.message);
    return false;
  }
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
};
