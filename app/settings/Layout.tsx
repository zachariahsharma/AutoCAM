"use client";
import styles from "./layout.module.css";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAnimate } from "framer-motion";
import { useEffect, useState } from "react";

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

function Sidebar({ selected }: { selected: string }) {
  const [top, setTop] = useState(2);
  const router = useRouter();
  let teams = ["Valor 6800", "Orbit 1690", "Madtown 1323"];
  useEffect(() => {
    if (selected === "personal") {
      setTop(2);
    } else if (selected === "0" || Number.parseInt(selected)) {
      setTop(2 + 34 * (Number.parseInt(selected) + 1));
    } else if (selected == "newteam") {
      setTop(144);
    } else if (selected == "jointeam") {
      setTop(181);
    }
  }, [selected]);
  return (
    <aside className={styles.sidebar}>
      <span id={styles.selected} style={{ top: top }} />
      <div
        onClick={() => {
          router.push("/settings/personal");
        }}
        style={
          selected === "personal"
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
            router.push("/settings/teams/" + index);
          }}
          style={
            selected === String(index)
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
          <span>{team}</span>
        </div>
      ))}
      <hr />
      <div
        onClick={() => {
          router.push("/settings/newteam");
        }}
        style={
          selected === "newteam"
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
          router.push("/settings/jointeam");
        }}
        style={
          selected === "jointeam"
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

export default function SettingsLayout({
  children,
  selected,
}: {
  children: React.ReactNode;
  selected: string;
}) {
  return (
    <div className={styles.container}>
      <Header />
      <div className={styles.mainContent}>
        <Sidebar selected={selected} />
        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
}
