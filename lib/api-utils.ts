import { auth, AuthType, getKeyDigest } from "@/lib/auth";
import { DrizzleQueryError } from "drizzle-orm";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { DatabaseError } from "pg";
import zod, { ZodType } from "zod";
import db, { Transaction, withAuth } from "./db";

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
  console.log(authType);
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
export async function parseParamId(paramValue: string): Promise<number> {
  const result = await zod.coerce.number().positive().safeParseAsync(paramValue);
  if (!result.success) {
    throw NextResponse.json(result.error.issues, { status: 422 });
  }
  return result.data;
}

/**!==
 * Validate and parse request body against a Zod schema
 */
export async function parseJsonBody<T extends ZodType>(json: unknown, schema: T): Promise<zod.infer<typeof schema>> {
  const result = await schema.safeParseAsync(json);
  if (!result.success) {
    throw NextResponse.json(result.error.issues, { status: 422 });
  }
  return result.data;
}

export async function parseJsonFile<T extends ZodType>(formData: FormData, schema: T, preprocess: (data: object, file: ArrayBuffer) => object | Promise<object>): ReturnType<typeof parseJsonBody<T>> {
  const json = formData.get("data");
  if (typeof json !== "string") {
    const error: zod.core.$ZodIssue = {
      code: "invalid_type",
      expected: "string",
      path: [],
      message: 'Form Data type for "data" is not a string'
    };
    throw routeResponse(422, error);
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    const error: zod.core.$ZodIssue = {
      code: "invalid_type",
      expected: "file",
      path: [],
      message: 'Form Data type for "file" is not a file'
    };
    throw routeResponse(422, error);
  }

  let data: object;
  try {
    data = JSON.parse(json);
  } catch {
    const error: zod.core.$ZodIssue = {
      code: "invalid_type",
      expected: "object",
      path: [],
      message: 'Unable to parse JSON in "data"'
    };
    throw routeResponse(422, error);
  }

  return await parseJsonBody(await preprocess(data, await file.arrayBuffer()), schema);
}

/**
 * Common error handling for database operations
 * Converts DatabaseError codes to appropriate HTTP status codes
 */
export function handleDatabaseError(err: unknown): NextResponse {
  let cause = err;
  if (err instanceof DrizzleQueryError)
    cause = err.cause as DatabaseError;
  if (cause instanceof DatabaseError) {
    if (cause.code === "42501") return routeResponse(403); // Permission denied
    if (cause.code === "23505") return routeResponse(409); // Unique violation
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

export function routeFactory<T>(callback: (req: NextRequest, authType: AuthType, tx: Transaction, params: T) => Promise<NextResponse>) {
  return async (req: NextRequest, { params }: { params: Promise<T> }) => {
    const authType = await getAuthType();
    try { await validateAuthType(authType); }
    catch (err) { return err; }

    return withAuth(authType, async tx => {
      try {
        callback(req, authType, tx, await params)
      } catch (err) {
        if (err instanceof NextResponse) return err;
        if (err instanceof DatabaseError || err instanceof DrizzleQueryError)
          return handleDatabaseError(err);
        throw err;
      }
    });
  }
}
