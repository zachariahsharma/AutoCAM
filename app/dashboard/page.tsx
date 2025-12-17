import DashboardPage from "./dashboard";
import { BoxTube, Plate } from "../types";

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

const plates: Plate[] = [
  {
    id: 1,
    width: "12",
    length: "24",
    true_depth: "0.125",
    category_id: 1,
    status: "pending",
    cam_download_url: null,
    screenshot_url: null,
  },
  {
    id: 2,
    width: "18",
    length: "30",
    true_depth: "0.25",
    category_id: 2,
    status: "in progress",
    cam_download_url: "https://example.com/cam/PLT-002.nc",
    screenshot_url: null,
  },
  {
    id: 3,
    width: "24",
    length: "36",
    true_depth: "0.125",
    category_id: 3,
    status: "completed",
    cam_download_url: "https://example.com/cam/PLT-003.nc",
    screenshot_url: "https://example.com/screenshots/PLT-003.png",
  },
];

export default async function Dashboard() {
  const partCategories = (
    await db.query.PartCategories.findMany({ with: { parts: true } })
  ).map((cat) => ({
    ...cat,
    thickness: Number(cat.thickness),
  }));

  return (
    <DashboardPage
      partcats={partCategories}
      boxtubes={boxTubes}
      finishedcam={plates}
    />
  );
}
