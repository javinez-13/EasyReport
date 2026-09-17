import nodemailer from "nodemailer";

const SMTP_USER = process.env.SMTP_USER || process.env.GMAIL_USER || "";
const SMTP_PASS_RAW = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || "";
// Tanggalin ang spaces sa App Password (Google shows "xxxx xxxx..." pero SMTP needs "xxxxxxxx")
const SMTP_PASS = SMTP_PASS_RAW.replace(/\s+/g, "");
const SMTP_FROM =
  process.env.SMTP_FROM || (SMTP_USER ? `"Barangay EasyReport" <${SMTP_USER}>` : "Barangay EasyReport <no-reply@localhost>");

export function isMailerConfigured(): boolean {
  return Boolean(SMTP_USER && SMTP_PASS);
}

function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT || 465),
    secure: (process.env.SMTP_SECURE ?? "true") === "true",
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
}

export async function sendPasswordResetEmail(to: string, resetLink: string): Promise<void> {
  if (!isMailerConfigured()) {
    // Dev fallback: huwag mag-crash kung walang SMTP config.
    // Makikita ang link sa server logs para ma-test ang flow.
    console.log(`[mailer] SMTP not configured. Password reset link for ${to}: ${resetLink}`);
    return;
  }

  const transporter = getTransporter();

  await transporter.sendMail({
    from: SMTP_FROM,
    to,
    subject: "Barangay EasyReport - Password Reset",
    text: `Nag-request ka ng password reset para sa Barangay EasyReport account mo.\n\nI-click ang link sa ibaba para mag-set ng bagong password (valid sa loob ng 1 oras):\n${resetLink}\n\nKung hindi ikaw ang nag-request nito, huwag pansinin ang email na ito.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; background: #f4f5f7;">
        <div style="background: #ffffff; border-radius: 12px; padding: 28px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
          <h2 style="margin: 0 0 8px; color: #111827;">Password Reset Request</h2>
          <p style="margin: 0 0 16px; color: #4b5563; font-size: 14px;">
            Nag-request ka ng password reset para sa <strong>Barangay EasyReport</strong> account mo.
          </p>
          <p style="margin: 0 0 16px; color: #4b5563; font-size: 14px;">
            I-click ang button sa ibaba para mag-set ng bagong password. Valid ito sa loob ng <strong>1 oras</strong>.
          </p>
          <a href="${resetLink}" style="display: inline-block; padding: 12px 20px; background: #0066ff; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px;">
            Reset My Password
          </a>
          <p style="margin: 16px 0 0; color: #6b7280; font-size: 12px; word-break: break-all;">
            Kung hindi gumagana ang button, kopyahin ang link na ito sa browser:<br />
            <a href="${resetLink}">${resetLink}</a>
          </p>
          <p style="margin: 16px 0 0; color: #9ca3af; font-size: 12px;">
            Kung hindi ikaw ang nag-request nito, huwag pansinin ang email na ito.
          </p>
        </div>
      </div>
    `,
  });
}
