const nodemailer = require('nodemailer');

const sendVerificationEmail = async (toEmail, verificationUrl) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_FROM || '"UniTickets" <no-reply@unitickets.edu>',
      to: toEmail,
      subject: 'Verify your UniTickets account',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #059669;">Welcome to UniTickets</h2>
          <p>Please verify your University of Aruba email by clicking the link below.</p>
          <p style="margin: 30px 0;">
            <a href="${verificationUrl}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Verify Email
            </a>
          </p>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p><a href="${verificationUrl}" style="color: #059669; word-break: break-all;">${verificationUrl}</a></p>
          <p style="margin-top: 30px; font-size: 12px; color: #6b7280;">If you did not request this account, you can safely ignore this email.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email send error:', error);
    return false;
  }
};

module.exports = {
  sendVerificationEmail,
};
