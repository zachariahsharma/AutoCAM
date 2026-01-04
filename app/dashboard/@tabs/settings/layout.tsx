"use client";
import styles from "./layout.module.css";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Team } from "@/app/types";
import { useSelectedLayoutSegment } from "next/navigation";
export function useCurrentTab() {
  const segment = useSelectedLayoutSegment("tabs");
  return segment ?? "default";
}
import { TabEventsProvider, useTabEvents } from "./teamUpdate";

function Sidebar() {
  const [top, setTop] = useState(2);
  const router = useRouter();
  const tab = useCurrentTab();
  const { updateCount, teams, setTeams } = useTabEvents();
  useEffect(() => {
    let mounted = true;
    (async function () {
      try {
        const teamsTemp = await (await fetch("/api/teams")).json();
        if (!mounted) return;
        teamsTemp.sort((a: { id: number }, b: { id: number }) => a.id - b.id);
        console.log("Fetched teams:", teamsTemp);
        setTeams(teamsTemp);
      } catch (err) {
        if (mounted) console.error("Failed to fetch teams:", err);
      }
    })();
    return () => {
      mounted = false;
    };
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
  useEffect(() => {
    try {
      const perf: any = (globalThis as any).performance;
      if (!perf || typeof perf.measure !== "function") return;
      const orig = perf.measure.bind(perf);
      perf.measure = (...args: any[]) => {
        try {
          return orig(...args);
        } catch (err: any) {
          if (err?.message?.includes("cannot have a negative time stamp"))
            return;
          throw err;
        }
      };
    } catch {
      /* noop */
    }
  }, []);
  return (
    <div className={styles.container}>
      <TabEventsProvider>
        <div className={styles.mainContent}>
          <Sidebar />
          <main className={styles.main}>{tabs}</main>
        </div>
      </TabEventsProvider>
    </div>
  );
}
