"use client";

import styles from "./dashboard.module.css";
import { motion } from "framer-motion";
import { PrimaryButton, SecondaryButton } from "@/components/Buttons/Buttons";

export function Header({
  delay = 1,
  duration = 0.5,
}: {
  delay?: number;
  duration?: number;
}) {
  return (
    <div id={styles.header}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: delay, duration: duration }}
      >
        <button
          id={styles.headerlogoButton}
          onClick={() => {
            window.location.href = "/";
          }}
        >
          <img
            src="/index/Document.svg"
            width={2000}
            height={2000}
            alt="logo"
            id={styles.headerlogo}
          />
        </button>
        <div>
          <SecondaryButton id={styles.finishedcambutton}>
            <span className={styles.textGradient}>Finished CAM</span>
          </SecondaryButton>
          <PrimaryButton id={styles.boxtubesbutton}>
            <span className={styles.textGradient}>Box Tubes</span>
          </PrimaryButton>
          <div id={styles.usericoncontainer}>
            <img
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

export default function DashboardPage() {
  return (
    <div id={styles.dashboardpage}>
      <Header />
    </div>
  );
}
