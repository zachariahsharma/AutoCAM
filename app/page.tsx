"use client";
import Image from "next/image";
import styles from "./page.module.css";
import { motion } from "framer-motion";
import { PrimaryButton, SecondaryButton } from "@/components/Buttons/Buttons";

function Background() {
  return (
    <div>
      <span id={styles.blur} />
      <video
        width="320"
        height="240"
        // preload="none"
        autoPlay
        playsInline
        muted
        loop
        id={styles.video}
      >
        <source src="/index/263121_small.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
}

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
          <SecondaryButton
            id={styles.loginbutton}
            onclick={() => {
              window.location.href = "/login";
            }}
          >
            <span className={styles.textGradient}>LOGIN</span>
          </SecondaryButton>
          <PrimaryButton
            id={styles.signupbutton}
            onclick={() => {
              window.location.href = "/signup";
            }}
          >
            <span className={styles.textGradient}>SIGNUP</span>
          </PrimaryButton>
        </div>
      </motion.div>
    </div>
  );
}

export default function Home() {
  return (
    <div>
      <Background />

      <Header />

      <h1 id={styles.mainHeading}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          the <span className={styles.mainHeadingLargeText}>Future</span> of{" "}
          <span className={styles.mainHeadingLargeText}>FRC's</span>
        </motion.div>
      </h1>
      <h1 id={styles.secondaryHeading}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <span className={styles.secondarytextGradient}>
            Computer-Aided Manufacturing
          </span>
        </motion.div>
      </h1>
    </div>
  );
}
