import MaterialThickness from "./MaterialThickness";
import { MaterialEventsProvider } from "./materialEvents";

export default async function PC({
  params,
}: {
  params: Promise<{ id: string; teamid: string }>;
}) {
  let id = (await params).id;
  let teamid = (await params).teamid;
  return (
    <MaterialEventsProvider>
      <MaterialThickness pcid={id} teamid={teamid} />
    </MaterialEventsProvider>
  );
}
