"use client";

import {
  DashboardEventsProvider,
  useDashboardEvents,
} from "@/app/dashboard/dashboardTeam";
import { SidebarProvider, useSidebar } from "@/app/dashboard/sidebarContext";
import styles from "./layout.module.css";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Team } from "@/app/types";
import { motion, AnimatePresence, useAnimate } from "framer-motion";
import { useSelectedLayoutSegment, usePathname } from "next/navigation";

export function useCurrentTab() {
  const segment = useSelectedLayoutSegment("tabs");
  const path = usePathname();
  console.log("Current path:", path, "Segment:", segment);
  if (!segment && path.includes("/dashboard/settings")) {
    console.log("Defaulting to settings tab");
    return "settings";
  }
  return segment ?? "default";
}

function TeamDropdown() {
  const [teamDropdownOpen, setTeamDropdownOpen] = useState(false);
  const { team, setTeam } = useDashboardEvents();
  const [teams, setTeams] = useState<Team[]>([]);
  const dropdownTeamRef = useRef<HTMLDivElement>(null);
  const { isCollapsed } = useSidebar();

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

  if (isCollapsed) {
    return null; // Hide team dropdown when collapsed
  }

  return (
    <div className={styles.teamDropdownContainer}>
      <div
        id={styles.teamdropdown}
        onClick={() => setTeamDropdownOpen(!teamDropdownOpen)}
      >
        <span id={styles.dropdownSelectedText}>
          {team?.name || "No Teams Found"}
        </span>
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
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const itemsRef = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const [scope, animate] = useAnimate();
  const router = useRouter();
  const tab = useCurrentTab();
  const { isCollapsed, toggleSidebar } = useSidebar();

  useEffect(() => {
    console.log("tab changed to:", tab);
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
  }, [tab, animate, scope, isCollapsed]);

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
    <div
      className={`${styles.sidebar} ${
        isCollapsed ? styles.sidebarCollapsed : ""
      }`}
    >
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
          onClick={toggleSidebar}
        />
        {!isCollapsed && (
          <>
            <Image
              src="/index/Document.svg"
              width={2000}
              height={2000}
              alt="Logo icon"
              onClick={() => router.push("/")}
              className={styles.logoicon}
            />
            <span className={styles.logoText + " secondarytextGradient"}>
              AutoCAM
            </span>
          </>
        )}
      </div>
      <div className={styles.teamDropdownWrapper}>
        <TeamDropdown />
      </div>
      {!isCollapsed && <hr id={styles.sidebarDivider} />}
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
            title="Plates"
          >
            <Image
              src="/dashboard/Sidebar/Plates.svg"
              width={2000}
              height={2000}
              alt="Plates icon"
              className={styles.sidebaricon}
            />
            {!isCollapsed && <span>Plates</span>}
          </div>
          <div
            className={styles.sidebarItem}
            ref={(el) => {
              itemsRef.current["boxtubes"] = el;
            }}
            onClick={() => {
              router.push("/dashboard/boxtubes");
            }}
            title="Box Tubes"
          >
            <Image
              src="/dashboard/Sidebar/boxtubes.svg"
              width={2000}
              height={2000}
              alt="Box Tubes icon"
              className={styles.sidebaricon}
            />
            {!isCollapsed && <span>Box Tubes</span>}
          </div>
          <div
            className={styles.sidebarItem}
            ref={(el) => {
              itemsRef.current["jobs"] = el;
            }}
            onClick={() => {
              router.push("/dashboard/jobs");
            }}
            title="Jobs"
          >
            <Image
              src="/dashboard/Sidebar/Jobs.svg"
              width={2000}
              height={2000}
              alt="Jobs icon"
              className={styles.sidebaricon}
            />
            {!isCollapsed && <span>Jobs</span>}
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
            title="Adjust Quantities"
          >
            <Image
              src="/dashboard/Sidebar/quantities.svg"
              width={2000}
              height={2000}
              alt="Adjust Quantities icon"
              className={styles.sidebaricon}
            />
            {!isCollapsed && <span>Adjust Quantities</span>}
          </div>
          <div
            className={styles.sidebarItem}
            ref={(el) => {
              itemsRef.current["settings"] = el;
            }}
            onClick={() => {
              router.push("/dashboard/settings/personal");
            }}
            title="Settings"
          >
            <Image
              src="/dashboard/Sidebar/settings.svg"
              width={2000}
              height={2000}
              alt="Settings icon"
              className={styles.sidebaricon}
            />
            {!isCollapsed && <span>Settings</span>}
          </div>
          <div
            className={styles.sidebarItem}
            onClick={async () => {
              await authClient.signOut();
              router.push("/login");
            }}
            title="Logout"
          >
            <Image
              src="/dashboard/Sidebar/logout.svg"
              width={2000}
              height={2000}
              alt="Logout icon"
              className={styles.sidebaricon}
            />
            {!isCollapsed && <span id={styles.logout}>Logout</span>}
          </div>
        </div>
      </div>
      <div className={styles.profile}>
        <div
          id={styles.profileContainer}
          className={isCollapsed ? styles.profileCollapsed : ""}
        >
          <Image
            src="/dashboard/UserIcon.svg"
            width={2000}
            height={2000}
            alt="user icon"
            id={styles.profileicon}
          />
          {!isCollapsed && (
            <div id={styles.profileinfo}>
              <span id={styles.username}>{username}</span>
              <span id={styles.email}>{email}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DashboardLayout({ tabs }: { tabs: React.ReactNode }) {
  useEffect(() => {
    // Set default sidebar width
    document.documentElement.style.setProperty("--sidebar-width", "300px");

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
      <SidebarProvider>
        <DashboardEventsProvider>
          <div className={styles.mainContent}>
            <Sidebar />
            <main className={styles.main}>{tabs}</main>
          </div>
        </DashboardEventsProvider>
      </SidebarProvider>
    </div>
  );
}
