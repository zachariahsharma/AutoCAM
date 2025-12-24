"use client";
import styles from "./signup.module.css";
import { motion, useAnimate,AnimatePresence } from "framer-motion";
import { PrimaryButton } from "@/components/Buttons/Buttons";
import { Header } from "@/app/page";
import { FormEvent, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useState } from "react";

function SignupContainer() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [scope1, animate1] = useAnimate();
  const [scope2, animate2] = useAnimate();
  const [scope3, animate3] = useAnimate();
  const [scope4, animate4] = useAnimate();
  const [userExists, setUserExists] = useState(false);
  const [insecure, setInsecurePassword] = useState(false);
  const [mismatch, setMismatch] = useState(false);
  const [strength, setStrength] = useState(0);
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    let strengthCount = 0;
    if (password.length >= 8) strengthCount++;
    if (/[A-Z]/.test(password)) strengthCount++;
    if (/[0-9]/.test(password)) strengthCount++;
    if (/[^A-Za-z0-9]/.test(password)) strengthCount++;
    setStrength(strengthCount);
    animate1(
      scope1.current,
      { backgroundColor: strengthCount >= 1 ? "#4ade80" : "rgba(0,0,0,0)" },
      { duration: 0.5 }
    );
    animate2(
      scope2.current,
      { backgroundColor: strengthCount >= 2 ? "#4ade80" : "rgba(0,0,0,0)" },
      { duration: 0.5 }
    );
    animate3(
      scope3.current,
      { backgroundColor: strengthCount >= 3 ? "#4ade80" : "rgba(0,0,0,0)" },
      { duration: 0.5 }
    );
    animate4(
      scope4.current,
      { backgroundColor: strengthCount >= 4 ? "#4ade80" : "rgba(0,0,0,0)" },
      { duration: 0.5 }
    );
  }, [password]);
  async function signup(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");
    let failure = false;
    if (password !== confirmPassword) {
      setMismatch(true);
      failure = true
    } else {
      setMismatch(false);
    }
    if (strength < 4) {
      setInsecurePassword(true);
      failure = true
    } else {
      setInsecurePassword(false);
    }
    if (failure) return;
    const { error } = await authClient.signUp.email(
      {
        email,
        password,
        name: email,
        callbackURL: "/dashboard",
      },
      {
        onSuccess: () => router.push("/dashboard"),
      }
    );
    if (error?.code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL") {
      setUserExists(true);
    } else {
      setUserExists(false);
      if (error) {
        setMessage(error?.message ?? "");
        setErrorModalOpen(true);
      }
    }
    
    console.log(error);
  }

  return (
    <>
    <motion.div
      layout
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
        <Alert message="User with this email already exists!" open={userExists} />
        <label className={styles.inputLabel}>Password</label>
        <br />
        <input
          type="password"
          placeholder="Enter your Password"
          name="password"
          className={styles.input}
          style={{ marginBottom: "5px" }}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Alert message="Password isn't secure!" open={insecure} className={styles.insecure} />
        <div id={styles.passwordMeter}>
          <div className={styles.meters}>
            <div className={styles.meterFill} ref={scope1} />
          </div>
          <div className={styles.meters}>
            <div className={styles.meterFill} ref={scope2} />
          </div>
          <div className={styles.meters}>
            <div className={styles.meterFill} ref={scope3} />
          </div>
          <div className={styles.meters}>
            <div className={styles.meterFill} ref={scope4} />
          </div>
        </div>
        <div>
          <div className={styles.passwordCriteria}>
            <span>8 characters</span>
            <span>1 uppercase</span>
          </div>
          <div className={styles.passwordCriteria}>
            <span>1 number</span>
            <span>1 special character</span>
          </div>
        </div>
        <br />
        <label className={styles.inputLabel}>Confirm Password</label>
        <br />
        <input
          type="password"
          placeholder="Enter your Password"
          name="confirmPassword"
          className={styles.input}
        />
        <Alert message="Password's aren't matching!" open={mismatch} />
        <PrimaryButton
          id={styles.signupbutton}
          type="submit"
          onClick={() => {
            setMessage("Beans");
            // setErrorModalOpen(true);
          }}
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
      <AlertModal message={message} open={errorModalOpen} />
      </>
  );
}



export function Alert({
  message,
  open,
  className,
}: {
  message: string;
  open: boolean;
  className?: string;
}) {
  return (
    <motion.div
      layout
      style={{ overflow: "hidden" }}
      initial={false}
      animate={{ height: open ? "auto" : 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 24 }}
      className={className}
    >
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="alert-content"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className={styles.alert}
          >
            <Image
              src="/auth/Warning.svg"
              alt="warning"
              width={2000}
              height={2000}
              className={styles.warningimage}
            />
            <span>{message}</span>
            <Image
              src="/auth/Warning.svg"
              alt="warning"
              width={2000}
              height={2000}
              className={styles.warningimage}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function AlertModal({
  message,
  open,
}: {
  message: string;
  open: boolean;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={styles.alertmodal}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className={styles.alertmodalcontent}>
            <h1>Error 😬</h1>
            <span>{message}</span>
            <span>Oops! Looks like we had an error. Try reloading and checking your internet connection and try again.</span>
            <PrimaryButton
              onClick={() => {
                window.location.reload();
              }}
              className={styles.alertmodalbutton}
            >Reload</PrimaryButton>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function RobotPic() {
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
        width={2000}
        height={2000}
        id={styles.robotimage}
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
