"use client";
import styles from "./dashboard.module.css";

import { PartCategory, BoxTube } from "@/app/types";
import { Header } from "./header/header";
import { PartCatList } from "@/app/dashboard/PartCatCards/PartCat";
import { BoxTubes } from "@/app/dashboard/BoxTubes/BoxTubes";

export default function DashboardPage({
  partcats,
  boxtubes,
}: {
  partcats: PartCategory[];
  boxtubes: BoxTube[];
}) {
  return (
    <div id={styles.dashboardpage}>
      <Header delay={0} />
      <PartCatList partcats={partcats} />
      <BoxTubes boxtubes={boxtubes} />
    </div>
  );
}
