"use client";

import styles from "./newteam.module.css";
import CollaboratorsSettingsPage from "../teams/[teamid]/Collaborators/Collaborators";
import type { Collaborator } from "@/app/types";
import { PrimaryButton } from "@/components/Buttons/Buttons";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTabEvents } from "../../teamUpdate";
import { motion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number]
    }
  }
};

export default function NewteamSettingsPage() {
  const [teamName, setTeamName] = useState("");
  const router = useRouter();
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const { notifyUpdate, teams } = useTabEvents();
  async function handleCreateTeam(e: React.FormEvent) {
    e.preventDefault();
    console.log(
      "Creating team:",
      teamName,
      "with collaborators:",
      collaborators
    );
    const response = await fetch("/api/teams", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: teamName,
      }),
    });
    if (response.ok) {
      const data = await response.json();
      console.log("Team created successfully:", data);

      // Send invites to all collaborators
      for (const collaborator of collaborators) {
        try {
          await fetch(`/api/teams/${data.id}/invites`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: collaborator.email,
              admin: collaborator.role === "Admin",
            }),
          });
          console.log("Invite sent to:", collaborator.email);
        } catch (err) {
          console.error("Failed to send invite to:", collaborator.email, err);
        }
      }

      notifyUpdate();
      router.push("/dashboard/settings/teams/" + teams.length);
    } else {
      console.error("Error creating team:", response.statusText);
    }
  }
  return (
    <motion.div 
      className={styles.newteamContainer}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.h1 variants={itemVariants}>New Team</motion.h1>
      <motion.hr variants={itemVariants} />
      <motion.div className={styles.teamNameSection} variants={itemVariants}>
        <label>Team Name</label>
        <input
          type="text"
          placeholder="Enter team name"
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          className={styles.teamNameInput}
          required
        />
      </motion.div>
      <br />
      <motion.div variants={itemVariants}>
        <CollaboratorsSettingsPage
          optional
          collaborators={collaborators}
          setCollaborators={setCollaborators}
        />
      </motion.div>
      <br />
      <motion.div variants={itemVariants}>
        <PrimaryButton onClick={(e) => handleCreateTeam(e)}>
          <span className="textGradient">Create Team</span>
        </PrimaryButton>
      </motion.div>
    </motion.div>
  );
}
