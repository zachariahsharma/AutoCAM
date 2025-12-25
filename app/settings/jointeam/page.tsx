import JoinTeamSettingsPage from "./jointeam";
import { TeamInvite } from "@/app/types";

const mockInvites: TeamInvite[] = [
  {
    id: 1,
    teamName: "AutoCAM Devs",
  },
  {
    id: 2,
    teamName: "Project X",
  },
];
export default function JoinTeamPage({}) {
  return <JoinTeamSettingsPage mockInvites={mockInvites} />;
}
