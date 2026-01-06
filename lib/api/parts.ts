import { PartCategories, Parts } from "@/lib/db/schema/cam";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-zod";
import zod from "zod";
import { registry } from "@/lib/openapi/registry";
import { apiKey, userSession } from "./auth";
import { scopeNames as scopes } from "../scopes";
import { checkUserTeam, CommonAuthorization, Conflict, parseJsonBody, parseJsonFile, routeFactory, routeResponse, ValidationError } from "./common";
import { eq } from "drizzle-orm";
import { client } from "../aws";
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const CreateSchema = createInsertSchema(Parts).omit({ category_id: true, original_quantity: true });
const UpdateSchema = createUpdateSchema(Parts).omit({ category_id: true, original_quantity: true });
const Part = createSelectSchema(Parts).extend({ file: zod.httpUrl() }).omit({ category_id: true }).openapi("Part");
const MultipleParts = zod.array(Part.omit({ file: true }));

registry.registerPath({
  method: "get",
  path: "/api/pc/{id}/parts",
  tags: ["Parts"],
  security: [
    { [userSession.name]: [] },
    { [apiKey.name]: [scopes.parts.read] }
  ],
  summary: "Get Parts",
  request: {
    params: zod.object({ id: zod.number().openapi({ description: "ID of the part category" }) })
  },
  responses: {
    200: {
      description: "This endpoint returns the parts from the given part category",
      content: {
        "application/json": {
          schema: MultipleParts
        }
      }
    },
    ...CommonAuthorization,
    ...ValidationError
  }
});

registry.registerPath({
  method: "post",
  path: "/api/pc/{id}/parts",
  tags: ["Parts"],
  summary: "Create Part",
  description: "This endpoint requires the user's email to be verified",
  security: [
    { [userSession.name]: [] },
    { [apiKey.name]: [scopes.parts.write] }
  ],
  request: {
    params: zod.object({ id: zod.number().openapi({ description: "ID of the part category" }) }),
    body: {
      content: {
        "multipart/form-data": {
          schema: zod.object({
            data: CreateSchema.openapi({ description: "Part info as stringified JSON" }),
            file: zod.instanceof(File).openapi({ type: "string", format: "binary", description: "Part file upload" })
          })
        }
      }
    }
  },
  responses: {
    201: {
      description: "Returns the ID of the created part",
      content: {
        "application/json": {
          schema: zod.object({ id: zod.number() })
        }
      }
    },
    ...CommonAuthorization,
    ...ValidationError,
    ...Conflict
  }
});

registry.registerPath({
  method: "patch",
  path: "/api/parts/{id}",
  tags: ["Parts"],
  summary: "Update Part",
  description: "This endpoint requires the user's email to be verified",
  security: [
    { [userSession.name]: [] },
    { [apiKey.name]: [scopes.parts.write] }
  ],
  request: {
    params: zod.object({ id: zod.number().openapi({ description: "ID of the part" }) }),
    body: {
      content: {
        "application/json": {
          schema: UpdateSchema
        }
      }
    }
  },
  responses: {
    204: {
      description: "Part updated successfully",
    },
    ...CommonAuthorization,
    ...ValidationError
  }
});

registry.registerPath({
  method: "delete",
  path: "/api/parts/{id}",
  tags: ["Parts"],
  summary: "Delete Part",
  description: "This endpoint requires the user's email to be verified",
  security: [
    { [userSession.name]: [] },
    { [apiKey.name]: [scopes.parts.write] }
  ],
  request: {
    params: zod.object({ id: zod.number().openapi({ description: "ID of the part" }) }),
  },
  responses: {
    204: {
      description: "Part deleted successfully",
    },
    ...CommonAuthorization,
    ...ValidationError
  }
});

export const GET = routeFactory(async (req, authType, tx, id) => {
  if (!id) return routeResponse(422);
  const pc = await tx.query.PartCategories.findFirst({ where: eq(PartCategories.id, id) });
  await checkUserTeam(tx, authType, pc?.team_id);
  return routeResponse(200, await parseJsonBody(await tx.query.Parts.findMany({
    where: eq(Parts.category_id, id)
  }), MultipleParts));
}, { requiredScopes: [scopes.parts.read] });

export const SingleGET = routeFactory(async (req, authType, tx, id) => {
  if (!id) return routeResponse(422);
  const part = await tx.query.Parts.findFirst({
    where: eq(Parts.id, id),
    with: { category: true }
  });
  if (!part) return routeResponse(404);
  await checkUserTeam(tx, authType, part.category.team_id);
  return routeResponse(200, await parseJsonBody({
    ...part,
    file: await getSignedUrl(client, new GetObjectCommand({
      Bucket: process.env.AUTOCAM_BUCKET,
      Key: `teams/${part.category.team_id}/pc/${part.category_id}/parts/${id}`
    }), { expiresIn: 120 })
  }, Part));
}, { requiredScopes: [scopes.parts.read] });

export const POST = routeFactory(async (req, authType, tx, category_id) => {
  if (!category_id) return routeResponse(422);
  const pc = await tx.query.PartCategories.findFirst({ where: eq(PartCategories.id, category_id) });
  await checkUserTeam(tx, authType, pc?.team_id);
  const { data, files } = await parseJsonFile(await req.formData(), CreateSchema);
  if (!data) return routeResponse(422);
  const [id] = await tx
    .insert(Parts)
    .values({ ...data, original_quantity: data.quantity, category_id })
    .returning({ id: Parts.id });
  const { team_id } = (await tx.query.PartCategories.findFirst({ where: eq(PartCategories.id, category_id) }))!;
  await client.send(new PutObjectCommand({
    Bucket: process.env.AUTOCAM_BUCKET,
    Key: `teams/${team_id}/pc/${category_id}/parts/${id.id}`,
    ACL: "private",
    Body: await files["file"].bytes(),
    ContentType: files["file"].type
  }));
  return routeResponse(201, id);
}, { emailVerifiedNeeded: true, requiredScopes: [scopes.parts.write] });

export const PATCH = routeFactory(async (req, authType, tx, id) => {
  if (!id) return routeResponse(422);
  const part = await tx.query.Parts.findFirst({
    where: eq(Parts.id, id),
    with: { category: true }
  });
  await checkUserTeam(tx, authType, part?.category.team_id);
  const body = await parseJsonBody(await req.json(), UpdateSchema);
  return tx.update(Parts).set(body).where(eq(Parts.id, id)).returning({ id: Parts.id });
}, { emailVerifiedNeeded: true, requiredScopes: [scopes.parts.write] });

export const DELETE = routeFactory(async (req, authType, tx, id) => {
  if (!id) return routeResponse(422);
  const part = await tx.query.Parts.findFirst({
    where: eq(Parts.id, id),
    with: { category: true }
  });
  if (!part) return routeResponse(404);
  await checkUserTeam(tx, authType, part.category.team_id);
  await tx.delete(Parts).where(eq(Parts.id, id));
  const { team_id } = (await tx.query.PartCategories.findFirst({ where: eq(PartCategories.id, part.category_id) }))!;
  await client.send(new DeleteObjectCommand({
    Bucket: process.env.AUTOCAM_BUCKET,
    Key: `teams/${team_id}/pc/${part.category_id}/parts/${id}`
  }));
}, { emailVerifiedNeeded: true, requiredScopes: [scopes.parts.write] })
