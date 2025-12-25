"use client";

import SettingsLayout from "../Layout";
import styles from "./newteam.module.css";
import { TeamName } from "../teams/[teamid]/team";
import CollaboratorsSettingsPage from "../teams/[teamid]/Collaborators/Collaborators";
import type { Collaborator } from "@/app/types";
import { PrimaryButton } from "@/components/Buttons/Buttons";
import { useState } from "react";

export default function NewteamSettingsPage() {
  const [teamName, setTeamName] = useState("");
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  return (
    <SettingsLayout selected={"newteam"}>
      <div className={styles.newteamContainer}>
        <h1>New Team</h1>
        <hr />
        <TeamName
          oldTeamName=""
          rename={false}
          handleFormSubmit={(newName) => {
            setTeamName(newName);
          }}
        />
        <br />
        <CollaboratorsSettingsPage
          optional
          collaborators={collaborators}
          setCollaborators={setCollaborators}
        />
        <br />
        <PrimaryButton>
          <span className="textGradient">Create Team</span>
        </PrimaryButton>
      </div>
    </SettingsLayout>
  );
}
