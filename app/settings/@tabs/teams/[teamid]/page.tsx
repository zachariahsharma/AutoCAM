import TeamSettingsPage from "./team";
import { Material, Machine, Tool, Collaborator, ApiKey } from "@/app/types";

const name: string = "Valor 6800";
const materials: Material[] = [
  {
    id: 1,
    name: "AL 6061",
  },
  {
    id: 2,
    name: "AL 7075",
  },
  {
    id: 3,
    name: "Polycarbonate",
  },
  {
    id: 4,
    name: "SRPP",
  },
];
const machines: Machine[] = [
  {
    id: 1,
    name: "Laguna Swift",
    file: "swift.cps",
  },
  {
    id: 2,
    name: "Laguna IQ",
    file: "iq.cps",
  },
  {
    id: 3,
    name: "Tormach 1100MX",
    file: "pathpilot.cps",
  },
  {
    id: 4,
    name: "Tormach PCNC",
    file: "pathpilot.cps",
  },
];
const tools: Tool[] = [
  {
    id: 1,
    name: "SwiftPolycarb",
    materials: [materials[2]],
    machines: [machines[0]],
    file: "SwiftPolycarb.json",
  },
  {
    id: 2,
    name: "SwiftFull",
    materials: [materials[2], materials[0]],
    machines: [machines[0]],
    file: "SwiftFull.json",
  },
  {
    id: 3,
    name: "FullPolycarb",
    materials: [materials[2]],
    machines: [machines[0], machines[1]],
    file: "FullPolycarb.json",
  },
  {
    id: 4,
    name: "Full",
    materials: materials,
    machines: machines,
    file: "Full.json",
  },
];

const collaborators: Collaborator[] = [
  {
    id: 1,
    name: "Ishan",
    email: "ishan.karmakar33@k12.leanderisd.org",
    role: "Admin",
  },
  {
    id: 2,
    name: "Ishan",
    email: "ishan.karmakar33@k12.leanderisd.org",
    role: "Member",
  },
  {
    id: 3,
    name: "Ishan",
    email: "ishan.karmakar33@k12.leanderisd.org",
    role: "pending",
  },
  {
    id: 4,
    name: "Ishan",
    email: "ishan.karmakar33@k12.leanderisd.org",
    role: "Member",
  },
];

const apikeys: ApiKey[] = [
  {
    id: 1,
    name: "Beans",
    startchars: "1dbd",
  },
  {
    id: 2,
    name: "Beans",
    startchars: "1dbd",
  },
  {
    id: 3,
    name: "Beans",
    startchars: "1dbd",
  },
  {
    id: 4,
    name: "Beans",
    startchars: "1dbd",
  },
];
export default async function Team({
  params,
}: {
  params: Promise<{ teamid: string }>;
}) {
  const teamid = (await params).teamid;
  const teamName: string = name;
  const teamMaterials: Material[] = materials;
  const teamMachines: Machine[] = machines
  const teamTools: Tool[] = tools;
  const teamCollaborators: Collaborator[] = collaborators;
  const teamApiKeys: ApiKey[] = apikeys;
  return (
    <TeamSettingsPage
      teamid={teamid}
      teamName={teamName}
      teamMaterials={teamMaterials}
      teamMachines={teamMachines}
      teamTools={teamTools}
      teamCollaborators={teamCollaborators}
      teamApiKeys={teamApiKeys}
    />
  );
}
