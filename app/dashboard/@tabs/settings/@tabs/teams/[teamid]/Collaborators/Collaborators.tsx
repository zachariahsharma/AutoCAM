"use client";

import styles from "./collaborators.module.css";
import { PrimaryButton } from "@/components/Buttons/Buttons";
import { useEffect, useRef, useState, FormEvent, useCallback } from "react";
import { Collaborator } from "@/app/types";
import Image from "next/image";

interface CollaboratorsProps {
  optional?: boolean;
  teamDbId?: number;
  // For new team flow - local state management
  collaborators?: Collaborator[];
  setCollaborators?: React.Dispatch<React.SetStateAction<Collaborator[]>>;
}

export default function CollaboratorsSettingsPage({
  optional = false,
  teamDbId,
  collaborators: externalCollaborators,
  setCollaborators: setExternalCollaborators,
}: CollaboratorsProps) {
  // Use external state if provided (new team flow), otherwise internal state
  const useLocalState = !teamDbId || teamDbId === 0;
  const [internalCollaborators, setInternalCollaborators] = useState<Collaborator[]>([]);
  
  const collaborators = useLocalState 
    ? (externalCollaborators ?? internalCollaborators)
    : internalCollaborators;
  
  const setCollaborators = useLocalState
    ? (setExternalCollaborators ?? setInternalCollaborators)
    : setInternalCollaborators;

  const [isLoading, setIsLoading] = useState(!useLocalState);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch members and invites from API (only for existing teams)
  const fetchCollaborators = useCallback(async () => {
    if (!teamDbId || teamDbId === 0) return;

    try {
      const [membersRes, invitesRes] = await Promise.all([
        fetch(`/api/teams/${teamDbId}/members`),
        fetch(`/api/teams/${teamDbId}/invites`),
      ]);

      if (!membersRes.ok || !invitesRes.ok) {
        console.error("Failed to fetch collaborators");
        return;
      }

      const members: { user: string; admin: boolean }[] =
        await membersRes.json();
      const invites: { email: string; admin: boolean }[] =
        await invitesRes.json();

      const collaboratorsList: Collaborator[] = [
        ...members.map((m, idx) => ({
          id: idx + 1,
          email: m.user,
          name: m.user.split("@")[0] || "Unknown",
          role: (m.admin ? "Admin" : "Member") as "Admin" | "Member",
        })),
        ...invites.map((inv, idx) => ({
          id: members.length + idx + 1,
          email: inv.email,
          name: inv.email.split("@")[0] || "Unknown",
          role: "pending" as const,
        })),
      ];

      setInternalCollaborators(collaboratorsList);
    } catch (err) {
      console.error("Error fetching collaborators:", err);
    } finally {
      setIsLoading(false);
    }
  }, [teamDbId]);

  useEffect(() => {
    if (!useLocalState && teamDbId) {
      fetchCollaborators();
    }
  }, [teamDbId, fetchCollaborators, useLocalState]);

  async function handleAddCollaborator(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const form = e.currentTarget;
    const formData = new FormData(form);
    const email = (formData.get("email") as string) || "";

    if (!email) return;

    // For new team flow, just add to local state
    if (useLocalState) {
      setCollaborators((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          email,
          name: email.split("@")[0] || "Unknown",
          role: "pending",
        },
      ]);
      form.reset();
      return;
    }

    // For existing teams, call the API
    setIsSending(true);
    setError(null);

    try {
      const response = await fetch(`/api/teams/${teamDbId}/invites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, admin: false }),
      });

      if (!response.ok) {
        const text = await response.text();
        if (response.status === 409) {
          setError("An invite has already been sent to this email");
        } else {
          setError(text || "Failed to send invite");
        }
        return;
      }

      // Add to local state as pending
      setCollaborators((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          email,
          name: email.split("@")[0] || "Unknown",
          role: "pending",
        },
      ]);

      form.reset();
    } catch (err) {
      console.error("Error sending invite:", err);
      setError("An error occurred while sending the invite");
    } finally {
      setIsSending(false);
    }
  }

  async function handleRoleChange(
    collaborator: Collaborator,
    newRole: "Admin" | "Member"
  ) {
    // For new team flow, just update local state
    if (useLocalState) {
      setCollaborators((prev) =>
        prev.map((c) =>
          c.id === collaborator.id ? { ...c, role: newRole } : c
        )
      );
      return;
    }

    if (collaborator.role === "pending") return;

    try {
      const response = await fetch(`/api/teams/${teamDbId}/members`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: collaborator.email,
          admin: newRole === "Admin",
        }),
      });

      if (!response.ok) {
        console.error("Failed to update role:", await response.text());
        return;
      }

      setCollaborators((prev) =>
        prev.map((c) =>
          c.id === collaborator.id ? { ...c, role: newRole } : c
        )
      );
    } catch (err) {
      console.error("Error updating role:", err);
    }
  }

  async function handleRemove(collaborator: Collaborator) {
    // For new team flow, just remove from local state
    if (useLocalState) {
      setCollaborators((prev) => prev.filter((c) => c.id !== collaborator.id));
      return;
    }

    try {
      const isPending = collaborator.role === "pending";
      const endpoint = isPending
        ? `/api/teams/${teamDbId}/invites`
        : `/api/teams/${teamDbId}/members`;

      const response = await fetch(endpoint, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: collaborator.email }),
      });

      if (!response.ok) {
        console.error("Failed to remove collaborator:", await response.text());
        return;
      }

      setCollaborators((prev) => prev.filter((c) => c.id !== collaborator.id));
    } catch (err) {
      console.error("Error removing collaborator:", err);
    }
  }

  if (isLoading) {
    return (
      <div className={styles.collaboratorsContainer}>
        <h1>
          Collaborators{" "}
          <span className={styles.optional}>
            {optional ? "(Optional)" : null}
          </span>
        </h1>
        <div className={styles.collaboratorsList}>
          <div className={styles.loadingContainer}>
            <span className={styles.loadingSpinner} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.collaboratorsContainer}>
      <h1>
        Collaborators{" "}
        <span className={styles.optional}>
          {optional ? "(Optional)" : null}
        </span>
      </h1>
      <form onSubmit={handleAddCollaborator}>
        <div className={styles.addCollaboratorSection}>
          <div className={styles.addCollaboratorContainer}>
            <Image
              alt="search"
              src="/settings/teams/search.svg"
              width={2000}
              height={2000}
              className={styles.searchIcon}
            />
            <input type="email" name="email" placeholder="Enter email" />
          </div>
          <PrimaryButton type="submit" disabled={isSending}>
            <span className="textGradient">
              {isSending ? "Sending..." : "Add Collaborator"}
            </span>
          </PrimaryButton>
        </div>
        {error && <p className={styles.error}>{error}</p>}
      </form>
      <div className={styles.collaboratorsList}>
        {collaborators.map((collaborator) => (
          <CollaboratorCard
            collaborator={collaborator}
            key={collaborator.id}
            onRoleChange={handleRoleChange}
            onRemove={handleRemove}
          />
        ))}
        {collaborators.length === 0 && (
          <div className={styles.emptyStateContainer}>
            <span className={styles.emptyState}>
              Enter an email to add a collaborator.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function CollaboratorCard({
  collaborator,
  onRoleChange,
  onRemove,
}: {
  collaborator: Collaborator;
  onRoleChange: (collaborator: Collaborator, newRole: "Admin" | "Member") => void;
  onRemove: (collaborator: Collaborator) => void;
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }

    // Only add listener when dropdown is open to avoid unnecessary listeners
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  function handleRoleChange(newRole: "Admin" | "Member") {
    onRoleChange(collaborator, newRole);
    setDropdownOpen(false);
  }

  return (
    <div className={styles.collaboratorCard}>
      <div className={styles.name}>{collaborator.name}</div>
      <span className={styles.email}>
        <div>{collaborator.email}</div>
      </span>
      <div className={styles.role}>
        {collaborator.role === "pending" ? (
          <span>pending</span>
        ) : (
          <button onClick={() => setDropdownOpen(!dropdownOpen)}>
            {collaborator.role}
            <Image
              alt="dropdown"
              src="/settings/teams/collabDropdown.svg"
              width={2000}
              height={2000}
              className={styles.dropdownIcon}
            />
          </button>
        )}
        {dropdownOpen && (
          <div className={styles.roleDropdown} ref={dropdownRef}>
            <div
              className={styles.roleOption}
              onClick={() => handleRoleChange("Admin")}
            >
              Admin
            </div>
            <div
              className={styles.roleOption}
              onClick={() => handleRoleChange("Member")}
            >
              Member
            </div>
          </div>
        )}
      </div>
      <Image
        alt="remove"
        src="/settings/teams/remove.svg"
        width={2000}
        height={2000}
        className={styles.removeIcon}
        onClick={() => onRemove(collaborator)}
      />
    </div>
  );
}
