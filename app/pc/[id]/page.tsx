import MaterialThickness from "./MaterialThickness";
import db from "@/lib/db";
import { PartCategory, Part } from "@/app/types";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { PartCategories } from "@/lib/schema/cam";
import { TeamMembers } from "@/lib/schema/entities";

export default async function PC({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const userId = (await auth.api.getSession({ headers: await headers() }))!.user.id;
  const id = Number((await params).id);
  const partcategory = await db.query.PartCategories.findFirst({
    where: eq(PartCategories.id, id),
    with: {
      team: {
        with: {
          teamMembers: {
            where: eq(TeamMembers.user_id, userId)
          }
        }
      }
    }
  });
  if (!partcategory || partcategory.team.teamMembers.length === 0) notFound();
  const mappedPartcategory = {
    ...partcategory,
    thickness: Number(partcategory.thickness),
  } as unknown as PartCategory;

  const parts = await db.query.Parts.findMany({
    where: (parts, { eq, and }) =>
      and(eq(parts.category_id, mappedPartcategory?.id || 0)),
  });
  const epicsMap: { [key: string]: Part[] } = {};
  parts.forEach((part) => {
    const epicKey = part.epic || "default";
    if (!epicsMap[epicKey]) {
      epicsMap[epicKey] = [];
    }
    epicsMap[epicKey].push(part);
  });
  return <MaterialThickness partcategory={mappedPartcategory} epicsMap={epicsMap} />;
}
