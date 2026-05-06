const nodemailer = require('nodemailer');

const dns = require('dns');

const { promisify } = require('util');
const resolve4 = promisify(dns.resolve4);

const isTransientError = (error) => {
  const code = error.code || '';
  const message = (error.message || '').toLowerCase();
  
  const transientCodes = ['ETIMEDOUT', 'ENETUNREACH', 'ESOCKET', 'ECONNECTION', 'ECONNRESET', 'ENOTFOUND'];
  
  if (transientCodes.includes(code)) return true;
  if (message.includes('timeout') || message.includes('greeting timeout') || message.includes('socket timeout')) return true;
  
  return false;
};

const createFreshTransporter = async () => {
  let host = 'smtp.gmail.com';
  let tlsServername = undefined;
  
  try {
    const addresses = await resolve4('smtp.gmail.com');
    if (addresses && addresses.length > 0) {
      host = addresses[0];
      tlsServername = 'smtp.gmail.com';
    }
  } catch (err) {
    // Fall back to hostname if dns resolution fails
  }

  return nodemailer.createTransport({
    host: host,
    port: 587,
    secure: false,
    requireTLS: true,
    family: 4,
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 15000,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: tlsServername ? { servername: tlsServername } : undefined
  });
};

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

    const transporter = await createFreshTransporter();
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
  const domain = toEmail.split('@')[1] || 'unknown';
  const maxAttempts = 3;
  const backoff = [0, 2000, 5000]; // attempt 1 immediate, attempt 2 2s, attempt 3 5s

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

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`SMTP_ATTEMPT_${attempt} (Domain: ${domain})`);
    
    if (attempt > 1) {
      console.log(`SMTP_RETRYING (Domain: ${domain})`);
      await new Promise(res => setTimeout(res, backoff[attempt - 1]));
    }
    
    try {
      const transporter = await createFreshTransporter();
      const info = await transporter.sendMail(mailOptions);
      console.log(`SMTP_SEND_SUCCESS (Domain: ${domain}). MessageId: ${info.messageId}`);
      return true;
    } catch (error) {
      const safeMessage = error.message ? error.message.replace(process.env.EMAIL_PASS, '***') : 'Unknown error';
      if (attempt === maxAttempts || !isTransientError(error)) {
        console.log(`SMTP_FINAL_FAILURE (Domain: ${domain}). Code: ${error.code || 'None'}, Message: ${safeMessage}, Attempt: ${attempt}`);
        return false;
      }
    }
  }
  
  return false;
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
};
