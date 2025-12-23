import { betterAuth } from "better-auth";
import db, { withAuth } from "./db";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import * as schema from './schema/auth';
import transporter from "./mailer";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import crypto from "crypto";
import { eq } from "drizzle-orm";
import { TeamKeys } from "./schema/entities";
import { routeResponse } from "./api-utils";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { ...schema }
  }),
  emailAndPassword: { enabled: true },
  emailVerification: {
    async sendVerificationEmail({ user, url }) {
      console.log();
      await transporter.sendMail({
        from: `"AutoCAM" <${process.env.SMTP_SENDER}>`,
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

export async function getKeyDigest() {
  const authHeader = (await headers()).get("authorization");
  if (!authHeader) return;
  const token = authHeader.split("Bearer ")[1];
  return crypto.createHmac("sha256", "key").update(token).digest("hex");
}
export const APIKeyInvalidResponse = new NextResponse(null, { status: 401 });

export async function teamIdFromDigest(digest: string) {
  const teamId = await withAuth({ keyDigest: digest }, async tx => {
    return (await tx.query.TeamKeys.findFirst({
      where: eq(TeamKeys.digest, digest)
    }))?.team_id;
  });
  if (!teamId) throw routeResponse(401);
  return teamId;
}

export interface AuthType {
  keyDigest?: string;
  userId?: string;
};
