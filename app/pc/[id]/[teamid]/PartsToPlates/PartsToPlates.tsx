import styles from "./partstoplates.module.css";
import { useMaterialEvents } from "../materialEvents";
import Image from "next/image";
import { useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";

export function PartsToPlates({ categoryId }: { categoryId: number }) {
  const { plates } = useMaterialEvents();
  return (
    <div className={styles.container}>
      <div className={styles.cardsContainer}>
        {Object.entries(plates).map(([name]) => (
          <PartsToPlatesCard key={name} name={name} categoryId={categoryId} />
        ))}
      </div>
    </div>
  );
}

function PartsToPlatesCard({
  name,
  categoryId,
}: {
  name: string;
  categoryId: number;
}) {
  const {
    partsToPlates,
    setPartsToPlates,
    plates,
    setPlates,
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

    const plateIndex = Number.parseInt(name);
    const currentPlateId = plates[plateIndex]?.id;
    if (currentPlateId == null) return;
    if (data.from != null && data.from === currentPlateId) return;

    if (data.from == null) {
      setUnassignedParts((prev) => {
        const currentQuantity = prev[data.partId] || 0;
        const newQuantity = Math.max(0, currentQuantity - data.quantity);
        return { ...prev, [data.partId]: newQuantity };
      });
    }

    setPartsToPlates((prev) => {
      const next = { ...prev };

      if (data.from != null) {
        console.log("Removing from plate:", data.from);
        const oldPlate = next[data.from] ?? [];
        next[data.from] = oldPlate
          .map((part) =>
            part.partId === data.partId
              ? { ...part, quantity: part.quantity - data.quantity }
              : part
          )
          .filter((part) => part.quantity > 0);
      }

      const current = next[currentPlateId] ?? [];
      const exists = current.some((part) => part.partId === data.partId);
      next[currentPlateId] = exists
        ? current.map((part) =>
            part.partId === data.partId
              ? { ...part, quantity: part.quantity + data.quantity }
              : part
          )
        : [...current, { partId: data.partId, quantity: data.quantity }];

      return next;
    });
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
      <button
        className={styles.arrangeButton}
        onClick={async () => {
          if (categoryId === 0) return;
          try {
            const plateIndex = Number.parseInt(name);
            const localPlate = plates[plateIndex];
            const plateAssignments = partsToPlates[localPlate.id] || [];

            if (plateAssignments.filter((p) => p.quantity > 0).length === 0) {
              return;
            }
            console.log("body:", {
              width: localPlate.width,
              length: localPlate.length,
              true_depth: localPlate.true_depth,
            });
            const createPlateRes = await fetch(`/api/pc/${categoryId}/plates`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                width: localPlate.width,
                length: localPlate.length,
                true_depth: localPlate.true_depth,
                name: `Plate ${Number.parseInt(name) + 1}`,
              }),
            });

            if (!createPlateRes.ok) {
              console.error(
                "Failed to create plate:",
                await createPlateRes.text()
              );
              return;
            }

            const { id: realPlateId } = await createPlateRes.json();
            console.log("Created plate with ID:", realPlateId);

            for (const assignment of plateAssignments) {
              if (assignment.quantity <= 0) continue;

              const assignRes = await fetch(
                `/api/pc/${categoryId}/assignments`,
                {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    plate_id: realPlateId,
                    part_id: assignment.partId,
                    quantity: assignment.quantity,
                  }),
                }
              );

              if (!assignRes.ok) {
                console.error(
                  "Failed to assign part:",
                  assignment.partId,
                  await assignRes.text()
                );
              } else {
                console.log(
                  "Assigned part",
                  assignment.partId,
                  "qty",
                  assignment.quantity,
                  "to plate",
                  realPlateId
                );
              }
            }

            const oldPlateId = localPlate.id;
            const newPlates = plates.map((p, idx) =>
              idx === plateIndex ? { ...p, id: realPlateId } : p
            );
            setPlates(newPlates);

            const newPartsToPlates = { ...partsToPlates };
            newPartsToPlates[realPlateId] = newPartsToPlates[oldPlateId];
            delete newPartsToPlates[oldPlateId];
            setPartsToPlates(newPartsToPlates);

            console.log("Arrange complete for plate", realPlateId);
          } catch (err) {
            console.error("Error during arrange:", err);
          }
        }}
      >
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
