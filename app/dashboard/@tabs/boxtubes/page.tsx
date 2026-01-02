"use client";

import { motion } from "framer-motion";
import styles from "./boxtubes.module.css";
import { BoxTube, Team } from "@/app/types";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useDashboardEvents } from "@/app/dashboard/dashboardTeam";
import { SecondaryButton } from "@/components/Buttons/Buttons";

function BoxTubeCard({ boxtube, delay }: { boxtube: BoxTube; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: delay, duration: 0.3 }}
      className={styles.boxtubecard}
    >
      <div id={styles.boxtubecardheader}>
        <span>{boxtube.name}</span>{" "}
      </div>
      <div id={styles.boxtubecardinfo}>
        <p id={styles.boxtubecardepic}>Epic: {boxtube.epic}</p>
        <p id={styles.boxtubecardquantity}>{boxtube.quantity}</p>
      </div>
      <SecondaryButton>
        <span className="secondaryTextGradient">CAM</span>
      </SecondaryButton>
    </motion.div>
  );
}

async function fetchBoxTubes({
  team,
}: {
  team: Team | null;
}): Promise<BoxTube[] | undefined> {
  if (team !== null) {
    const response = await fetch(`/api/teams/${team.id}/boxtubes`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.ok) {
      const data = await response.json();
      return data;
    }
    return [];
  }
}

export default function boxtubes() {
  const { team } = useDashboardEvents();
  const [boxtubes, setBoxTubes] = useState<BoxTube[]>([]);
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const tubes = await fetchBoxTubes({ team });
      if (mounted && tubes) {
        console.log("tubes", tubes);
        setBoxTubes(tubes);
      }
    };
    if (team) {
      load();
    }
    return () => {
      mounted = false;
    };
  }, [team]);
  return (
    <>
      {boxtubes.length === 0 ? (
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
