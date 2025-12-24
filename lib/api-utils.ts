import { auth, AuthType, getKeyDigest } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { DatabaseError } from "pg";
import zod, { ZodType } from "zod";

/**
 * Get authenticated user ID only (for operations that require email verification)
 */
export async function getUserId(): Promise<string | undefined> {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user.id;
}

/**
 * Get authentication context with both userId and keyDigest
 */
export async function getAuthType(): Promise<AuthType> {
  return {
    userId: await getUserId(),
    keyDigest: await getKeyDigest()
  };
}

export async function validateAuthType(authType: AuthType, emailVerifiedNeeded = false) {
  if (!(authType.userId || authType.keyDigest))
    throw routeResponse(401);
  if (emailVerifiedNeeded && authType.userId) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session)
      throw routeResponse(401);
    if (!session.user.emailVerified)
      throw routeResponse(403);
  }
}

/**
 * Validate and parse a parameter ID (converts to positive number)
 */
export async function parseParamId(paramValue: string): Promise<{ success: true; data: number } | { success: false; response: NextResponse }> {
  const result = await zod.coerce.number().positive().safeParseAsync(paramValue);
  if (!result.success) {
    return { success: false, response: NextResponse.json(result.error.issues, { status: 422 }) };
  }
  return { success: true, data: result.data };
}

/**
 * Validate and parse request body against a Zod schema
 */
export async function parseJsonBody<T extends ZodType>(json: unknown, schema: T): Promise<{ success: true; data: zod.infer<typeof schema> } | { success: false; response: NextResponse }> {
  const result = await schema.safeParseAsync(json);
  if (!result.success) {
    return { success: false, response: NextResponse.json(result.error.issues, { status: 422 }) };
  }
  return { success: true, data: result.data };
}

/**
 * Common error handling for database operations
 * Converts DatabaseError codes to appropriate HTTP status codes
 */
export function handleDatabaseError(err: unknown): NextResponse {
  if (err instanceof DatabaseError) {
    if (err.code === "42501") return routeResponse(403); // Permission denied
    if (err.code === "23505") return routeResponse(409); // Unique violation
  }
  throw err;
}

export function routeResponse(status = 200, data?: object) {
  if (data === undefined)
    return new NextResponse(null, { status });
  return NextResponse.json(data, { status });
}

export function checkAnyChanges(records: any[]) {
  return routeResponse(records.length === 0 ? 404 : 204);
}
