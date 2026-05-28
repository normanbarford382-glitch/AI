import nodemailer from "nodemailer";

const smtpHost = process.env.SMTP_HOST;
const smtpPort = process.env.SMTP_PORT;
const smtpUser = process.env.SMTP_USER;
const smtpPassword = process.env.SMTP_PASSWORD;

if (!smtpHost || !smtpUser || !smtpPassword) {
  throw new Error(
    "SMTP_HOST, SMTP_USER, and SMTP_PASSWORD environment variables are required for email sending."
  );
}

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: Number(smtpPort) || 587,
  secure: false,
  auth: {
    user: smtpUser,
    pass: smtpPassword,
  },
  tls: { rejectUnauthorized: false },
});

export async function sendOTPEmail(email: string, otp: string, lang: string = "ar"): Promise<void> {
  const isAr = lang === "ar";
  const subject = isAr ? "رمز التحقق - LaptopStore" : "Verification Code - LaptopStore";
  const html = isAr
    ? `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #2563eb, #60a5fa); padding: 30px; border-radius: 16px; text-align: center; margin-bottom: 24px;">
          <h1 style="color: white; margin: 0; font-size: 24px;">💻 LaptopStore</h1>
        </div>
        <div style="background: #f8fafc; border-radius: 12px; padding: 24px; text-align: center;">
          <h2 style="color: #1e293b; margin-bottom: 8px;">رمز التحقق الخاص بك</h2>
          <p style="color: #64748b; margin-bottom: 24px;">أدخل هذا الرمز لإتمام التسجيل. الرمز صالح لمدة 10 دقائق.</p>
          <div style="background: white; border: 2px solid #2563eb; border-radius: 12px; padding: 20px; display: inline-block; margin: 0 auto;">
            <span style="font-size: 40px; font-weight: bold; color: #2563eb; letter-spacing: 8px;">${otp}</span>
          </div>
          <p style="color: #94a3b8; font-size: 13px; margin-top: 20px;">إذا لم تطلب هذا، تجاهل هذا البريد الإلكتروني.</p>
        </div>
      </div>
    `
    : `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #2563eb, #60a5fa); padding: 30px; border-radius: 16px; text-align: center; margin-bottom: 24px;">
          <h1 style="color: white; margin: 0; font-size: 24px;">💻 LaptopStore</h1>
        </div>
        <div style="background: #f8fafc; border-radius: 12px; padding: 24px; text-align: center;">
          <h2 style="color: #1e293b; margin-bottom: 8px;">Your Verification Code</h2>
          <p style="color: #64748b; margin-bottom: 24px;">Enter this code to complete registration. Valid for 10 minutes.</p>
          <div style="background: white; border: 2px solid #2563eb; border-radius: 12px; padding: 20px; display: inline-block; margin: 0 auto;">
            <span style="font-size: 40px; font-weight: bold; color: #2563eb; letter-spacing: 8px;">${otp}</span>
          </div>
          <p style="color: #94a3b8; font-size: 13px; margin-top: 20px;">If you didn't request this, please ignore this email.</p>
        </div>
      </div>
    `;

  await transporter.sendMail({ from: `"LaptopStore" <${smtpUser}>`, to: email, subject, html });
}

export async function sendPasswordResetEmail(email: string, resetLink: string, lang: string = "ar"): Promise<void> {
  const isAr = lang === "ar";
  const subject = isAr ? "إعادة تعيين كلمة المرور - LaptopStore" : "Password Reset - LaptopStore";
  const html = isAr
    ? `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #2563eb, #60a5fa); padding: 30px; border-radius: 16px; text-align: center; margin-bottom: 24px;">
          <h1 style="color: white; margin: 0;">💻 LaptopStore</h1>
        </div>
        <div style="background: #f8fafc; border-radius: 12px; padding: 24px; text-align: center;">
          <h2 style="color: #1e293b;">إعادة تعيين كلمة المرور</h2>
          <p style="color: #64748b; margin-bottom: 24px;">اضغط على الزر أدناه لإعادة تعيين كلمة المرور. الرابط صالح لمدة 30 دقيقة.</p>
          <a href="${resetLink}" style="background: #2563eb; color: white; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: bold; display: inline-block;">إعادة تعيين كلمة المرور</a>
          <p style="color: #94a3b8; font-size: 12px; margin-top: 20px;">إذا لم تطلب هذا، تجاهل هذا البريد.</p>
        </div>
      </div>
    `
    : `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #2563eb, #60a5fa); padding: 30px; border-radius: 16px; text-align: center; margin-bottom: 24px;">
          <h1 style="color: white; margin: 0;">💻 LaptopStore</h1>
        </div>
        <div style="background: #f8fafc; border-radius: 12px; padding: 24px; text-align: center;">
          <h2 style="color: #1e293b;">Password Reset</h2>
          <p style="color: #64748b; margin-bottom: 24px;">Click the button below to reset your password. Link expires in 30 minutes.</p>
          <a href="${resetLink}" style="background: #2563eb; color: white; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: bold; display: inline-block;">Reset Password</a>
          <p style="color: #94a3b8; font-size: 12px; margin-top: 20px;">If you didn't request this, ignore this email.</p>
        </div>
      </div>
    `;

  await transporter.sendMail({ from: `"LaptopStore" <${smtpUser}>`, to: email, subject, html });
}

export async function verifyConnection(): Promise<boolean> {
  try {
    await transporter.verify();
    return true;
  } catch {
    return false;
  }
}
