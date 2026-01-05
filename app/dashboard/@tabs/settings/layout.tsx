"use client";
import styles from "./layout.module.css";
import { motion, useAnimate } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useEffect, useRef } from "react";
import { useSelectedLayoutSegment } from "next/navigation";
export function useCurrentTab() {
  const segment = useSelectedLayoutSegment("tabs");
  return segment ?? "default";
}
import { TabEventsProvider, useTabEvents } from "./teamUpdate";

function Sidebar() {
  const itemsRef = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const sidebarRef = useRef<HTMLElement | null>(null);
  const [scope, animate] = useAnimate();
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
    // Determine which key to look for
    let key = tab;
    if (tab === "default") {
      key = "personal";
    } else if (!isNaN(Number(tab))) {
      key = `team-${tab}`;
    }

    const element = itemsRef.current[key];
    const sidebar = sidebarRef.current;
    
    if (element && sidebar) {
      const elementRect = element.getBoundingClientRect();
      const sidebarRect = sidebar.getBoundingClientRect();
      const relativeTop = elementRect.top - sidebarRect.top;
      
      animate(
        scope.current,
        {
          top: relativeTop + 2,
          height: elementRect.height - 4,
        },
        { duration: 0.3, ease: "easeInOut" }
      );
    }
  }, [tab, teams, animate, scope]);

  return (
    <motion.aside 
      className={styles.sidebar} 
      ref={sidebarRef}
      initial={{ x: -160, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <span id={styles.selected} ref={scope} />
      <div
        ref={(el) => { itemsRef.current["personal"] = el; }}
        onClick={() => {
          if (tab !== "personal") {
            router.push("/dashboard/settings/personal");
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
          ref={(el) => { itemsRef.current[`team-${index}`] = el; }}
          onClick={() => {
            if (tab !== String(index)) {
              router.push("/dashboard/settings/teams/" + index);
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
        ref={(el) => { itemsRef.current["newteam"] = el; }}
        onClick={() => {
          if (tab !== "newteam") {
            router.push("/dashboard/settings/newteam");
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
        ref={(el) => { itemsRef.current["jointeam"] = el; }}
        onClick={() => {
          if (tab !== "jointeam") {
            router.push("/dashboard/settings/jointeam");
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
    </motion.aside>
  );
}

export default function SettingsLayout({ tabs }: { tabs: React.ReactNode }) {
  useEffect(() => {
    try {
      const perf = (
        globalThis as {
          performance?: { measure?: (...args: unknown[]) => unknown };
        }
      ).performance;
      if (!perf || typeof perf.measure !== "function") return;
      const orig = perf.measure.bind(perf);
      perf.measure = (...args: unknown[]) => {
        try {
          return orig(...args);
        } catch (err) {
          if (
            err instanceof Error &&
            err.message.includes("cannot have a negative time stamp")
          )
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
      <motion.div 
        className={styles.header}
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <h1>Settings</h1>
        <hr />
      </motion.div>
      <TabEventsProvider>
        <div className={styles.mainContent}>
          <Sidebar />
          <motion.main 
            className={styles.main}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {tabs}
          </motion.main>
        </div>
      </TabEventsProvider>
    </div>
  );
}
