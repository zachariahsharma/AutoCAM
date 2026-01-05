"use client";

import { motion } from "framer-motion";
import styles from "./partcat.module.css";
import { PartCategory, Team } from "@/app/types";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useDashboardEvents } from "@/app/dashboard/dashboardTeam";
import { PrimaryButton, SecondaryButton } from "@/components/Buttons/Buttons";
function countUniquePartsByEpicArray(category: PartCategory) {
  const map = category.parts!.reduce<Map<string, number>>((acc, part) => {
    acc.set(part.epic, (acc.get(part.epic) ?? 0) + 1);
    return acc;
  }, new Map());

  return Array.from(map, ([epic, count]) => ({ epic, count }));
}

function PartCatCard({
  partcat,
  delay,
  teamid,
}: {
  partcat: PartCategory;
  delay: number;
  teamid: number;
}) {
  const router = useRouter();
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
      className={styles.platecard}
      onClick={() => router.push(`/pc/${partcat.id}/${teamid}`)}
    >
      <div id={styles.platecardheader}>
        <span>{partcat.material}</span>{" "}
        <span id={styles.partcardheaderthickness}>{partcat.thickness}</span>
      </div>
      <div id={styles.platecardinfo}>
        <p id={styles.platecardquantity}>
          Quantity:
          {partcat.parts!.reduce((sum, { quantity }) => sum + quantity, 0)}
        </p>
        <p id={styles.platecardunique}>Unique: {partcat.parts!.length}</p>
      </div>
      <hr id={styles.horizontalrule} />
      <div>
        {partcat.parts!.length > 0 ? (
          <table id={styles.platecardpartstable}>
            <tbody>
              {countUniquePartsByEpicArray(partcat).map((part, index) => (
                <tr key={index}>
                  <td>{part.epic}</td>
                  <td>{part.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p id={styles.noparts}>No parts in this category.</p>
        )}
      </div>
      <div id={styles.openiconcontainer}>
        <Image
          src="/dashboard/Open.svg"
          width={2000}
          height={2000}
          alt="user icon"
          id={styles.openicon}
        />
      </div>
    </motion.div>
  );
}

async function fetchPartCategories({
  team,
}: {
  team: Team | null;
}): Promise<PartCategory[] | undefined> {
  if (team !== null) {
    const response = await fetch(`/api/teams/${team.id}/pc`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.ok) {
      const data = await response.json();
      for (const cat of data) {
        const partsResponse = await fetch(`/api/pc/${cat.id}/parts`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (partsResponse.ok) {
          const partsData = await partsResponse.json();
          cat.parts = partsData;
        } else {
          cat.parts = [];
        }
      }
      return data;
    }
    return [];
  }
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
          You need to be part of a team to view plates and part categories.
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

export default function Plates() {
  const { team } = useDashboardEvents();
  const [partcats, setCategories] = useState<PartCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    let mounted = true;
    const setLoading = (value: boolean) => {
      if (mounted) setIsLoading(value);
    };
    const clear = () => {
      if (mounted) setCategories([]);
      setLoading(false);
    };
    const load = async () => {
      setLoading(true);
      const categories = await fetchPartCategories({ team });
      if (mounted && categories) {
        console.log("categories", categories);
        setCategories(categories);
      }
      setLoading(false);
    };
    if (team) {
      load();
    } else {
      clear();
    }
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
      ) : partcats.length === 0 ? (
        <p id={styles.nopartcats}>No Categories available.</p>
      ) : (
        <div className={styles.plateslist}>
          {partcats.map((partcat, index) => (
            <PartCatCard
              key={index}
              partcat={partcat}
              delay={index * 0.2 + 0.3}
              teamid={team ? team.id : 0}
            />
          ))}
        </div>
      )}
    </>
  );
}
