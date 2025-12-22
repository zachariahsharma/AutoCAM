import MaterialThickness from "./MaterialThickness";
import db, { withAuth } from "@/lib/db";
import { PartCategory, Part } from "@/app/types";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { PartCategories } from "@/lib/schema/cam";
import { TeamMembers } from "@/lib/schema/entities";
import { getUserId } from "@/lib/api-utils";

export default async function PC({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = Number((await params).id);
  const partcategory = await withAuth({ userId: await getUserId() }, async tx => {
    return await tx.query.PartCategories.findFirst({
      with: { parts: true },
      where: eq(PartCategories.id, id),
    });
  });
  if (!partcategory) notFound();
  const mappedPartcategory = {
    ...partcategory,
    thickness: Number(partcategory.thickness),
  } as unknown as PartCategory;

  const epicsMap: { [key: string]: Part[] } = {};
  partcategory.parts.forEach((part) => {
    const epicKey = part.epic || "default";
    if (!epicsMap[epicKey]) {
      epicsMap[epicKey] = [];
    }
    epicsMap[epicKey].push(part);
  });
  return <MaterialThickness partcategory={mappedPartcategory} epicsMap={epicsMap} />;
}
