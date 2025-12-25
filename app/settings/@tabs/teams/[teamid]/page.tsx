"use client";

import styles from "./team.module.css";
import { Material, Machine, Tool, Collaborator, ApiKey } from "@/app/types";
import { useEffect, useState } from "react";
import { PrimaryButton } from "@/components/Buttons/Buttons";
import FusionInputs from "./FusionInputs/FusionInputs";
import CollaboratorsSettingsPage from "./Collaborators/Collaborators";
import { useTabEvents } from "@/app/settings/teamUpdate";
import { useParams } from "next/navigation";
export function TeamName({
  oldTeamName,
  rename = true,
  handleFormSubmit,
}: {
  oldTeamName: string;
  rename?: boolean;
  handleFormSubmit: (teamName: string) => void;
}) {
  const [teamName, setTeamName] = useState(oldTeamName);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleFormSubmit(teamName);
      }}
    >
      <label>Team Name</label>
      <div id={styles.teamNameContainer}>
        <input
          type="text"
          placeholder="Add Team Name"
          value={teamName}
          min={3}
          onChange={(val) => setTeamName(val.target.value)}
        />
        <PrimaryButton id={styles.teamNameButton}>
          <span className="textGradient">{rename ? "Rename" : "Save"}</span>
        </PrimaryButton>
      </div>
    </form>
  );
}

export default function TeamSettingsPage({
  teamApiKeys,
}: {
  teamApiKeys: ApiKey[];
}) {
  const [teamName, setTeamName] = useState<string>("");
  const [materials, setMaterials] = useState<Material[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const { teamid } = useParams();
  const { teams } = useTabEvents();
  const [tools, setTools] = useState<Tool[]>([]);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  useEffect(() => {
    const idStr = Array.isArray(teamid) ? teamid[0] : teamid ?? "0";
    console.log("Loading team with id:", idStr);
    const teamIndex = parseInt(idStr, 10);
    const team = teams[teamIndex];
    if (team) {
      setTeamName(team.name);
      setMaterials(team.materials || []);
      setMachines(team.machines || []);
      setTools(team.tools || []);
      setCollaborators(team.collaborators || []);
    }
  }, [teamid, teams]);
  return (
    <div>
      <div className={styles.teamContainer}>
        <h1>{teamName}</h1>
        <hr />
        {teamName ? (
          <TeamName
            oldTeamName={teamName}
            handleFormSubmit={(newName) => {
              // Handle team name change
            }}
          />
        ) : null}
        <br />
        <FusionInputs
          defaultMachines={machines}
          defaultMaterials={materials}
          defaultTools={tools}
        />
      </div>
      <br />
      <CollaboratorsSettingsPage
        collaborators={collaborators}
        setCollaborators={setCollaborators}
      />
    </div>
  );
}
