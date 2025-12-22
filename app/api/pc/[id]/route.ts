import { withAuth } from "@/lib/db";
import { PartCategories } from "@/lib/schema/cam";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";
import zod from "zod";
import {
  getAuthType,
  requireEmailVerified,
  parseParamId,
  parseJsonBody,
  handleDatabaseError,
  routeResponse
} from "@/lib/api-utils";

export interface Props {
  params: Promise<{ id: string }>
};

const UpdateInput = zod.object({
  material: zod.string().optional(),
  thickness: zod.number().optional(),
});

export async function PATCH(req: NextRequest, { params }: Props) {
  const authType = await getAuthType();
  if (authType.userId) {
    const emailError = await requireEmailVerified();
    if (emailError) return emailError;
  }

  const categoryIdResult = await parseParamId((await params).id);
  if (!categoryIdResult.success) return categoryIdResult.response;
  
  const bodyResult = await parseJsonBody(await req.json(), UpdateInput);
  if (!bodyResult.success) return bodyResult.response;

  return withAuth(authType, async tx => {
    try {
      const categories = await tx.update(PartCategories).set({
        ...bodyResult.data,
        thickness: bodyResult.data.thickness?.toString(),
      }).where(eq(PartCategories.id, categoryIdResult.data)).returning({ id: PartCategories.id });
      if (categories.length === 0) return routeResponse(404);
      return routeResponse(201);
    } catch (err) {
      return handleDatabaseError(err);
    }
  });
}

export async function DELETE(req: NextRequest, { params }: Props) {
  const authType = await getAuthType();
  if (authType.userId) {
    const emailError = await requireEmailVerified();
    if (emailError) return emailError;
  }

  const categoryIdResult = await parseParamId((await params).id);
  if (!categoryIdResult.success) return categoryIdResult.response;
  
  return await withAuth(authType, async tx => {
    try {
      const categories = await tx.delete(PartCategories)
        .where(eq(PartCategories.id, categoryIdResult.data))
        .returning({ id: PartCategories.id });
      if (categories.length === 0) return routeResponse(404);
      return routeResponse(204);
    } catch (err) {
      return handleDatabaseError(err);
    }
  });
}
