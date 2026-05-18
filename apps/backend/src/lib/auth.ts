/* eslint-disable no-console */
import { betterAuth } from 'better-auth';
import { username } from 'better-auth/plugins';
import { anonymous } from 'better-auth/plugins';
import { bearer } from 'better-auth/plugins';
import { organization } from 'better-auth/plugins';
import nodemailer from 'nodemailer';

import { pool } from './db';

const smtpHost = Bun.env.BELONG_SMTP_HOST as string;
const smtpUser = Bun.env.BELONG_SMTP_USER as string;
const smtpPass = Bun.env.BELONG_SMTP_PASS as string;
const hasSmtpConfig = !!(smtpHost && smtpUser && smtpPass);

const transporter = hasSmtpConfig
  ? nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(Bun.env.BELONG_SMTP_PORT as string) || 465,
      secure: (Bun.env.BELONG_SMTP_PORT as string) === '465' || true,
      auth: { user: smtpUser, pass: smtpPass },
    })
  : null;

const socialProviders: Record<string, { clientId: string; clientSecret: string }> = {};

const googleId = Bun.env.BELONG_GOOGLE_CLIENT_ID as string;
const googleSecret = Bun.env.BELONG_GOOGLE_CLIENT_SECRET as string;
if (googleId && googleSecret) {
  socialProviders.google = { clientId: googleId, clientSecret: googleSecret };
}

const githubId = Bun.env.BELONG_GITHUB_CLIENT_ID as string;
const githubSecret = Bun.env.BELONG_GITHUB_CLIENT_SECRET as string;
if (githubId && githubSecret) {
  socialProviders.github = { clientId: githubId, clientSecret: githubSecret };
}

const frontendUrl = (Bun.env.BELONG_FRONTEND_URL as string) || 'http://localhost:5091';

export const auth = betterAuth({
  baseURL: (Bun.env.BETTER_AUTH_URL as string) || 'http://localhost:5090',
  trustedOrigins: [frontendUrl],
  database: pool,
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      if (!transporter) {
        console.log('SMTP not configured. Password reset requested for:', {
          email: user.email,
          url,
        });
        return;
      }
      try {
        await transporter.sendMail({
          from: Bun.env.BELONG_SMTP_FROM as string,
          to: user.email,
          subject: 'Reset your Belong password',
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
        console.error(`Failed to send password reset email to ${user.email}:`, err);
      }
    },
  },
  plugins: [
    username(),
    anonymous(),
    bearer(),
    organization({
      schema: {
        organization: {
          additionalFields: {
            description: {
              type: 'string',
              defaultValue: '',
              input: true,
              required: false,
            },
            coverImage: {
              type: 'string',
              defaultValue: '',
              input: true,
              required: false,
            },
            isPublic: {
              type: 'boolean',
              defaultValue: false,
              input: true,
              required: false,
            },
          },
        },
      },
      async sendInvitationEmail(data) {
        if (!transporter) {
          console.log('SMTP not configured. Invitation for:', {
            email: data.email,
            org: data.organization.name,
            id: data.id,
          });
          return;
        }
        const inviteLink = `${frontendUrl}/invitation/${data.id}`;
        try {
          await transporter.sendMail({
            from: Bun.env.BELONG_SMTP_FROM as string,
            to: data.email,
            subject: `You're invited to join "${data.organization.name}" on Belong`,
            html: `
              <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
                <h1 style="color: #2D2926;">Belong</h1>
                <p><strong>${data.inviter.user.name}</strong> has invited you to join the family tree <strong>${data.organization.name}</strong>.</p>
                <a href="${inviteLink}"
                   style="display: inline-block; padding: 12px 24px; background: #7D6B3D; color: white;
                          text-decoration: none; border-radius: 6px; margin: 16px 0;">
                  Accept invitation
                </a>
                <p style="color: #5E5954; font-size: 14px;">
                  If you didn't expect this invitation, you can safely ignore this email.
                </p>
              </div>
            `,
          });
        } catch (err) {
          console.error(`Failed to send invitation email to ${data.email}:`, err);
        }
      },
    }),
  ],
  socialProviders: Object.keys(socialProviders).length > 0 ? socialProviders : undefined,
});
