import { auth, AuthType, EmailNotVerifiedResponse, getKeyDigest, isEmailVerified, teamIdFromDigest } from "@/lib/auth";
import { withAuth } from "@/lib/db";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { DatabaseError } from "pg";
import zod, { ZodError, ZodObject } from "zod";

/**
 * Get authenticated user ID only (for operations that require email verification)
 */
export async function getUserId(): Promise<string | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user.id ?? null;
}

/**
 * Get authentication context with both userId and keyDigest
 */
export async function getAuthType(): Promise<AuthType> {
  return {
    userId: (await auth.api.getSession({ headers: await headers() }))?.user.id,
    keyDigest: await getKeyDigest()
  };
}

/**
 * Get authentication context and resolve team ID
 * Returns { authType, teamId } or null if unauthorized
 */
export async function getAuthAndTeamId(providedTeamId?: number): Promise<{ authType: AuthType; teamId: number } | null> {
  const authType = await getAuthType();

  if (authType.userId) {
    if (!providedTeamId) return null;
    return { authType, teamId: providedTeamId };
  } else if (authType.keyDigest) {
    const teamId = await teamIdFromDigest(authType.keyDigest);
    if (!teamId) return null;
    return { authType, teamId };
  }
  return null;
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
export async function parseJsonBody<T extends ZodObject>(json: unknown, schema: T): Promise<{ success: true; data: zod.infer<typeof schema> } | { success: false; response: NextResponse }> {
  const result = await schema.safeParseAsync(json);
  if (!result.success) {
    return { success: false, response: NextResponse.json(result.error.issues, { status: 422 }) };
  }
  return { success: true, data: result.data };
}

/**
 * Check email verification and return error if not verified
 * Only for userId-based auth
 */
export async function requireEmailVerified(): Promise<NextResponse | null> {
  if (!await isEmailVerified()) {
    return EmailNotVerifiedResponse;
  }
  return null;
}

/**
 * Check authentication and email verification
 * Returns NextResponse error or null if authorized
 */
export async function checkAuthWithEmailVerification(): Promise<NextResponse | null> {
  const userId = await getUserId();
  if (!userId) {
    return new NextResponse(null, { status: 401 });
  }
  return await requireEmailVerified();
}

/**
 * Common error handling for database operations
 * Converts DatabaseError codes to appropriate HTTP status codes
 */
export function handleDatabaseError(err: unknown): NextResponse {
  if (err instanceof DatabaseError) {
    if (err.code === "42501") return forbiddenResponse(); // Permission denied
    if (err.code === "23505") return new NextResponse(null, { status: 409 }); // Unique violation
  }
  throw err;
}

/**
 * Generic handler for not found responses
 */
export function notFoundResponse(): NextResponse {
  return new NextResponse(null, { status: 404 });
}

/**
 * Generic handler for no content responses
 */
export function noContentResponse(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

/**
 * Generic handler for created responses
 */
export function createdResponse<T extends Record<string, unknown>>(data: T, status = 201): NextResponse {
  return NextResponse.json(data, { status });
}

/**
 * Generic handler for OK responses
 */
export function okResponse<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

/**
 * Unauthorized response
 */
export function unauthorizedResponse(): NextResponse {
  return new NextResponse(null, { status: 401 });
}

/**
 * Forbidden response
 */
export function forbiddenResponse(): NextResponse {
  return new NextResponse(null, { status: 403 });
}
