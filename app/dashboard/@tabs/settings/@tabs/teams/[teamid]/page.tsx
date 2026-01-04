"use client";

import styles from "./team.module.css";
import { Material, Machine, Tool } from "@/app/types";
import { useEffect, useState } from "react";
import { PrimaryButton } from "@/components/Buttons/Buttons";
import FusionInputs from "./FusionInputs/FusionInputs";
import CollaboratorsSettingsPage from "./Collaborators/Collaborators";
import { useTabEvents } from "../../../../settings/teamUpdate";
import { useParams, useRouter } from "next/navigation";
import ApiKeys from "./ApiKeys/ApiKeys";
import FusionServer from "./FusionServer/FusionServer";
import { authClient } from "@/lib/auth/client";
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
  const router = useRouter();
  const [teamName, setTeamName] = useState<string>("");
  const [materials, setMaterials] = useState<Material[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const { teamid } = useParams();
  const [teamDbId, setTeamDbId] = useState<number>(0);
  const { teams, notifyUpdate } = useTabEvents();
  const [tools, setTools] = useState<Tool[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Check if current user is the owner
  useEffect(() => {
    async function checkOwnership() {
      const { data } = await authClient.getSession();
      if (data?.user?.id) {
        const idStr = Array.isArray(teamid) ? teamid[0] : teamid ?? "0";
        const teamIndex = parseInt(idStr, 10);
        const team = teams[teamIndex];
        if (team && team.owner === data.user.id) {
          setIsOwner(true);
        } else {
          setIsOwner(false);
        }
      }
    }
    checkOwnership();
  }, [teamid, teams]);

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
    }
  }, [teamid, teams]);

  const handleDeleteTeam = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/teams/${teamDbId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        notifyUpdate();
        router.push("/dashboard/settings/personal");
      } else {
        console.error("Failed to delete team:", await response.text());
      }
    } catch (err) {
      console.error("Error deleting team:", err);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };
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
        <CollaboratorsSettingsPage teamDbId={teamDbId} />
        <br />
        <FusionInputs
          defaultMachines={machines}
          defaultMaterials={materials}
          defaultTools={tools}
          teamId={teamDbId}
        />
      </div>
      <br />
      <ApiKeys />
      <br />
      <FusionServer />

      {isOwner && (
        <button
          className={styles.deleteTeamButton}
          onClick={() => setShowDeleteModal(true)}
        >
          Delete Team
        </button>
      )}

      {showDeleteModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.deleteModal}>
            <h3>Delete Team?</h3>
            <p>
              This action is <strong>permanent</strong> and cannot be undone.
              All team data, including materials, machines, API keys, and members will be deleted.
            </p>
            <div className={styles.modalButtons}>
              <button
                className={styles.cancelButton}
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                className={styles.confirmDeleteButton}
                onClick={handleDeleteTeam}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete Team"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
