"use client";

import styles from "./personal.module.css";
// import SettingsLayout from "../../Layout";
import { useState } from "react";
import { PrimaryButton } from "@/components/Buttons/Buttons";

export default function PersonalSettingsPage({
  currentUsername,
  currentEmail,
}: {
  currentUsername: string;
  currentEmail: string;
}) {
  const [username, setUsername] = useState(currentUsername);
  const [email, setEmail] = useState(currentEmail);
  return (
    // <SettingsLayout selected={"personal"}>
    <div className={styles.personalContainer}>
      <h1>Personal</h1>
      <hr />
      <form>
        <label>Username</label>
        <input
          type="text"
          value={username}
          onChange={(val) => setUsername(val.target.value)}
        />
        <label>Email</label>
        <input
          type="text"
          value={email}
          onChange={(val) => setEmail(val.target.value)}
        />
        <PrimaryButton type="submit" id={styles.submitbutton}>
          <span className="textGradient">Save</span>
        </PrimaryButton>
      </form>
    </div>
    // </SettingsLayout>
  );
}
