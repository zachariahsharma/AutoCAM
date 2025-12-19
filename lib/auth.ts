import { betterAuth } from "better-auth";
import db from "./db";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import * as schema from './schema/auth';
import transporter from "./mailer";
import { NextRequest, NextResponse } from "next/server";

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
  baseURL: process.env.BASE_URL,
})

export async function isEmailVerified(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return false;
  return session.user.emailVerified;
}
export const EmailNotVerifiedResponse = new NextResponse(null, { status: 401 });
