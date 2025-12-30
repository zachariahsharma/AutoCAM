"use client";
import styles from "./page.module.css";
import { motion } from "framer-motion";
import { PrimaryButton, SecondaryButton } from "@/components/Buttons/Buttons";
import localFont from "next/font/local";
import { Roboto } from "next/font/google";
import { authClient } from "@/lib/auth/client";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

const zalando = localFont({
  src: "../public/index/ZalandoSansExpanded-VariableFont_wght.ttf",
  variable: "--font-zalando",
});
const roboto = Roboto({
  subsets: ["latin"],
  variable: "--font-roboto",
  display: "swap",
});

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
  const router = useRouter();
  const [session, setSession] = useState<boolean | null>(null);
  useEffect(() => {
    authClient.getSession().then(s => setSession(s.data != null));
  });
  if (session === null) return;
  console.log(session);

  return (
    <div id={styles.header}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: delay, duration: duration }}
      >
        <button
          id={styles.headerlogoButton}
          onClick={() => router.push("/")}
        >
          <Image
            src="/index/Document.svg"
            width={2000}
            height={2000}
            alt="logo"
            id={styles.headerlogo}
          />
        </button>
        <div>
          {session ? (
            <PrimaryButton
              id={styles.loginbutton}
              onClick={() => router.push("/dashboard")}
              style={{ right: "10px" }}
            >
              <span className={styles.textGradient}>DASHBOARD</span>
            </PrimaryButton>
          ) : <>
            <SecondaryButton
              id={styles.loginbutton}
              onClick={() => router.push("/login")}
            >
              <span className={styles.textGradient}>LOGIN</span>
            </SecondaryButton>
            <PrimaryButton
              id={styles.signupbutton}
              onClick={() => router.push("/signup")}
            >
              <span className={styles.textGradient}>SIGNUP</span>
            </PrimaryButton>
          </>}
        </div>
      </motion.div>
    </div>
  );
}

export default function Home() {
  return (
    <div className={zalando.variable + " " + roboto.variable} id={styles.container}>
      <Background />

      <Header />

      <h1 id={styles.mainHeading}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          the <span className={styles.mainHeadingLargeText}>Future</span> of{" "}
          <span className={styles.mainHeadingLargeText}>FRC&apos;s</span>
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
