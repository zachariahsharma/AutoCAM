import styles from "./collaborators.module.css";
import { PrimaryButton } from "@/components/Buttons/Buttons";
import { useEffect, useRef, useState, FormEvent } from "react";
import { Collaborator } from "@/app/types";
import Image from "next/image";

export default function CollaboratorsSettingsPage({
  defaultCollaborators,
}: {
  defaultCollaborators: Collaborator[];
}) {
  const [collaborators, setCollaborators] = useState(defaultCollaborators);
  return (
    <div className={styles.collaboratorsContainer}>
      <h1>Collaborators</h1>
      <form
        onSubmit={(e: FormEvent<HTMLFormElement>) => {
          e.preventDefault();
          const form = e.currentTarget;
          const formData = new FormData(form);
          const email = (formData.get("email") as string) || "";
          if (email) {
            setCollaborators([
              ...collaborators,
              {
                id: collaborators.length + 1,
                email,
                role: "pending",
                name: "unknown", //! Ishan: get name from email api
              },
            ]);
          }
        }}
      >
        <div className={styles.addCollaboratorSection}>
          <div className={styles.addCollaboratorContainer}>
            <Image
              alt="search"
              src="/settings/teams/search.svg"
              width={2000}
              height={2000}
              className={styles.searchIcon}
            />
            <input type="email" name="email" />
          </div>
          <PrimaryButton type="submit">
            <span className="textGradient">Add Collaborator</span>
          </PrimaryButton>
        </div>
      </form>
      <div className={styles.collaboratorsList}>
        {collaborators.map((collaborator, index) => (
          <CollaboratorCard
            collaborator={collaborator}
            key={index}
            setCollaborators={setCollaborators}
            collaborators={collaborators}
          />
        ))}
      </div>
    </div>
  );
}

function CollaboratorCard({
  collaborator,
  setCollaborators,
  collaborators,
}: {
  collaborator: Collaborator;
  setCollaborators: React.Dispatch<React.SetStateAction<Collaborator[]>>;
  collaborators: Collaborator[];
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
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);
  function handleRoleChange(newRole: "Admin" | "Member") {
    const updatedCollaborators = collaborators.map((collab) => {
      if (collab.id === collaborator.id) {
        return { ...collab, role: newRole };
      }
      return collab;
    });
    setCollaborators(updatedCollaborators);
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
        onClick={() =>
          setCollaborators(
            collaborators.filter((c) => c.id !== collaborator.id)
          )
        }
      />
    </div>
  );
}
