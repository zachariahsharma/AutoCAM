import DashboardPage from "./dashboard";
import { BoxTube } from "../types";
import db from "@/lib/db";

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
  const partCategories = (await db.query.PartCategories.findMany({ with: { parts: true } })).map(cat => ({
    ...cat,
    thickness: Number(cat.thickness),
  }));

  return (
    <DashboardPage
      partcats={partCategories}
      boxtubes={boxTubes}
    />
  );
}
