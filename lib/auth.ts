import { betterAuth } from "better-auth";
import db from "./db";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import * as schema from '../auth-schema';
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  secure: false,
  port: 587,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  }
});

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { ...schema }
  }),
  emailAndPassword: { enabled: true },
  emailVerification: {
    async sendVerificationEmail({ user, url }) {
      await transporter.sendMail({
        from: '"AutoCAM" <ishan.karmakar24@gmail.com>',
        to: user.email,
        subject: "Verify your AutoCAM email!",
        text: `Click the link to verify your email: ${url}`
      })
    },
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
  },
  baseURL: "http://localhost:3000"
})
