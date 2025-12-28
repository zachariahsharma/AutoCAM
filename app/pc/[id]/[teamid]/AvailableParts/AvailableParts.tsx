"use client";
import styles from "./availableparts.module.css";
import { Part } from "@/app/types";
import { useEffect, useState, ChangeEvent } from "react";
import { useMaterialEvents } from "../materialEvents";

export default function AvailableParts({
  epicsMap,
}: {
  epicsMap: { [key: string]: Part[] };
}) {
  const {
    selectedParts,
    setSelectedParts,
    setUnassignedParts,
    unassignedParts,
  } = useMaterialEvents();
  useEffect(() => {
    Object.entries(epicsMap).forEach(([epic, parts]) =>
      parts.forEach((part) => {
        setUnassignedParts((obj) => ({ ...obj, [part.id]: 0 }));
        setSelectedParts((obj) => ({ ...obj, [part.id]: 0 }));
      })
    );
  }, []);
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 id={styles.title}>Available Parts</h1>
        <button
          onClick={() => {
            setUnassignedParts((obj) => {
              const newObj = { ...obj };
              Object.keys(newObj).forEach((key) => {
                const partId = Number(key);
                let recommendedQuantity = 0;
                Object.values(epicsMap).forEach((parts) => {
                  parts.forEach((part) => {
                    if (part.id === partId) {
                      recommendedQuantity =
                        part.quantity -
                        selectedParts[partId] +
                        unassignedParts[partId];
                    }
                  });
                });
                newObj[partId] = recommendedQuantity;
              });
              return newObj;
            });
            setSelectedParts((obj) => {
              const newObj = { ...obj };
              Object.keys(newObj).forEach((key) => {
                const partId = Number(key);
                let recommendedQuantity = 0;
                Object.values(epicsMap).forEach((parts) => {
                  parts.forEach((part) => {
                    if (part.id === partId) {
                      recommendedQuantity = part.quantity;
                    }
                  });
                });
                newObj[partId] = recommendedQuantity;
              });
              return newObj;
            });
          }}
        >
          Select All
        </button>
      </div>
      {Object.entries(epicsMap).map(([epic, parts]) => (
        <div key={epic}>
          <h2 className={styles.epicTitle}>{epic}</h2>
          <div>
            {parts.map((part) => (
              <div key={part.id} className={styles.partRow}>
                <div className={styles.partDetails}>
                  <span className={styles.partNumber}>{part.name}</span>
                  <span className={styles.recommendedQuantity}>
                    Recommended Quantity: {part.quantity}
                  </span>
                </div>
                <div className={styles.counter}>
                  <button
                    className={styles.counterButtonMinus}
                    onClick={() => {
                      setSelectedParts((obj) => ({
                        ...obj,
                        [part.id]: Math.max((obj[part.id] || 0) - 1, 0),
                      }));
                      setUnassignedParts((obj) => ({
                        ...obj,
                        [part.id]: Math.max((obj[part.id] || 0) - 1, 0),
                      }));
                    }}
                  >
                    -
                  </button>
                  <input
                    className={styles.counterValue}
                    type="number"
                    value={selectedParts[part.id] || 0}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                      setSelectedParts((obj) => ({
                        ...obj,
                        [part.id]: Number(e.target.value),
                      }));
                      setUnassignedParts((obj) => ({
                        ...obj,
                        [part.id]: Math.max((obj[part.id] || 0) - 1, 0),
                      }));
                    }}
                  />
                  <button
                    className={styles.counterButtonPlus}
                    onClick={() => {
                      setSelectedParts((obj) => ({
                        ...obj,
                        [part.id]: (obj[part.id] || 0) + 1,
                      }));
                      setUnassignedParts((obj) => ({
                        ...obj,
                        [part.id]: Math.max((obj[part.id] || 0) + 1, 0),
                      }));
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
