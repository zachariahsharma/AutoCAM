import DashboardPage from "./dashboard";
import { BoxTube, Plate } from "../../types";

const plates: Plate[] = [
  {
    id: 1,
    width: 12,
    length: 24,
    true_depth: 0.125,
    category_id: 1,
    status: "pending",
    cam_download_url: null,
    screenshot: null,
  },
  {
    id: 2,
    width: 18,
    length: 30,
    true_depth: 0.25,
    category_id: 2,
    status: "in progress",
    cam_download_url: "https://example.com/cam/PLT-002.nc",
    screenshot: null,
  },
  {
    id: 3,
    width: 24,
    length: 36,
    true_depth: 0.125,
    category_id: 3,
    status: "completed",
    cam_download_url: "https://example.com/cam/PLT-003.nc",
    screenshot: "https://example.com/screenshots/PLT-003.png",
  },
];

export default async function Dashboard() {
  return <DashboardPage finishedcam={plates} />;
}
