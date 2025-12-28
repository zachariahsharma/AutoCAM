import styles from "./partstoplates.module.css";
import { useMaterialEvents } from "../materialEvents";
import Image from "next/image";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { set } from "zod";

export function PartsToPlates() {
  const { plates } = useMaterialEvents();
  return (
    <div className={styles.container}>
      <div className={styles.cardsContainer}>
        {Object.entries(plates).map(([name]) => (
          <PartsToPlatesCard key={name} name={name} />
        ))}
      </div>
    </div>
  );
}

function PartsToPlatesCard({ name }: { name: string }) {
  const {
    partsToPlates,
    setPartsToPlates,
    plates,
    unassignedParts,
    setUnassignedParts,
  } = useMaterialEvents();
  function onReceive(data: {
    partId: number;
    quantity: number;
    from?: number;
  }) {
    if (!partsToPlates || !setPartsToPlates) return;
    console.log("Received data:", data);
    if (data.from) {
      const oldPlateId = data.from;
      console.log("Removing from plate:", oldPlateId);
      const oldPlate = partsToPlates[oldPlateId] || [];
      partsToPlates[oldPlateId] = oldPlate.map((part) => {
        if (part.partId === data.partId) {
          return {
            partId: part.partId,
            quantity: part.quantity - data.quantity,
          };
        }
        return part;
      });
      setPartsToPlates({ ...partsToPlates });
    } else if (!data.from) {
      const currentQuantity = unassignedParts[data.partId] || 0;
      const newQuantity = Math.max(0, currentQuantity - data.quantity);
      setUnassignedParts({ ...unassignedParts, [data.partId]: newQuantity });
    }
    const currentPlateId = plates[Number.parseInt(name)].id;
    const current = partsToPlates[currentPlateId] || [];
    if (
      partsToPlates[currentPlateId].filter((p) => p.partId === data.partId)
        .length > 0
    ) {
      partsToPlates[currentPlateId] = current.map((part) => {
        if (part.partId === data.partId) {
          return {
            partId: part.partId,
            quantity: part.quantity + data.quantity,
          };
        }
        return part;
      });
      setPartsToPlates({ ...partsToPlates });
      return;
    }
    partsToPlates[currentPlateId] = [
      ...current,
      { partId: data.partId, quantity: data.quantity },
    ];
    setPartsToPlates({ ...partsToPlates });
  }
  return (
    <div
      className={styles.cardPlate}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
      }}
      onDrop={(e) => {
        e.preventDefault();
        const raw = e.dataTransfer.getData("application/json");
        if (!raw) return;

        const data = JSON.parse(raw);
        onReceive(data);
      }}
    >
      <div id={styles.plateName}>Plate {Number.parseInt(name) + 1}</div>
      {partsToPlates[plates[Number.parseInt(name)].id]
        ? partsToPlates[plates[Number.parseInt(name)].id]
            .filter((p) => p.quantity > 0)
            .map((part, index) => (
              <PartsCard
                key={index}
                partId={part.partId}
                quantity={part.quantity}
                plateId={plates[Number.parseInt(name)].id}
              />
            ))
        : null}
      <button className={styles.arrangeButton}>
        <span>Arrange</span>
        <Image
          src="/mat_thickness/Arrange.svg"
          alt="Arrange"
          width={2000}
          height={2000}
          className={styles.arrangeIcon}
        />
      </button>
    </div>
  );
}

function PartsCard({
  partId,
  quantity,
  plateId,
}: {
  partId: number;
  quantity: number;
  plateId: number;
}) {
  const { parts } = useMaterialEvents();
  const [expanded, setExpanded] = useState(false);
  const part = parts.find((p) => p.id === partId) || { name: "Unknown Part" };
  const handleDragStart = (e: React.DragEvent<HTMLElement>, many: number) => {
    const payload = { partId, quantity: many, from: plateId };
    e.dataTransfer.setData("application/json", JSON.stringify(payload));
    e.dataTransfer.effectAllowed = "move";
    const el = e.currentTarget;
    const clone = el.cloneNode(true) as HTMLElement;
    clone.style.position = "fixed";
    clone.style.top = "-1000px";
    clone.style.left = "-1000px";
    clone.style.pointerEvents = "none";
    clone.style.width = `${el.getBoundingClientRect().width}px`;
    document.body.appendChild(clone);
    e.dataTransfer.setDragImage(clone, 20, 20);
    requestAnimationFrame(() => document.body.removeChild(clone));
  };
  return (
    <div className={styles.card}>
      <div
        className={styles.cardHeader}
        draggable
        onDragStart={(e) => handleDragStart(e, quantity)}
      >
        <span>{part?.name}</span>
        <span className={styles.cardHeaderQuantity}>{quantity}</span>
        <Image
          src={"/mat_thickness/Dropdown.svg"}
          alt={"Dropdown"}
          width={2000}
          height={2000}
          id={styles.dropdownicon}
          onClick={() => setExpanded(!expanded)}
        />
      </div>
      <AnimatePresence>
        {expanded ? (
          <motion.div
            className={styles.cardBody}
            style={{ overflow: "hidden" }}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            {Array.from({ length: quantity }).map((_, i) => (
              <div key={i} draggable onDragStart={(e) => handleDragStart(e, 1)}>
                <span>{part?.name}</span>
                <span className={styles.cardBodyQuantity}>1</span>
              </div>
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
