"use client";

import { motion } from "framer-motion";
import styles from "./boxtubes.module.css";
import { BoxTube } from "@/app/types";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDashboardEvents } from "@/app/dashboard/dashboardTeam";
import { PrimaryButton, SecondaryButton } from "@/components/Buttons/Buttons";
import { ConditionalMarquee } from "./ConditionalMarquee";
import Image from "next/image";

function BoxTubeCard({ boxtube, delay }: { boxtube: BoxTube; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ 
        delay: delay, 
        duration: 0.4,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
      className={styles.boxtubecard}
    >
      <div id={styles.boxtubecardheader}>
        <ConditionalMarquee text={boxtube.name} />
      </div>
      <div id={styles.boxtubecardinfo}>
        <p id={styles.boxtubecardepic}>Epic: {boxtube.epic}</p>
        <p id={styles.boxtubecardquantity}>Quantity: {boxtube.quantity}</p>
      </div>
      <div id={styles.boxtubecardactions}>
        {boxtube.status === "completed" ? (
          <div id={styles.boxtubecardcompletedactions}>
            <PrimaryButton id={styles.downloadboxtubebutton}>
              <span className="textGradient">
                <Image
                  src="/dashboard/download.svg"
                  alt="download"
                  width={16}
                  height={16}
                />{" "}
                Download
              </span>
            </PrimaryButton>
            <div id={styles.removeboxtubebutton}>
              <Image
                src="/dashboard/remove.svg"
                alt="remove"
                width={2000}
                height={2000}
                id={styles.removeicon}
              />
            </div>
          </div>
        ) : boxtube.status === "in progress" ? (
          <div className={styles.boxtubecardcamdisabled}>
            <span className={styles.ellipsis1}>.</span>
            <span className={styles.ellipsis2}>.</span>
            <span className={styles.ellipsis3}>.</span>
          </div>
        ) : (
          <SecondaryButton id={styles.requestcambutton}>
            <span className="textGradient">CAM</span>
          </SecondaryButton>
        )}
      </div>
    </motion.div>
  );
}

function NoTeamCard() {
  const router = useRouter();
  return (
    <div className={styles.noTeamContainer}>
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ 
          duration: 0.5,
          ease: [0.25, 0.46, 0.45, 0.94]
        }}
        className={styles.noTeamCard}
      >
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          No Team Found
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.3 }}
        >
          You need to be part of a team to view box tubes.
        </motion.p>
        <motion.div 
          className={styles.noTeamButtons}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.3 }}
        >
          <PrimaryButton onClick={() => router.push("/dashboard/settings/newteam")}>
            <span className="textGradient">Create a Team</span>
          </PrimaryButton>
          <SecondaryButton onClick={() => router.push("/dashboard/settings/jointeam")}>
            <span className="textGradient">Join a Team</span>
          </SecondaryButton>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default function Boxtubes() {
  const { team } = useDashboardEvents();
  const [boxtubes, setBoxTubes] = useState<BoxTube[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    let mounted = true;
    const loadBoxTubes = async () => {
      if (team === null || team === undefined) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      const response = await fetch(`/api/teams/${team.id}/boxTubes`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        const data = await response.json();
        if (mounted) {
          const statusedData = await Promise.all(
            data.map(async (bt: BoxTube): Promise<BoxTube> => {
              const response = await fetch(`/api/boxTubes/${bt.id}/jobs`, {
                method: "GET",
                headers: {
                  "Content-Type": "application/json",
                },
              });
              if (!response.ok) return { ...bt, status: "pending" };

              const jobs: Array<{ status: string }> = await response.json();
              console.log("Jobs for box tube", bt.id, ":", jobs);

              if (jobs.length === 0) return { ...bt, status: "pending" };

              const allCompleted = jobs.every((job) => job.status === "completed");
              return { ...bt, status: allCompleted ? "completed" : "in progress" };
            })
          );
          setBoxTubes(statusedData);
          console.log("Loaded box tubes:", data);
        }
      }
      if (mounted) {
        setIsLoading(false);
      }
    };
    loadBoxTubes();
    return () => {
      mounted = false;
    };
  }, [team]);

  // Show no team card if user has no team
  if (!team && !isLoading) {
    return <NoTeamCard />;
  }

  return (
    <>
      {isLoading ? (
        <div id={styles.loadingContainer}>
          <span id={styles.loadingSpinner} />
        </div>
      ) : boxtubes.length === 0 ? (
        <p id={styles.noboxes}>No Box Tubes available.</p>
      ) : (
        <div className={styles.boxtubeslist}>
          {boxtubes.map((boxtube, index) => (
            <BoxTubeCard
              key={index}
              boxtube={boxtube}
              delay={index * 0.2 + 0.3}
            />
          ))}
        </div>
      )}
    </>
  );
}
