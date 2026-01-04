"use client";
import styles from "./materialthickness.module.css";
import { PartCategory, Part, Plate } from "@/app/types";
import AvailableParts from "./AvailableParts/AvailableParts";
import { Header } from "./header/header";
import PlatesToCreate from "./PlatesToCreate/PlatesToCreate";
import { useEffect, useState } from "react";
import { useAnimate } from "framer-motion";
import { Unassigned } from "./PlateAssignment/Unassigned";
import { PartsToPlates } from "./PartsToPlates/PartsToPlates";
import { useRouter } from "next/navigation";
import { useMaterialEvents } from "./materialEvents";

export default function MaterialThickness({
  pcid,
  teamid,
}: {
  pcid: string;
  teamid: string;
}) {
  const [scope, animate] = useAnimate();
  const [partcategory, setPartcategory] = useState<PartCategory | null>(null);
  const [epicsMap, setEpicsMap] = useState<{ [key: string]: Part[] }>({});
  const router = useRouter();
  const {
    setParts,
    setPlates,
    plates,
    selectedParts,
    setSelectedParts,
    partsToPlates,
    setPartsToPlates,
    unassignedParts,
    setUnassignedParts,
  } = useMaterialEvents();

  useEffect(() => {
    for (const plate of plates) {
      if (!partsToPlates![plate.id]) {
        partsToPlates![plate.id] = [];
      }
    }
    setPartsToPlates!({ ...partsToPlates });
  }, [plates]);

  useEffect(() => {
    let mounted = true;
    async function fetchData() {
      const res = await fetch(`/api/teams/${teamid}/pc/`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      let data = await res.json();
      let found = false;
      for (const pc of data) {
        if (pc.id.toString() === pcid) {
          data = pc;
          found = true;
          break;
        }
      }
      if (found === false) {
        router.push("/404");
      }
      const response = await fetch(`/api/pc/${data.id}/parts`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      let partsData = await response.json();
      setParts(partsData);
      let selectedPartsInit: { [key: string]: number } = {};
      for (const part of partsData) {
        selectedPartsInit[part.id] = 0;
      }
      setSelectedParts(selectedPartsInit);
      setUnassignedParts(selectedPartsInit);
      data.parts = partsData;
      console.log("Fetched Part Category:", data);
      setPartcategory(data);
      const mappedEpics: { [key: string]: Part[] } = {};
      data.parts.forEach((part: Part) => {
        if (!mappedEpics[part.epic]) {
          mappedEpics[part.epic] = [];
        }
        mappedEpics[part.epic].push(part);
      });
      setEpicsMap(mappedEpics);
    }

    fetchData();
    return () => {
      mounted = false;
    };
  }, [pcid]);
  const [sorting, setSorting] = useState(false);
  useEffect(() => {
    let total = 0;
    for (const partId in selectedParts) {
      total += selectedParts[partId];
    }
    if (plates.length > 0 && total > 0) {
      animate(
        scope.current,
        { height: "calc(50vh - 180px)" },
        { duration: 0.5 }
      );
      setSorting(true);
    } else {
      animate(
        scope.current,
        { height: "calc(100vh - 180px)" },
        { duration: 0.5 }
      );
      setSorting(false);
    }
  }, [plates, selectedParts]);
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
          categoryId={partcategory !== null ? partcategory.id : 0}
        />
      </div>
      {sorting ? (
        <div className={styles.contentSorting}>
          <Unassigned />
          <PartsToPlates categoryId={partcategory !== null ? partcategory.id : 0} />
        </div>
      ) : null}
    </div>
  );
}
