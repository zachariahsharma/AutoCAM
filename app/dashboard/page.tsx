import DashboardPage from "./dashboard";
import { BoxTube, Plate } from "../types";

import db, { withAuth } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const boxTubes: BoxTube[] = [
  {
    name: '1x1 Aluminum Box Tube - 1/16"',
    quantity: 6,
    epic: "Drivetrain",
    status: "pending",
  },
  {
    name: '1x1 Aluminum Box Tube - 1/8"',
    quantity: 4,
    epic: "Drivetrain",
    status: "pending",
  },
  {
    name: '1x2 Aluminum Box Tube - 1/16"',
    quantity: 8,
    epic: "Structure",
    status: "pending",
  },
  {
    name: '1x2 Aluminum Box Tube - 1/8"',
    quantity: 3,
    epic: "Structure",
    status: "pending",
  },
  {
    name: '2x2 Aluminum Box Tube - 1/8"',
    quantity: 2,
    epic: "Manipulator",
    status: "in progress",
  },
  {
    name: '1x3 Aluminum Box Tube - 1/8"',
    quantity: 1,
    epic: "Superstructure",
    status: "completed",
  },
];

const plates: Plate[] = [
  {
    id: 1,
    width: 12,
    length: 24,
    true_depth: 0.125,
    category_id: 1,
    status: "pending",
    cam_download_url: null,
    screenshot_url: null,
  },
  {
    id: 2,
    width: 18,
    length: 30,
    true_depth: 0.25,
    category_id: 2,
    status: "in progress",
    cam_download_url: "https://example.com/cam/PLT-002.nc",
    screenshot_url: null,
  },
  {
    id: 3,
    width: 24,
    length: 36,
    true_depth: 0.125,
    category_id: 3,
    status: "completed",
    cam_download_url: "https://example.com/cam/PLT-003.nc",
    screenshot_url: "https://example.com/screenshots/PLT-003.png",
  },
];

export default async function Dashboard() {
  const session = (await auth.api.getSession({ headers: await headers() }))!;
  const partCategories = (await withAuth({ userId: session.user.id }, async tx => {
    return await tx.query.PartCategories.findMany({ with: { parts: true } })
  })).map(cat => ({
    ...cat,
    thickness: Number(cat.thickness)
  }));

  return (
    <DashboardPage
      partcats={partCategories}
      boxtubes={boxTubes}
      finishedcam={plates}
    />
  );
}
