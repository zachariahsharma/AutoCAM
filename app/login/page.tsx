"use client";
import styles from "./login.module.css";
import { motion } from "framer-motion";
import { PrimaryButton, SecondaryButton } from "@/components/Buttons/Buttons";
import { Header } from "@/app/page";
import { authClient } from "@/lib/auth-client";
import { redirect } from "next/navigation";
import { FormEvent } from "react";
function LoginContainer() {
  const login = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const { data, error } = await authClient.signIn.email(
      { email, password },
      {
        onSuccess: () => redirect("/dashboard"),
      }
    );
  };
  return (
    <motion.div
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 50, delay: 0.2, duration: 1 }}
      id={styles.logincontainer}
    >
      <h1 id={styles.loginheader}>
        <span className={styles.secondarytextGradient}>Log In</span>
      </h1>
      <p id={styles.welcomeText}>Welcome back</p>
      <hr id={styles.horizontalrule} />
      <form onSubmit={login}>
        <label className={styles.inputLabel}>Email</label>
        <br />
        <input
          type="email"
          placeholder="Enter your email"
          className={styles.input}
          name="email"
          required
        />
        <br />
        <label className={styles.inputLabel}>Password</label>
        <br />
        <input
          type="password"
          placeholder="Enter your Password"
          className={styles.input}
          name="password"
          required
        />
        <SecondaryButton id={styles.loginbutton} type="submit">
          <span className={styles.loginbuttontext + " " + styles.textGradient}>
            LOG IN
          </span>
        </SecondaryButton>
      </form>
      <div>
        <span id={styles.alreadyHaveAccount}>Don't have an account yet?</span>
        <a href="/signup" id={styles.signup}>
          Sign Up
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
      <img src="/auth/Robot2025.png" alt="robot pic" width={400} height={400} />
      <span id={styles.label}>Flatline '25</span>
    </motion.div>
  );
}

export default function loginPage() {
  return (
    <div>
      <Header delay={0.5} duration={0.5} />
      <RobotPic />
      <LoginContainer />
    </div>
  );
}
