"use client";
import styles from "./dashboard.module.css";

import { PartCategory, BoxTube, Plate } from "@/app/types";
import { Header } from "./header/header";
import { PartCatList } from "@/app/dashboard/PartCatCards/PartCat";
import { BoxTubes } from "@/app/dashboard/BoxTubes/BoxTubes";
import { useState } from "react";
import { FinishedCAM } from "./FinishedCAM/FinishedCAM";

export default function DashboardPage({
  partcats,
  boxtubes,
  finishedcam,
}: {
  partcats: PartCategory[];
  boxtubes: BoxTube[];
  finishedcam: Plate[];
}) {
  const [boxtubeOpen, setBoxtubeOpen] = useState(false);
  const [finishedcamOpen, setFinishedcamOpen] = useState(false);
  return (
    <div id={styles.dashboardpage}>
      <Header delay={0} setBoxtubeOpen={setBoxtubeOpen} setFinishedcamOpen={setFinishedcamOpen} finishedcamOpen={finishedcamOpen} />
      <PartCatList partcats={partcats} />
      <BoxTubes
        boxtubes={boxtubes}
        boxtubeOpen={boxtubeOpen}
        setBoxtubeOpen={setBoxtubeOpen}
      />
      {/* <FinishedCAM
        finishedcam={finishedcam}
        finishedcamOpen={finishedcamOpen}
        setFinishedcamOpen={setFinishedcamOpen}
      /> */}
    </div>
  );
}
