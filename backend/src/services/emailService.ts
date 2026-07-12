import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_ADDRESS = 'AssetFlow Security <onboarding@resend.dev>';
const OTP_VALIDITY_MINUTES = 10;

const buildOtpEmailHtml = (otp: string): string => `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>AssetFlow Security Verification</title>
  </head>
  <body style="margin:0; padding:0; background-color:#0f172a; font-family:'Segoe UI', Helvetica, Arial, sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f172a; padding:40px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px; width:100%; background-color:#1e293b; border-radius:12px; overflow:hidden; border:1px solid #334155;">
            <tr>
              <td style="padding:32px 40px 24px; text-align:center; border-bottom:1px solid #334155;">
                <div style="display:inline-block; width:40px; height:40px; background-color:#2563eb; border-radius:8px; color:#ffffff; font-size:20px; font-weight:700; line-height:40px; text-align:center; margin-bottom:12px;">A</div>
                <h1 style="margin:12px 0 0; font-size:18px; font-weight:600; color:#f8fafc; letter-spacing:0.02em;">AssetFlow Security Verification</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:32px 40px;">
                <p style="margin:0 0 8px; font-size:14px; color:#94a3b8;">Hello,</p>
                <p style="margin:0 0 24px; font-size:14px; line-height:1.6; color:#cbd5e1;">
                  We received a request to reset the password for your AssetFlow account. Use the verification code below to continue. This code is valid for <strong style="color:#f8fafc;">${OTP_VALIDITY_MINUTES} minutes</strong>.
                </p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center" style="padding:20px; background-color:#0f172a; border:1px solid #334155; border-radius:10px;">
                      <span style="font-size:36px; font-weight:700; letter-spacing:0.5em; color:#60a5fa; font-family:'Courier New', Courier, monospace;">${otp}</span>
                    </td>
                  </tr>
                </table>
                <p style="margin:24px 0 0; font-size:13px; line-height:1.6; color:#94a3b8;">
                  If you did not request a password reset, you can safely ignore this email — your account remains secure and no changes will be made.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 40px; background-color:#0f172a; border-top:1px solid #334155; text-align:center;">
                <p style="margin:0; font-size:11px; color:#64748b;">© ${new Date().getFullYear()} AssetFlow Inc. — Enterprise Asset &amp; Resource Management</p>
                <p style="margin:4px 0 0; font-size:11px; color:#475569;">This is an automated security message. Please do not reply.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

export const sendOtpEmail = async (email: string, otp: string): Promise<void> => {
  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: email,
    subject: 'AssetFlow Security Verification Code',
    html: buildOtpEmailHtml(otp),
  });

  if (error) {
    throw new Error(`Resend API error: ${error.message}`);
  }
};
