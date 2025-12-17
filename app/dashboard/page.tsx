import DashboardPage from "./dashboard";
import { PartCategory, BoxTube, Plate } from "../types";

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

const plates: Plate[] = [
  {
    id: "PLT-001",
    Width: 12,
    Length: 24,
    trueDepth: 0.125,
    status: "pending",
  },
  {
    id: "PLT-002",
    Width: 18,
    Length: 30,
    trueDepth: 0.25,
    status: "in progress",
    cam_download_url: "https://example.com/cam/PLT-002.nc",
  },
  {
    id: "PLT-003",
    Width: 24,
    Length: 36,
    trueDepth: 0.125,
    status: "completed",
    cam_download_url: "https://example.com/cam/PLT-003.nc",
    screenshot_url: "https://example.com/screenshots/PLT-003.png",
  },
];

export default function Dashboard() {
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
      finishedcam={plates}
    />
  );
}
