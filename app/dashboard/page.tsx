import DashboardPage from "./dashboard";
import { PartCategory, BoxTube } from "../types";
import db from "@/lib/db";
import { PartCategories, Parts } from "@/lib/schema";

const aluminum125: PartCategory = {
  material: "Aluminum",
  thickness: 0.125,
  parts: [
    { name: "Side Plate", quantity: 2, epic: "Drivetrain" },
    { name: "Bearing Block", quantity: 4, epic: "Drivetrain" },
    { name: "Gusset", quantity: 8, epic: "Structure" },
  ],
};

const boxTubes: BoxTube[] = [
  {
    name: '1x1 Aluminum Box Tube – 1/16"',
    quantity: 6,
    epic: "Drivetrain",
    cammed: false,
  },
  {
    name: '1x1 Aluminum Box Tube – 1/8"',
    quantity: 4,
    epic: "Drivetrain",
    cammed: false,
  },
  {
    name: '1x2 Aluminum Box Tube – 1/16"',
    quantity: 8,
    epic: "Structure",
    cammed: false,
  },
  {
    name: '1x2 Aluminum Box Tube – 1/8"',
    quantity: 3,
    epic: "Structure",
    cammed: false,
  },
  {
    name: '2x2 Aluminum Box Tube – 1/8"',
    quantity: 2,
    epic: "Manipulator",
    cammed: "in progress",
  },
  {
    name: '1x3 Aluminum Box Tube – 1/8"',
    quantity: 1,
    epic: "Superstructure",
    cammed: true,
  },
];
export default async function Dashboard() {
  const partCategories = await db.query.PartCategories.findMany({ with: { parts: true } });
  console.log(partCategories);

  return (
    <DashboardPage
      partcats={[
        aluminum125,
        aluminum125,
        aluminum125,
        aluminum125,
        aluminum125,
        aluminum125,
        aluminum125,
        aluminum125,
        aluminum125,
        aluminum125,
      ]}
      boxtubes={boxTubes}
    />
  );
}
