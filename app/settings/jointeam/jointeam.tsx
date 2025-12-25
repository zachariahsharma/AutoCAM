"use client";

import SettingsLayout from "../Layout";
import styles from "./jointeam.module.css";
import { TeamInvite } from "@/app/types";
import Image from "next/image";
import { useState } from "react";

export default function JoinTeamSettingsPage({
  mockInvites,
}: {
  mockInvites: TeamInvite[];
}) {
  const [invites, setInvites] = useState<TeamInvite[]>(mockInvites);
  return (
    <SettingsLayout selected={"jointeam"}>
      <div className={styles.jointeamContainer}>
        <h1>Join Team</h1>
        <hr />
        {invites.map((invite, index) => (
          <JoinCard key={index} invite={invite} setInvites={setInvites} />
        ))}
      </div>
    </SettingsLayout>
  );
}

function JoinCard({
  invite,
  setInvites,
}: {
  invite: TeamInvite;
  setInvites: React.Dispatch<React.SetStateAction<TeamInvite[]>>;
}) {
  const handleJoin = () => {
    setInvites((prev) => prev.filter((i) => i.id !== invite.id));
    console.log(`Joining team: ${invite.teamName}`);
  };
  const handleDecline = () => {
    // Logic to decline the invite
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
