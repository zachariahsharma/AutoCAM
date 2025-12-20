"use client";
import styles from "./materialthickness.module.css";
import { PartCategory, Part, Plate } from "@/app/types";
import AvailableParts from "./AvailableParts/AvailableParts";
import { Header } from "./header/header";
import PlatesToCreate from "./PlatesToCreate/PlatesToCreate";
import { useEffect, useState } from "react";
import { useAnimate } from "framer-motion";

export default function MaterialThickness({
  partcategory,
  epicsMap,
}: {
  partcategory: PartCategory;
  epicsMap: { [key: string]: Part[] };
}) {
  const [scope, animate] = useAnimate();
  const [plates, setPlates] = useState<Plate[]>([]);
  useEffect(() => {
    if (plates.length > 0) {
      animate(
        scope.current,
        { height: "calc(50vh - 110px)" },
        { duration: 0.5 }
      );
    } else {
      animate(
        scope.current,
        { height: "calc(100vh - 110px)" },
        { duration: 0.5 }
      );
    }
  }, [plates, animate, scope]);
  return (
    <div className={styles.container}>
      <Header
        material={partcategory?.material}
        thickness={partcategory?.thickness}
      />
      <div className={styles.contentData} ref={scope}>
        <AvailableParts epicsMap={epicsMap} />
        <PlatesToCreate
          plates={plates}
          setPlates={setPlates}
          categoryId={partcategory.id}
        />
      </div>
      <div className={styles.contentSorting}>

      </div>
    </div>
  );
}
