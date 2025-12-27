import styles from "./plateassignment.module.css";
import { useMaterialEvents } from "../materialEvents";
import Image from "next/image";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function Unassigned() {
  const { selectedParts } = useMaterialEvents();
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Unassigned</h1>
      <div className={styles.cardsContainer}>
        {Object.entries(selectedParts)
          .filter(([partId, quantity]) => quantity > 0)
          .map(([partId, quantity]) => (
            <UnassignedCard key={partId} partId={Number(partId)} />
          ))}
      </div>
    </div>
  );
}

function UnassignedCard({ partId }: { partId: number }) {
  const { parts, selectedParts } = useMaterialEvents();
  const part = parts.find((p) => p.id === partId);
  const quantity = selectedParts[partId];
  const [expanded, setExpanded] = useState(false);
  const handleDragStart = (e: React.DragEvent<HTMLElement>, many: number) => {
    const payload = { partId, quantity: many };
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
              <div
                key={i}
                draggable
                onDragStart={(e) => handleDragStart(e, 1)}
              >
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
