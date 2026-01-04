"use client";

import styles from "./jointeam.module.css";
import { TeamInvite } from "@/app/types";
import Image from "next/image";
import { useState } from "react";
import { useTabEvents } from "../../teamUpdate";
export default function JoinTeamSettingsPage({
  mockInvites,
}: {
  mockInvites: TeamInvite[];
}) {
  const [invites, setInvites] = useState<TeamInvite[]>(mockInvites);
  return (
    <div className={styles.jointeamContainer}>
      <h1>Join Team</h1>
      <hr />
      {invites.map((invite, index) => (
        <JoinCard key={index} invite={invite} setInvites={setInvites} />
      ))}
    </div>
  );
}

function JoinCard({
  invite,
  setInvites,
}: {
  invite: TeamInvite;
  setInvites: React.Dispatch<React.SetStateAction<TeamInvite[]>>;
}) {
  const { notifyUpdate } = useTabEvents();
  const handleJoin = () => {
    notifyUpdate();
    setInvites((prev) => prev.filter((i) => i.id !== invite.id));
    console.log(`Joining team: ${invite.teamName}`);
  };
  const handleDecline = () => {
    notifyUpdate();
    setInvites((prev) => prev.filter((i) => i.id !== invite.id));
    console.log(`Declining invite to team: ${invite.teamName}`);
  };

  return (
    <div className={styles.joinCard}>
      <span>{invite.teamName}</span>
      <button className={styles.joinButton} onClick={handleJoin}>
        <Image
          src="/settings/join/Join.svg"
          alt="Join Team"
          className={styles.joinImage}
          width={2000}
          height={2000}
        />
      </button>
      <button className={styles.declineButton} onClick={handleDecline}>
        <Image
          src="/settings/join/Decline.svg"
          alt="Decline Invite"
          className={styles.declineImage}
          width={2000}
          height={2000}
        />
      </button>
    </div>
  );
}
