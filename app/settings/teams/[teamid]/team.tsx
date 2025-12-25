"use client";

import styles from "./team.module.css";
import SettingsLayout from "../../Layout";
import { Material, Machine, Tool, Collaborator, ApiKey } from "@/app/types";
import { useState } from "react";
import { PrimaryButton } from "@/components/Buttons/Buttons";
import FusionInputs from "./FusionInputs/FusionInputs";
import CollaboratorsSettingsPage from "./Collaborators/Collaborators";

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
  teamid,
  teamName,
  teamMaterials,
  teamMachines,
  teamTools,
  teamCollaborators,
  teamApiKeys,
}: {
  teamid: string;
  teamName: string;
  teamMaterials: Material[];
  teamMachines: Machine[];
  teamTools: Tool[];
  teamCollaborators: Collaborator[];
  teamApiKeys: ApiKey[];
}) {
  const [collaborators, setCollaborators] = useState(teamCollaborators);
  return (
    <SettingsLayout selected={`${teamid}`}>
      <div className={styles.teamContainer}>
        <h1>{teamName}</h1>
        <hr />
        <TeamName
          oldTeamName={teamName}
          handleFormSubmit={(newName) => {
            // Handle team name change
          }}
        />
        <br />
        <FusionInputs
          defaultMachines={teamMachines}
          defaultMaterials={teamMaterials}
          defaultTools={teamTools}
        />
      </div>
      <br />
      <CollaboratorsSettingsPage
        collaborators={collaborators}
        setCollaborators={setCollaborators}
      />
    </SettingsLayout>
  );
}
