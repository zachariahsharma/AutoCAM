"use client";
import styles from "./layout.module.css";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Team } from "../types";
import { useSelectedLayoutSegment } from "next/navigation";
export function useCurrentTab() {
  const segment = useSelectedLayoutSegment("tabs");
  return segment ?? "default";
}
import { TabEventsProvider, useTabEvents } from "./teamUpdate";

export function Header({
  delay = 0,
  duration = 0.0,
}: {
  delay?: number;
  duration?: number;
}) {
  const router = useRouter();
  return (
    <div id={styles.header}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: delay, duration: duration }}
      >
        <button
          id={styles.headerlogoButton}
          onClick={() => router.push("/dashboard")}
        >
          <Image
            src="/index/Document.svg"
            width={2000}
            height={2000}
            alt="logo"
            id={styles.headerlogo}
          />
        </button>
        <h1 id={styles.headertext}>
          <span className="secondarytextGradient">AutoCAM</span>
        </h1>
        <span id={styles.subheadertext}>Settings</span>
        <div>
          <div id={styles.usericoncontainer}>
            <Image
              src="/dashboard/UserIcon.svg"
              width={2000}
              height={2000}
              alt="user icon"
              id={styles.usericon}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function Sidebar() {
  const [top, setTop] = useState(2);
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const tab = useCurrentTab();
  const { updateCount } = useTabEvents();
  useEffect(() => {
    (async function () {
      setTeams(await (await fetch("/api/teams")).json());
    })();
  }, [updateCount]);

  useEffect(() => {
    if (tab === "personal") {
      setTop(2);
    } else if (tab === "0" || Number.parseInt(tab)) {
      setTop(2 + 34 * (Number.parseInt(tab) + 1));
    } else if (tab == "newteam") {
      setTop(2 + 34 * (teams.length + 1) + 8);
    } else if (tab == "jointeam") {
      setTop(2 + 34 * (teams.length + 2) + 8);
    }
  }, [tab, updateCount]);
  return (
    <aside className={styles.sidebar}>
      <span id={styles.selected} style={{ top: top }} />
      <div
        onClick={() => {
          if (tab !== "personal") {
            router.push("/settings/personal");
          }
        }}
        style={
          tab === "personal"
            ? {
                backgroundColor: "rgba(255,255,255,.15)",
                marginBottom: "2px",
              }
            : undefined
        }
      >
        <Image
          src="/settings/personal.svg"
          width={2000}
          height={2000}
          alt="Personal Icon"
          className={styles.icon}
        />
        <span>Personal</span>
      </div>
      {teams.map((team, index) => (
        <div
          key={index}
          onClick={() => {
            if (tab !== String(index)) {
              router.push("/settings/teams/" + index);
            }
          }}
          style={
            tab === String(index)
              ? {
                  backgroundColor: "rgba(255,255,255,.15)",
                  marginBottom: "2px",
                  marginTop: "2px",
                }
              : undefined
          }
        >
          <Image
            src="/settings/team.svg"
            width={2000}
            height={2000}
            alt="Team Icon"
            className={styles.icon}
          />
          <span>{team.name}</span>
        </div>
      ))}
      <hr />
      <div
        onClick={() => {
          if (tab !== "newteam") {
            router.push("/settings/newteam");
          }
        }}
        style={
          tab === "newteam"
            ? {
                backgroundColor: "rgba(255,255,255,.15)",
                marginBottom: "2px",
              }
            : undefined
        }
      >
        <Image
          src="/settings/newteam.svg"
          width={2000}
          height={2000}
          alt="New Team Icon"
          className={styles.icon}
        />
        <span>New Team</span>
      </div>
      <div
        onClick={() => {
          if (tab !== "jointeam") {
            router.push("/settings/jointeam");
          }
        }}
        style={
          tab === "jointeam"
            ? {
                backgroundColor: "rgba(255,255,255,.15)",
                marginTop: "2px",
              }
            : undefined
        }
      >
        <Image
          src="/settings/jointeam.svg"
          width={2000}
          height={2000}
          alt="Join Team Icon"
          className={styles.icon}
        />
        <span>Join Team</span>
      </div>
    </aside>
  );
}

export default function SettingsLayout({ tabs }: { tabs: React.ReactNode }) {
  return (
    <div className={styles.container}>
      <Header />
      <TabEventsProvider>
        <div className={styles.mainContent}>
          <Sidebar />
          <main className={styles.main}>{tabs}</main>
        </div>
      </TabEventsProvider>
    </div>
  );
}
