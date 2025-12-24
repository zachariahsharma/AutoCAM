import styles from "./joinclub.module.css";
import SettingsLayout from "../Layout";

export default function JoinClubSettingsPage() {
  return (
    <SettingsLayout selected={"jointeam"}>
      <div className={styles.joinTeamContainer}>
        <h1>Join Club Settings</h1>
      </div>
    </SettingsLayout>
  );
}
