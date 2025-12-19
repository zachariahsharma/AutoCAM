import { Part, Session } from "@/app/types";
import Layout from "@/components/layout";
import MaterialThickness from "./MaterialThickness";
import db from "@/lib/db";

export default async function PC({
  params,
}: {
  params: Promise<{ id: number }>;
}) {
  const categoryId = (await params).id;
  const category = db.query.PartCategories.findFirst({
    with: { parts: true, plates: true },
    where: (partCategories, { eq }) => eq(partCategories.id, categoryId),
  });
  const session = await MTSession.findOne({ material, thickness })
    .select("-_id")
    .lean();
  parts.epics = Object.fromEntries(
    parts.epics.map((epic: { epic: string; parts: Part[] }) => [
      epic.epic,
      epic.parts,
    ])
  );
  return (
    <Layout>
      <MaterialThickness
        session={session! as unknown as Session}
        parts={parts}
      />
    </Layout>
  );
}
