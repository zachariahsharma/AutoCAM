import styles from "./header.module.css";
import { motion, useAnimate, AnimatePresence } from "framer-motion";
import { PrimaryButton, SecondaryButton } from "@/components/Buttons/Buttons";
import { Team } from "@/app/types";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { AccountDropdown } from "../dashboard";
import { useEffect, useState, useRef } from "react";
import { useDashboardEvents } from "../dashboardTeam";

export function Header({
  delay = 1,
  duration = 0.5,
  setBoxtubeOpen,
  setFinishedcamOpen,
  finishedcamOpen,
}: {
  delay?: number;
  duration?: number;
  setBoxtubeOpen: (open: boolean) => void;
  setFinishedcamOpen: (open: boolean) => void;
  finishedcamOpen: boolean;
}) {
  const router = useRouter();
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const { team, setTeam } = useDashboardEvents();
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
  const [scope, animate] = useAnimate();
  const [teamDropdownOpen, setTeamDropdownOpen] = useState(false);
  useEffect(() => {
    if (accountDropdownOpen) {
      animate(
        scope.current,
        { opacity: 1, pointerEvents: "auto", y: 0 },
        { duration: 0.2 }
      );
    } else {
      animate(
        scope.current,
        { opacity: 0, pointerEvents: "none", y: -20 },
        { duration: 0.2 }
      );
    }
  }, [accountDropdownOpen]);
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownTeamRef.current &&
        !dropdownTeamRef.current.contains(e.target as Node)
      ) {
        setTeamDropdownOpen(false);
      }
    }

    if (accountDropdownOpen || teamDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [accountDropdownOpen, teamDropdownOpen]);
  return (
    <div id={styles.header}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: delay, duration: duration }}
      >
        <button id={styles.headerlogoButton} onClick={() => router.push("/")}>
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
        {team ? (
          <div
            id={styles.teamdropdown}
            onClick={() => setTeamDropdownOpen(!teamDropdownOpen)}
          >
            <span id={styles.dropdownSelectedText}>{team.name}</span>
            <Image
              src="/dashboard/dropdownTeam.svg"
              width={2000}
              height={2000}
              className={styles.teamdropdownIcon}
              alt="dropdown arrow"
            />
          </div>
        ) : null}
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
        <div>
          <SecondaryButton
            id={styles.finishedcambutton}
            onClick={() => setFinishedcamOpen(!finishedcamOpen)}
          >
            <span className="textGradient">Finished CAM</span>
          </SecondaryButton>
          <PrimaryButton
            id={styles.boxtubesbutton}
            onClick={() => setBoxtubeOpen(true)}
          >
            <span className="textGradient">Box Tubes</span>
          </PrimaryButton>
          <PrimaryButton id={styles.adjustquantitiesbutton}>
            <span className="textGradient">Adjust Quantities</span>
          </PrimaryButton>
          <div
            id={styles.usericoncontainer}
            onClick={() => setAccountDropdownOpen(!accountDropdownOpen)}
          >
            <Image
              src="/dashboard/UserIcon.svg"
              width={2000}
              height={2000}
              alt="user icon"
              onClick={() => setAccountDropdownOpen(!accountDropdownOpen)}
              id={styles.usericon}
            />
          </div>

          <AccountDropdown scope={scope} />
        </div>
      </motion.div>
    </div>
  );
}
