import { auth, teamIdFromDigest } from "@/lib/auth";
import { withAuth } from "@/lib/db";
import { TeamMembers, Teams } from "@/lib/schema/entities";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextRequest } from "next/server";
import zod from "zod";
import { 
  getAuthType, 
  parseJsonBody, 
  requireEmailVerified, 
  checkAuthWithEmailVerification,
  createdResponse,
  okResponse,
  unauthorizedResponse,
  noContentResponse,
  notFoundResponse,
  handleDatabaseError
} from "@/lib/api-utils";

const CreateInput = zod.object({
  name: zod.string(),
  number: zod.coerce.number().positive(),
});

export async function POST(req: NextRequest) {
  const authError = await checkAuthWithEmailVerification();
  if (authError) return authError;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return unauthorizedResponse();

  const bodyResult = await parseJsonBody(await req.json(), CreateInput);
  if (!bodyResult.success) return bodyResult.response;

  return await withAuth({ userId: session.user.id }, async tx => {
    try {
      const [team] = await tx.insert(Teams).values({
        ...bodyResult.data,
        created_by: session.user.id,
      }).returning({ id: Teams.id });

      // Assign current user to this team
      await tx.insert(TeamMembers).values({
        user_id: session.user.id,
        team_id: team.id,
        admin: true,
      });
      return createdResponse({ id: team.id });
    } catch (err) {
      return handleDatabaseError(err);
    }
  });
}

export async function GET() {
  const authType = await getAuthType();
  if (authType.userId) {
    return await withAuth(authType, async tx => {
      return okResponse(await tx.query.Teams.findMany());
    });
  } else if (authType.keyDigest) {
    return await withAuth(authType, async tx => {
      return okResponse(await tx.query.Teams.findFirst());
    });
  } else {
    return unauthorizedResponse();
  }
}

export async function PATCH(req: NextRequest) {
  return await updateTeam(await req.json());
}

const UpdateInput = zod.object({
  number: zod.coerce.number().positive().optional(),
  name: zod.string().optional(),
});

export async function updateTeam(json: object, teamId?: number) {
  const authType = await getAuthType();
  
  if (authType.userId) {
    const emailError = await requireEmailVerified();
    if (emailError) return emailError;
  } else if (authType.keyDigest) {
    teamId = await teamIdFromDigest(authType.keyDigest);
  } else {
    return unauthorizedResponse();
  }
  
  if (!teamId) return unauthorizedResponse();

  const bodyResult = await parseJsonBody(json, UpdateInput);
  if (!bodyResult.success) return bodyResult.response;

  return await withAuth(authType, async tx => {
    try {
      const updated = await tx.update(Teams)
        .set(bodyResult.data)
        .where(eq(Teams.id, teamId))
        .returning({ id: Teams.id });
      if (updated.length === 0) return notFoundResponse();
      return noContentResponse();
    } catch (err) {
      return handleDatabaseError(err);
    }
  });
}
