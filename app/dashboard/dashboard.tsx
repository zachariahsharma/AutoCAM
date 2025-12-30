"use client";
import styles from "./dashboard.module.css";

import { Plate } from "@/app/types";
import { Header } from "./header/header";
import { PartCatList } from "@/app/dashboard/PartCatCards/PartCat";
import { BoxTubes } from "@/app/dashboard/BoxTubes/BoxTubes";
import { useState } from "react";
import { FinishedCAM } from "./FinishedCAM/FinishedCAM";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";
import { DashboardEventsProvider } from "./dashboardTeam";

export function AccountDropdown({ scope }: { scope: any }) {
  const router = useRouter();
  async function signOut() {
    await authClient.signOut();
    router.push("/login");
  }

  return (
    <div className={styles.accountdropdown} ref={scope}>
      <div
        className={styles.settingscategory}
        onClick={() => router.push("/settings")}
      >
        <Image
          src="/account/Settings.svg"
          width={2000}
          height={2000}
          alt="settings icon"
          id={styles.settingsicon}
          onClick={() => router.push("/settings")}
        />
        <span onClick={() => router.push("/settings")}>Settings</span>
      </div>
      <hr />
      <div className={styles.logoutcategory} onClick={signOut}>
        <Image
          src="/account/Logout.svg"
          width={2000}
          height={2000}
          alt="logout icon"
          id={styles.logouticon}
        />
        <span>Logout</span>
      </div>
    </div>
  );
}

export default function DashboardPage({
  finishedcam,
}: {
  finishedcam: Plate[];
}) {

  const [boxtubeOpen, setBoxtubeOpen] = useState(false);
  const [finishedcamOpen, setFinishedcamOpen] = useState(false);
  
  return (
    <div id={styles.dashboardpage}>
      <DashboardEventsProvider>
        <Header
          delay={0}
          setBoxtubeOpen={setBoxtubeOpen}
          setFinishedcamOpen={setFinishedcamOpen}
          finishedcamOpen={finishedcamOpen}
        />
        <PartCatList />
        <BoxTubes
          boxtubeOpen={boxtubeOpen}
          setBoxtubeOpen={setBoxtubeOpen}
        />
        <FinishedCAM
          finishedcam={finishedcam}
          finishedcamOpen={finishedcamOpen}
          setFinishedcamOpen={setFinishedcamOpen}
        />
      </DashboardEventsProvider>
    </div>
  );
}
