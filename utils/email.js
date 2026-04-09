const { Resend } = require('resend');

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const FROM_ADDRESS = 'LRFAP <onboarding@resend.dev>';

const sendEmail = async ({ to, subject, html }) => {
  if (!resend) {
    console.warn('Resend not configured, skipping email');
    return { skipped: true };
  }
  try {
    const result = await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      subject,
      html,
    });
    return result;
  } catch (err) {
    console.error('Email send error:', err.message);
    return { error: err.message };
  }
};

const matchPublishedTemplate = ({ firstName, programName, universityName, applicationLink }) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
    <div style="background: #1a3a5c; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
      <h1 style="margin: 0; font-size: 24px;">LRFAP Match Results</h1>
    </div>
    <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
      <p style="font-size: 16px;">Dear ${firstName},</p>
      <p style="font-size: 16px;">The Lebanese Residency and Fellowship Application Program match results have been published.</p>
      <div style="background: white; border-left: 4px solid #1a3a5c; padding: 16px; margin: 20px 0;">
        <p style="margin: 0; font-size: 16px;"><strong>You have been matched to:</strong></p>
        <p style="margin: 8px 0 0 0; font-size: 18px; color: #1a3a5c;"><strong>${programName}</strong></p>
        <p style="margin: 4px 0 0 0; font-size: 16px;">${universityName}</p>
      </div>
      <p style="font-size: 16px;">You have <strong>48 hours</strong> to log in and accept your offer. After this window closes, your offer will expire.</p>
      <p style="text-align: center; margin: 30px 0;">
        <a href="${applicationLink}" style="background: #1a3a5c; color: white; padding: 12px 32px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">View My Offer</a>
      </p>
      <p style="font-size: 14px; color: #666; border-top: 1px solid #ddd; padding-top: 16px; margin-top: 30px;">
        This is an automated message from the LRFAP system. Please do not reply directly to this email.
      </p>
    </div>
  </div>
`;

const matchUnmatchedTemplate = ({ firstName, applicationLink }) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
    <div style="background: #1a3a5c; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
      <h1 style="margin: 0; font-size: 24px;">LRFAP Match Results</h1>
    </div>
    <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
      <p style="font-size: 16px;">Dear ${firstName},</p>
      <p style="font-size: 16px;">The Lebanese Residency and Fellowship Application Program match results have been published.</p>
      <div style="background: white; border-left: 4px solid #999; padding: 16px; margin: 20px 0;">
        <p style="margin: 0; font-size: 16px;"><strong>Match outcome:</strong></p>
        <p style="margin: 8px 0 0 0; font-size: 16px; color: #555;">You were not matched to a program in this round.</p>
      </div>
      <p style="font-size: 16px;">We understand this is disappointing news. You can log in to your LRFAP account to view your application status, contact the LGC committee for guidance, and explore your options for future cycles.</p>
      <p style="text-align: center; margin: 30px 0;">
        <a href="${applicationLink}" style="background: #1a3a5c; color: white; padding: 12px 32px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">View My Application</a>
      </p>
      <p style="font-size: 14px; color: #666; border-top: 1px solid #ddd; padding-top: 16px; margin-top: 30px;">
        This is an automated message from the LRFAP system. Please do not reply directly to this email.
      </p>
    </div>
  </div>
`;

const passwordResetTemplate = ({ firstName, resetLink }) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
    <div style="background: #1a3a5c; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
      <h1 style="margin: 0; font-size: 24px;">LRFAP Password Reset</h1>
    </div>
    <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
      <p style="font-size: 16px;">Dear ${firstName},</p>
      <p style="font-size: 16px;">We received a request to reset the password for your LRFAP account. Click the button below to choose a new password.</p>
      <p style="text-align: center; margin: 30px 0;">
        <a href="${resetLink}" style="background: #1a3a5c; color: white; padding: 12px 32px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">Reset My Password</a>
      </p>
      <p style="font-size: 14px; color: #555;">This link will expire in <strong>1 hour</strong>. If you did not request a password reset, you can safely ignore this email — your password will remain unchanged.</p>
      <p style="font-size: 14px; color: #666; border-top: 1px solid #ddd; padding-top: 16px; margin-top: 30px;">
        This is an automated message from the LRFAP system. Please do not reply directly to this email.
      </p>
    </div>
  </div>
`;

module.exports = { sendEmail, matchPublishedTemplate, matchUnmatchedTemplate, passwordResetTemplate };