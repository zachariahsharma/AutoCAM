"use client";
import styles from "./signup.module.css";
import { motion } from "framer-motion";
import { PrimaryButton } from "@/components/Buttons/Buttons";
import { Header } from "@/app/page";
import { FormEvent } from "react";
import { authClient } from "@/lib/auth-client";
import { redirect } from "next/navigation";
import Image from "next/image";

function SignupContainer() {
  async function signup(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    await authClient.signUp.email(
      {
        email,
        password,
        name: email,
      },
      {
        onSuccess: () => redirect("/dashboard"),
      }
    );
  }

  return (
    <motion.div
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 50, delay: 0.2, duration: 1 }}
      id={styles.signupcontainer}
    >
      <h1 id={styles.signupheader}>
        <span className={styles.secondarytextGradient}>Sign Up</span>
      </h1>
      <p id={styles.welcomeText}>Welcome to AutoCAM</p>
      <hr id={styles.horizontalrule} />
      <form onSubmit={signup}>
        <label className={styles.inputLabel}>Email</label>
        <br />
        <input
          type="email"
          placeholder="Enter your email"
          name="email"
          className={styles.input}
        />
        <br />
        <label className={styles.inputLabel}>Password</label>
        <br />
        <input
          type="password"
          placeholder="Enter your Password"
          name="password"
          className={styles.input}
        />
        <PrimaryButton id={styles.signupbutton}
          onClick={() => redirect("/dashboard")}
        >
          <span className={styles.signupbuttontext + " " + styles.textGradient}>
            SIGN UP
          </span>
        </PrimaryButton>
      </form>
      <div>
        <span id={styles.alreadyHaveAccount}>Aleady have an account?</span>
        <a href="/login" id={styles.login}>
          Log In
        </a>
      </div>
    </motion.div>
  );
}

function RobotPic() {
  return (
    <motion.div
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      id={styles.robotpic}
      transition={{ type: "spring", stiffness: 50, delay: 0.2, duration: 1 }}
    >
      <Image
        src="/auth/Robot2025.png"
        alt="robot pic"
        width={400}
        height={400}
      />
      <span id={styles.label}>Flatline &apos;25</span>
    </motion.div>
  );
}

export default function SignupPage() {
  return (
    <div>
      <Header delay={0.5} duration={0.5} />
      <RobotPic />
      <SignupContainer />
    </div>
  );
}
