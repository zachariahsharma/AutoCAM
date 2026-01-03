"use client";

import {
  DashboardEventsProvider,
  useDashboardEvents,
} from "@/app/dashboard/dashboardTeam";
import styles from "./layout.module.css";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Team } from "@/app/types";
import { motion, AnimatePresence, useAnimate } from "framer-motion";
import { useSelectedLayoutSegment } from "next/navigation";

export function useCurrentTab() {
  const segment = useSelectedLayoutSegment("tabs");
  return segment ?? "default";
}

function TeamDropdown() {
  const [teamDropdownOpen, setTeamDropdownOpen] = useState(false);
  const { team, setTeam } = useDashboardEvents();
  const [teams, setTeams] = useState<Team[]>([]);
  const dropdownTeamRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let mounted = true;
    async function loadTeams() {
      try {
        const response = await fetch("/api/teams");
        const data: Team[] = await response.json();
        if (mounted) {
          setTeams(data);
          setTeam(data[0]);
        }
      } catch (err) {
        console.error("Failed to load teams:", err);
      }
    }
    loadTeams();
    return () => {
      mounted = false;
    };
  }, []);
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownTeamRef.current &&
        !dropdownTeamRef.current.contains(e.target as Node)
      ) {
        setTeamDropdownOpen(false);
      }
    }

    if (teamDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [teamDropdownOpen]);
  return (
    <div>
      <div
        id={styles.teamdropdown}
        onClick={() => setTeamDropdownOpen(!teamDropdownOpen)}
      >
        <span id={styles.dropdownSelectedText}>{team?.name}</span>
        <Image
          src="/dashboard/dropdownTeam.svg"
          width={2000}
          height={2000}
          className={styles.teamdropdownIcon}
          alt="dropdown arrow"
        />
      </div>
      <AnimatePresence>
        {teamDropdownOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            id={styles.teamdropdownMenu}
            ref={dropdownTeamRef}
          >
            {teams.map((t, index) => (
              <div
                key={index}
                className={styles.teamdropdownItem}
                onClick={() => {
                  setTeam(t);
                  setTeamDropdownOpen(false);
                }}
              >
                <span>{t.name}</span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Sidebar() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const itemsRef = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const [scope, animate] = useAnimate();
  const router = useRouter();
  const tab = useCurrentTab();
  useEffect(() => {
    for (const key in itemsRef.current) {
      if (key === tab) {
        const element = itemsRef.current[key];
        if (element) {
          const rect = element.getBoundingClientRect();
          animate(
            scope.current,
            {
              top: rect.top,
              height: rect.height,
            },
            { duration: 0.3, ease: "easeInOut" }
          );
        }
      }
    }
  }, [tab, animate, scope]);

  useEffect(() => {
    let cancelled = false;

    async function fetchSession() {
      try {
        const { data, error } = await authClient.getSession();

        if (cancelled) return;
        if (error || !data?.user) {
          setUsername("");
          setEmail("");
          return;
        }

        setUsername(data.user.name ?? "");
        setEmail(data.user.email ?? "");
      } catch (err) {
        if (!cancelled) console.error("Failed to fetch session:", err);
      }
    }

    fetchSession();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className={styles.sidebar}>
      <div className={styles.sidebarSelected} ref={scope}>
        <span className={styles.selectedYellow} />
        <span className={styles.selectedHighlight} />
      </div>
      <div className={styles.topSidebar}>
        <Image
          src="/dashboard/Sidebar/Hamburger.svg"
          width={2000}
          height={2000}
          alt="toggle sidebar icon"
          className={styles.Hamburgericon}
          onClick={() => setSidebarOpen(!sidebarOpen)}
        />
        <Image
          src="/index/Document.svg"
          width={2000}
          height={2000}
          alt="Logo icon"
          className={styles.logoicon}
        />
        <span className={styles.logoText + " secondarytextGradient"}>
          AutoCAM
        </span>
      </div>
      <div>
        <TeamDropdown />
      </div>
      <hr id={styles.sidebarDivider} />
      <div className={styles.sidebarItems}>
        <div>
          <div
            className={styles.sidebarItem}
            ref={(el) => {
              itemsRef.current["plates"] = el;
            }}
            onClick={() => {
              router.push("/dashboard/plates");
            }}
          >
            <Image
              src="/dashboard/Sidebar/Plates.svg"
              width={2000}
              height={2000}
              alt="Plates icon"
              className={styles.sidebaricon}
            />
            <span>Plates</span>
          </div>
          <div
            className={styles.sidebarItem}
            ref={(el) => {
              itemsRef.current["boxtubes"] = el;
            }}
            onClick={() => {
              router.push("/dashboard/boxtubes");
            }}
          >
            <Image
              src="/dashboard/Sidebar/boxtubes.svg"
              width={2000}
              height={2000}
              alt="Box Tubes icon"
              className={styles.sidebaricon}
            />
            <span>Box Tubes</span>
          </div>
          <div
            className={styles.sidebarItem}
            ref={(el) => {
              itemsRef.current["jobs"] = el;
            }}
            onClick={() => {
              router.push("/dashboard/jobs");
            }}
          >
            <Image
              src="/dashboard/Sidebar/Jobs.svg"
              width={2000}
              height={2000}
              alt="Jobs icon"
              className={styles.sidebaricon}
            />
            <span>Jobs</span>
          </div>
        </div>
        <div>
          <div
            className={styles.sidebarItem}
            ref={(el) => {
              itemsRef.current["quantities"] = el;
            }}
            onClick={() => {
              router.push("/dashboard/quantities");
            }}
          >
            <Image
              src="/dashboard/Sidebar/quantities.svg"
              width={2000}
              height={2000}
              alt="Adjust Quantities icon"
              className={styles.sidebaricon}
            />
            <span>Adjust Quantities</span>
          </div>
          <div
            className={styles.sidebarItem}
            ref={(el) => {
              itemsRef.current["settings"] = el;
            }}
            onClick={() => {
              router.push("/dashboard/settings/personal");
            }}
          >
            <Image
              src="/dashboard/Sidebar/settings.svg"
              width={2000}
              height={2000}
              alt="Settings icon"
              className={styles.sidebaricon}
            />
            <span>Settings</span>
          </div>
          <div
            className={styles.sidebarItem}
            onClick={async () => {
              await authClient.signOut();
              router.push("/login");
            }}
          >
            <Image
              src="/dashboard/Sidebar/logout.svg"
              width={2000}
              height={2000}
              alt="Logout icon"
              className={styles.sidebaricon}
            />
            <span id={styles.logout}>Logout</span>
          </div>
        </div>
      </div>
      <div className={styles.profile}>
        <div id={styles.profileContainer}>
          <Image
            src="/dashboard/UserIcon.svg"
            width={2000}
            height={2000}
            alt="user icon"
            id={styles.profileicon}
          />
          <div id={styles.profileinfo}>
            <span id={styles.username}>{username}</span>
            <span id={styles.email}>{email}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardLayout({ tabs }: { tabs: React.ReactNode }) {
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
      <DashboardEventsProvider>
        <div className={styles.mainContent}>
          <Sidebar />
          <main className={styles.main}>{tabs}</main>
        </div>
      </DashboardEventsProvider>
    </div>
  );
}
