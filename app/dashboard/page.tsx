import DashboardPage from "./dashboard";

export interface Part {
  name: string;
  quantity: number;
  epic: string;
}

export interface PartCategory {
  material: string;
  thickness: number;
  parts: Part[];
}
const aluminum125: PartCategory = {
  material: "aluminum",
  thickness: 0.125,
  parts: [
    { name: "Side Plate", quantity: 2, epic: "Drivetrain" },
    { name: "Bearing Block", quantity: 4, epic: "Drivetrain" },
    { name: "Gusset", quantity: 8, epic: "Structure" },
  ],
};
export default function Dashboard() {
  return <DashboardPage partcats={[]} />;
}
