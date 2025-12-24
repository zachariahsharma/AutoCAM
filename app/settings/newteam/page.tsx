import styles from "./newteam.module.css";
import SettingsLayout from "../Layout";

export default function NewteamSettingsPage() {
  return (
    <SettingsLayout selected={"newteam"}>
      <div className={styles.newteamContainer}>
        <h1>New team Settings</h1>
      </div>
    </SettingsLayout>
  );
}
