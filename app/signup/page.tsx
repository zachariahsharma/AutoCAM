"use client";
import styles from "./signup.module.css";
import { motion } from "framer-motion";
import { PrimaryButton, SecondaryButton } from "@/components/Buttons/Buttons";
import { Header } from "@/app/page";

function SignupContainer() {
  return (
    <div id={styles.signupcontainer}>
      <h1 id={styles.signupheader}>
        <span className={styles.secondarytextGradient}>Sign Up</span>
      </h1>
      <p id={styles.welcomeText}>Welcome to AutoCAM</p>
      <hr id={styles.horizontalrule} />
      <label className={styles.inputLabel}>Email</label>
      <br />
      <input
        type="text"
        placeholder="Enter your email"
        className={styles.input}
      />
      <br />
      <label className={styles.inputLabel}>Password</label>
      <br />
      <input
        type="password"
        placeholder="Enter your Password"
        className={styles.input}
      />
      <PrimaryButton id={styles.signupbutton}>
        <span className={styles.signupbuttontext + " " + styles.textGradient}>SIGN UP</span>
      </PrimaryButton>
      <div>
        <span id={styles.alreadyHaveAccount}>Aleady have an account?</span>
        <a href="/login" id={styles.login}>Log In</a>
      </div>
    </div>
  );
}

function RobotPic() {
  return (
    <div id={styles.robotpic}>
      <img src="/auth/Robot2025.png" alt="robot pic" width={400} height={400} />
      <span id={styles.label}>Flatline '25</span>
    </div>
  );
}

export default function SignupPage() {
  return (
    <div>
      <Header />
      <RobotPic />
      <SignupContainer />
    </div>
  );
}
