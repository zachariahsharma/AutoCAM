"use client";

import styles from "./jointeam.module.css";
import { TeamInvite } from "@/app/types";
import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTabEvents } from "../../teamUpdate";
import { motion, AnimatePresence } from "framer-motion";

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
  },
  exit: { 
    opacity: 0, 
    x: -20,
    transition: { duration: 0.2 }
  }
};

export default function JoinTeamSettingsPage() {
  const [invites, setInvites] = useState<TeamInvite[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInvites = useCallback(async () => {
    try {
      const response = await fetch("/api/user/invites");
      if (response.ok) {
        const data = await response.json();
        // Map the API response to match the TeamInvite type
        const mappedInvites: TeamInvite[] = data.map(
          (invite: { id: string; team: string }) => ({
            id: invite.id,
            teamName: invite.team,
          })
        );
        setInvites(mappedInvites);
      }
    } catch (error) {
      console.error("Error fetching invites:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvites();
  }, [fetchInvites]);

  if (loading) {
    return (
      <div className={styles.jointeamContainer}>
        <h1>Join Team</h1>
        <hr />
        <p>Loading invites...</p>
      </div>
    );
  }

  return (
    <motion.div 
      className={styles.jointeamContainer}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.h1 variants={itemVariants}>Join Team</motion.h1>
      <motion.hr variants={itemVariants} />
      <AnimatePresence mode="popLayout">
        {invites.length === 0 ? (
          <motion.p 
            className={styles.noInvites}
            variants={itemVariants}
            initial="hidden"
            animate="visible"
          >
            No pending invites
          </motion.p>
        ) : (
          invites.map((invite, index) => (
            <JoinCard 
              key={invite.id} 
              invite={invite} 
              setInvites={setInvites}
              delay={index * 0.1}
            />
          ))
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function JoinCard({
  invite,
  setInvites,
  delay = 0,
}: {
  invite: TeamInvite;
  setInvites: React.Dispatch<React.SetStateAction<TeamInvite[]>>;
  delay?: number;
}) {
  const { notifyUpdate, setTeams } = useTabEvents();
  const router = useRouter();
  const [isJoining, setIsJoining] = useState(false);

  const handleJoin = async () => {
    setIsJoining(true);
    try {
      const response = await fetch(`/api/user/invites/accept/${invite.id}`, {
        headers: {
          "Accept": "application/json",
        },
      });
      
      if (response.ok) {
        const { team_id } = await response.json();
        
        setInvites((prev) => prev.filter((i) => i.id !== invite.id));
        
        const teamsResponse = await fetch("/api/teams");
        if (teamsResponse.ok) {
          const teamsData = await teamsResponse.json();
          teamsData.sort((a: { id: number }, b: { id: number }) => a.id - b.id);
          setTeams(teamsData);
          
          const teamIndex = teamsData.findIndex((t: { id: number }) => t.id === team_id);
          
          notifyUpdate();
          router.push(`/dashboard/settings/teams/${teamIndex >= 0 ? teamIndex : 0}`);
        }
      } else {
        console.error("Failed to accept invite");
        setIsJoining(false);
      }
    } catch (error) {
      console.error("Error accepting invite:", error);
      setIsJoining(false);
    }
  };

  const handleDecline = () => {
    //! Fix this to call API to decline invite
    setInvites((prev) => prev.filter((i) => i.id !== invite.id));
    notifyUpdate();
  };

  return (
    <motion.div 
      className={styles.joinCard}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ delay: delay, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      layout
    >
      <span>{invite.teamName}</span>
      <motion.button
        className={styles.joinButton}
        onClick={handleJoin}
        disabled={isJoining}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <Image
          src="/settings/join/Join.svg"
          alt="Join Team"
          className={styles.joinImage}
          width={2000}
          height={2000}
        />
      </motion.button>
      <motion.button 
        className={styles.declineButton} 
        onClick={handleDecline}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <Image
          src="/settings/join/Decline.svg"
          alt="Decline Invite"
          className={styles.declineImage}
          width={2000}
          height={2000}
        />
      </motion.button>
    </motion.div>
  );
}
