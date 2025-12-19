import MaterialThickness from "./MaterialThickness";
import db from "@/lib/db";
import { PartCategory, Part } from "@/app/types";
import { notFound } from "next/navigation";

export default async function PC({
  params,
}: {
  params: Promise<{ id: number }>;
}) {
  const id = (await params).id;
  console.log("paramsid", id);
  const partcategory = await db.query.PartCategories.findFirst({
    where: (pc, { eq }) => eq(pc.id, Number(id)),
  });
  console.log(partcategory);
  if (!partcategory) notFound();

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
