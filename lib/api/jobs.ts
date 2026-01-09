import { and, asc, eq, getTableColumns, isNull, sql } from "drizzle-orm";
import { JobKind, Jobs } from "../db/schema/cam";
import zod, { ZodType } from "zod";
import { createSelectSchema, Json } from "drizzle-zod";
import { client } from "../aws";
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { scopeNames as scopes } from "../scopes";
import { teamIdFromDigest } from "../auth/server";
import { Transaction } from "../db";
import { routeFactory, routeResponse, parseSchema, checkUserTeam, parseFormData } from "./common";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const RequestSchema = createSelectSchema(Jobs).pick({ kind: true, payload: true });
export const Job = createSelectSchema(Jobs).extend({
  queue_position: zod.number()
}).omit({ team_id: true }).transform(x => {
  let status = "pending";
  if (x.claimed_by) status = "in progress";
  if (x.response !== null) status = "completed";
  return { ...x, status };
}).openapi("Job");

const SuccessJobResponse = zod.object({
  file: zod.instanceof(File),
  data: zod.strictObject({})
})

const ErrorJobResponse = zod.object({
  data: zod.object({
    error: zod.string()
  })
});

const JobResponses = {
  "box_tube": zod.union([SuccessJobResponse, ErrorJobResponse]),
  "plate:cam": zod.union([SuccessJobResponse, ErrorJobResponse]),
  "plate:arrange": zod.union([SuccessJobResponse, ErrorJobResponse.extend({
    data: ErrorJobResponse.shape.data.extend({
      excess_parts: zod.array(zod.object({
        part_id: zod.number(),
        quantity: zod.number()
      }))
    })
  })])
} as const satisfies Record<(typeof JobKind.enumValues)[number], ZodType>;

export function queuePositionSubquery(tx: Transaction) {
  return tx.select({
    ...getTableColumns(Jobs),
    queue_position: sql<number>`ROW_NUMBER() OVER (
      PARTITION BY ${Jobs.team_id}
      ORDER BY ${Jobs.created_at} ASC
    )`.mapWith(Number).as("queue_position")
  }).from(Jobs).as('job');
}

export const SingleGET = routeFactory(async (req, authType, tx, id) => {
  if (!id) return routeResponse(422);
  const job = await tx.query.Jobs.findFirst({ where: eq(Jobs.id, id) });
  if (!job) return routeResponse(404);
  await checkUserTeam(tx, authType, job.team_id);
  return routeResponse(200, {
    // FIXME: Move file into schema and move parseJsonBody up a level
    ...await parseJsonBody(job, Job),
    file: await getSignedUrl(client, new GetObjectCommand({
      Bucket: process.env.AUTOCAM_BUCKET,
      Key: `teams/${job.team_id}/jobs/${id}`
    }), { expiresIn: 120 })
  })
}, { apiKey: { scopes: [scopes.jobs.read] } });

export const Request = routeFactory(async (req, authType, tx) => {
  if (!authType.keyDigest) return routeResponse(401);
  const teamId = await teamIdFromDigest(tx, authType);
  const result = await tx.update(Jobs).set({ claimed_by: authType.keyDigest })
    .where(eq(Jobs.id, tx.select({ id: Jobs.id })
      .from(Jobs).where(and(eq(Jobs.team_id, teamId), isNull(Jobs.claimed_by)))
      .orderBy(asc(Jobs.created_at))
      .for("update", { skipLocked: true }).limit(1))).returning();
  if (result.length === 0) return routeResponse(204);
  const [job] = result;
  return routeResponse(200, await parseSchema(job, RequestSchema));
}, { apiKey: { scopes: [scopes.jobs.process] } });

export const Complete = routeFactory(async (req, authType, tx) => {
  if (!authType.keyDigest) return routeResponse(401);
  const job = await tx.query.Jobs.findFirst({
    where: and(
      eq(Jobs.claimed_by, authType.keyDigest),
      isNull(Jobs.response)
    )
  });
  if (!job) return routeResponse(404);
  const body = await parseFormData(await req.formData(), JobResponses[job.kind]);
  const result = await tx.update(Jobs).set({ response: body.data }).where(eq(Jobs.id, job.id));
  if (result.rowCount === 0) return routeResponse(404);
  if ("file" in body) {
    await client.send(new PutObjectCommand({
      Bucket: process.env.AUTOCAM_BUCKET,
      Key: `teams/${job.team_id}/jobs/${job.id}`,
      ACL: "private",
      Body: await body.file.bytes(),
      ContentType: body.file.type
    }));
  }
  return routeResponse(204);
}, { apiKey: { scopes: [scopes.jobs.process] } });

export const DELETE = routeFactory(async (req, authType, tx, id) => {
  if (!id) return routeResponse(422);
  const job = await tx.query.Jobs.findFirst({ where: eq(Jobs.id, id) });
  if (!job) return routeResponse(404);
  await checkUserTeam(tx, authType, job.team_id);

  await tx.delete(Jobs).where(eq(Jobs.id, id));
  await client.send(new DeleteObjectCommand({
    Bucket: process.env.AUTOCAM_BUCKET,
    Key: `teams/${job.team_id}/jobs/${id}`
  }));
}, { user: { emailVerified: true }, apiKey: { scopes: [scopes.jobs.delete] } });
function parseJsonBody(job: { id: number; created_at: Date; team_id: number; kind: "plate:arrange" | "plate:cam" | "box_tube"; claimed_by: string | null; payload: unknown; response: unknown; }, Job: zod.ZodPipe<zod.ZodObject<{ id: zod.ZodInt; created_at: zod.ZodDate; kind: zod.ZodEnum<{ "plate:arrange": "plate:arrange"; "plate:cam": "plate:cam"; box_tube: "box_tube"; }>; claimed_by: zod.ZodNullable<zod.ZodString>; payload: zod.ZodType<Json, unknown, zod.core.$ZodTypeInternals<Json, unknown>>; response: zod.ZodNullable<zod.ZodType<Json, unknown, zod.core.$ZodTypeInternals<Json, unknown>>>; queue_position: zod.ZodNumber; }, { out: {}; in: {}; }>, zod.ZodTransform<{ status: string; id: number; created_at: Date; kind: "plate:arrange" | "plate:cam" | "box_tube"; claimed_by: string | null; payload: Json; response: Json; queue_position: number; }, { id: number; created_at: Date; kind: "plate:arrange" | "plate:cam" | "box_tube"; claimed_by: string | null; payload: Json; response: Json; queue_position: number; }>>): object | PromiseLike<object | undefined> | undefined {
  throw new Error("Function not implemented.");
}

