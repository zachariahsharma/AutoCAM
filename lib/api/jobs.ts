import { asc, eq, isNull } from "drizzle-orm";
import { checkUserTeam, parseJsonBody, parseJsonFile, routeFactory, routeResponse } from ".";
import { JobKind, Jobs } from "../db/schema/cam";
import zod, { object } from "zod";
import { createSelectSchema } from "drizzle-zod";
import { client } from "../aws";
import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { scopeNames as scopes } from "../scopes";

const RequestSchema = createSelectSchema(Jobs).pick({ kind: true, payload: true });
export const Job = createSelectSchema(Jobs).omit({ team_id: true }).transform(x => {
  const JobStatus = zod.enum(["pending", "in progress", "completed"])
  let status: zod.infer<typeof JobStatus> = "pending";
  if (x.claimed_by) status = "in progress";
  if (x.response !== null) status = "completed";
  return { ...x, status };
});

export const Request = routeFactory(async (req, authType, tx) => {
  if (!authType.keyDigest) return routeResponse(401);
  const result = await tx.update(Jobs).set({ claimed_by: authType.keyDigest })
    .where(eq(Jobs.id, tx.select({ id: Jobs.id })
      .from(Jobs).where(isNull(Jobs.claimed_by))
      .orderBy(asc(Jobs.created_at))
      .for("update", { skipLocked: true }).limit(1))).returning({ id: Jobs.id }
    );
  if (result.length === 0) return routeResponse(204);
  const [{ id }] = result;
  const job = await tx.query.Jobs.findFirst({ where: eq(Jobs.id, id) });
  if (!job) return routeResponse(204);
  return routeResponse(200, await parseJsonBody(job, RequestSchema));
}, { requiredScopes: [scopes.jobs.process] });

export const Complete = routeFactory(async (req, authType, tx, id) => {
  if (!authType.keyDigest) return routeResponse(401);
  const job = await tx.query.Jobs.findFirst({
    where: eq(Jobs.claimed_by, authType.keyDigest)
  });
  if (!job) return routeResponse(404);
  const { data, files } = await parseJsonFile(await req.formData(), zod.object().catchall(zod.any()));
  const result = await tx.update(Jobs).set({ response: data }).where(eq(Jobs.id, job.id));
  if (result.rowCount === 0) return routeResponse(404);
  if ("file" in files) {
    await client.send(new PutObjectCommand({
      Bucket: process.env.AUTOCAM_BUCKET,
      Key: `teams/${job.team_id}/jobs/${job.id}`,
      ACL: "private",
      Body: await files["file"].bytes(),
      ContentType: files["file"].type
    }));
  }
  return routeResponse(204);
}, { requiredScopes: [scopes.jobs.process] });

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
}, { emailVerifiedNeeded: true, requiredScopes: [scopes.jobs.delete] });
