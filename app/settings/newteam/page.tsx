import styles from "./newclub.module.css";
import SettingsLayout from "../Layout";

export default function NewClubSettingsPage() {
  return (
    <SettingsLayout selected={"newteam"}>
      <div className={styles.newClubContainer}>
        <h1>New Club Settings</h1>
      </div>
    </SettingsLayout>
  );
}
