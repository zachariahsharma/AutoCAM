import { Part, Session } from "@/app/types";
import Layout from "@/components/layout";
import MaterialThickness from "@/components/MaterialThickness";
import { Imported, MTSession } from "@/lib/db";

type Props = {
  params: Promise<{
    material: string;
    thickness: string;
  }>
}

export default async function MT(props: Props) {
  const params = await props.params;
  const material = decodeURIComponent(params.material);
  const thickness = +decodeURIComponent(params.thickness);
  const session = await MTSession.findOne({ material, thickness }).select("-_id").lean();
  const [parts] = await Imported.aggregate([
    // 1. Join tasks to compute availability
    {
      $lookup: {
        from: "tasks",
        let: { child: "$child" },
        pipeline: [
          {
            $match: {
              $expr: { $in: ["$$child", "$Parts"] }
            }
          }
        ],
        as: "matchedTasks"
      }
    },

    // 2. Compute fields + detect Box Tubes
    {
      $addFields: {
        available: { $size: "$matchedTasks" },
        quantity: { $toInt: "$quantity" },
        isTube: {
          $regexMatch: {
            input: { $ifNull: ["$name", ""] },
            regex: /tube/i
          }
        }
      }
    },

    // 3. Split flow: tubes vs non-tubes
    {
      $facet: {
        // ---------- BOX TUBES ----------
        boxTubes: [
          { $match: { isTube: true } },
          {
            $project: {
              _id: 0,
              id: "$child",
              name: "$name",
              quantity: 1,
              available: 1
            }
          },
          { $sort: { name: 1, id: 1 } }
        ],

        // ---------- EPICS ----------
        epics: [
          { $match: { isTube: false } },
          {
            $group: {
              _id: { $ifNull: ["$epic", "Unknown Epic"] },
              parts: {
                $push: {
                  id: "$child",
                  name: "$name",
                  quantity: "$quantity",
                  available: "$available"
                }
              }
            }
          },
          {
            $project: {
              _id: 0,
              epic: "$_id",
              parts: {
                $sortArray: {
                  input: "$parts",
                  sortBy: { name: 1, id: 1 }
                }
              }
            }
          },
          { $sort: { epic: 1 } }
        ]
      }
    },

    // 4. Final shape
    {
      $project: {
        _id: 0,
        epics: 1,
        boxTubes: 1
      }
    }
  ]);
  parts.epics = Object.fromEntries(parts.epics.map((epic: { epic: string, parts: Part[] }) => [epic.epic, epic.parts]))
  return <Layout><MaterialThickness session={(session! as unknown) as Session} parts={parts} /></Layout>
}
