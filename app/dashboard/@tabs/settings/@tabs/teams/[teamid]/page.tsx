"use client";

import styles from "./team.module.css";
import { Material, Machine, Tool, Collaborator, ApiKey } from "@/app/types";
import { useEffect, useState } from "react";
import { PrimaryButton } from "@/components/Buttons/Buttons";
import FusionInputs from "./FusionInputs/FusionInputs";
import CollaboratorsSettingsPage from "./Collaborators/Collaborators";
import { useTabEvents } from "@/app/settings/teamUpdate";
import { useParams } from "next/navigation";
import ApiKeys from "./ApiKeys/ApiKeys";
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

export default function TeamSettingsPage() {
  const [teamName, setTeamName] = useState<string>("");
  const [materials, setMaterials] = useState<Material[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const { teamid } = useParams();
  const [teamDbId, setTeamDbId] = useState<number>(0);
  const { teams, notifyUpdate } = useTabEvents();
  const [tools, setTools] = useState<Tool[]>([]);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  useEffect(() => {
    const idStr = Array.isArray(teamid) ? teamid[0] : teamid ?? "0";
    const teamIndex = parseInt(idStr, 10);
    console.log("Loading team with id:", idStr, "and index:", teamIndex);
    const team = teams[teamIndex];
    if (team) {
      setTeamName(team.name);
      setTeamDbId(team.id);
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
            handleFormSubmit={async (newName) => {
              const response = await fetch("/api/teams/" + teamDbId, {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ name: newName }),
              });
              if (response.ok) {
                setTeamName(newName);
                notifyUpdate();
              } else {
                console.error("Error renaming team:", await response.text());
              }
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
      <br />
      <ApiKeys />
    </div>
  );
}
