import { betterAuth } from "better-auth";
import { username } from "better-auth/plugins";
import { anonymous } from "better-auth/plugins";
import { bearer } from "better-auth/plugins";
import nodemailer from "nodemailer";

import { pool } from "./db";

const transporter = nodemailer.createTransport({
  host: Bun.env.BELONG_SMTP_HOST as string,
  port: parseInt(Bun.env.BELONG_SMTP_PORT as string) || 465,
  secure: (Bun.env.BELONG_SMTP_PORT as string) === "465" || true,
  auth: {
    user: Bun.env.BELONG_SMTP_USER as string,
    pass: Bun.env.BELONG_SMTP_PASS as string,
  },
});

const FROM_ADDRESS = Bun.env.BELONG_SMTP_FROM as string;

export const auth = betterAuth({
  baseURL: (Bun.env.BETTER_AUTH_URL as string) || "http://localhost:5090",
  trustedOrigins: [
    (Bun.env.BELONG_FRONTEND_URL as string) || "http://localhost:5091",
  ],
  database: pool,
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url, token }) => {
      try {
        await transporter.sendMail({
          from: FROM_ADDRESS,
          to: user.email,
          subject: "Reset your Belong password",
          text: `Reset your password here: ${url}`,
          html: `
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
              <h1 style="color: #2D2926;">Belong</h1>
              <p>Click the button below to reset your password. This link expires in 1 hour.</p>
              <a href="${url}"
                 style="display: inline-block; padding: 12px 24px; background: #2D2926; color: white;
                        text-decoration: none; border-radius: 6px; margin: 16px 0;">
                Reset password
              </a>
              <p style="color: #5E5954; font-size: 14px;">
                If you didn't request this, you can safely ignore this email.
              </p>
            </div>
          `,
        });
        console.log(`Password reset email sent to ${user.email}`);
      } catch (err) {
        console.error(
          `Failed to send password reset email to ${user.email}:`,
          err,
        );
      }
    },
  },
  plugins: [username(), anonymous(), bearer()],
  socialProviders: {
    google: {
      clientId: Bun.env.BELONG_GOOGLE_CLIENT_ID as string,
      clientSecret: Bun.env.BELONG_GOOGLE_CLIENT_SECRET as string,
    },
    github: {
      clientId: Bun.env.BELONG_GITHUB_CLIENT_ID as string,
      clientSecret: Bun.env.BELONG_GITHUB_CLIENT_SECRET as string,
    },
  },
});
