"use client";
import styles from "./dashboard.module.css";

import { PartCategory, BoxTube } from "@/app/types";
import { Header } from "./header/header";
import { PartCatList } from "@/app/dashboard/PartCatCards/PartCat";
import { BoxTubes } from "@/app/dashboard/BoxTubes/BoxTubes";
import { useState } from "react";
import { motion } from "framer-motion";

export default function DashboardPage({
  partcats,
  boxtubes,
}: {
  partcats: PartCategory[];
  boxtubes: BoxTube[];
}) {
  const [boxtubeOpen, setBoxtubeOpen] = useState(false);
  return (
    <div id={styles.dashboardpage}>
      <Header delay={0} setBoxtubeOpen={setBoxtubeOpen} />
      <PartCatList partcats={partcats} />
      <BoxTubes boxtubes={boxtubes} boxtubeOpen={boxtubeOpen} setBoxtubeOpen={setBoxtubeOpen} />
    </div>
  );
}
