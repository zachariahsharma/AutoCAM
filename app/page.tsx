"use client";
import Image from "next/image";
import styles from "./page.module.css";
import { motion } from "framer-motion";

function Background() {
  return (
    <div>
      <span id={styles.blur} />
      <video
        width="320"
        height="240"
        preload="none"
        autoPlay
        muted
        loop
        id={styles.video}
      >
        <source src="/index/ValorReveal.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
}

function SecondaryButton({
  children,
  className,
  onclick,
}: {
  children?: React.ReactNode;
  className?: string;
  onclick?: () => void;
}) {
  return (
    <button
      onClick={onclick}
      className={styles.secondaryButton + " " + className}
    >
      {children}
    </button>
  );
}

function PrimaryButton({
  children,
  className,
  onclick,
}: {
  children?: React.ReactNode;
  className?: string;
  onclick?: () => void;
}) {
  return (
    <button
      onClick={onclick}
      className={styles.primaryButton + " " + className}
    >
      {children}
    </button>
  );
}

function Header() {
  return (
    <div id={styles.header}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
      >
        <img
          src="/index/Document.svg"
          width={2000}
          height={2000}
          alt="logo"
          id={styles.headerlogo}
        />
        <div>
          <SecondaryButton
            className={styles.loginbutton}
            onclick={() => {
              window.location.href = "/login";
            }}
          >
            <span className={styles.textGradient}>LOGIN</span>
          </SecondaryButton>
          <PrimaryButton className={styles.signupbutton}>
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
          transition={{ delay: .5, duration: 0.5 }}
        >
          <span className={styles.secondarytextGradient}>
            Computer-Aided Manufacturing
          </span>
        </motion.div>
      </h1>
    </div>
  );
}
