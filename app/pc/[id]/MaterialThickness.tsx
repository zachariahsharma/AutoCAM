"use client";
import styles from "./materialthickness.module.css";
import { PartCategory, Part } from "@/app/types";
import AvailableParts from "./AvailableParts/AvailableParts";
import { Header } from "./header/header";

export default function MaterialThickness({
  partcategory,
  epicsMap,
}: {
  partcategory: PartCategory | null;
  epicsMap: { [key: string]: Part[] };
}) {
  return (
    <div className={styles.container}>
      <Header
        material={partcategory?.material}
        thickness={partcategory?.thickness}
      />
      <AvailableParts epicsMap={epicsMap} />
    </div>
  );
}
