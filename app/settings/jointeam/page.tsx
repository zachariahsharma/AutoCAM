import styles from "./jointeam.module.css";
import SettingsLayout from "../Layout";

export default function JointeamSettingsPage() {
  return (
    <SettingsLayout selected={"jointeam"}>
      <div className={styles.joinTeamContainer}>
        <h1>Join team Settings</h1>
      </div>
    </SettingsLayout>
  );
}
