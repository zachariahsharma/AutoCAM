"use client";

import { motion } from "framer-motion";
import styles from "./quantities.module.css";
import { Part, PartCategory } from "@/app/types";
import { ChangeEvent, useEffect, useState } from "react";
import { useDashboardEvents } from "@/app/dashboard/dashboardTeam";
import { ConditionalMarquee } from "@/app/dashboard/@tabs/boxtubes/ConditionalMarquee";

function QuantitiesCard({ part, delay }: { part: Part; delay: number }) {
  if (!part) return null;
  const [quantity, setQuantity] = useState<number>(part.quantity);
  useEffect(() => {
    fetch(`/api/parts/${part.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ quantity: quantity }),
    });
  }, [quantity]);
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: delay, duration: 0.3 }}
      className={styles.quantitycard}
    >
      <div id={styles.quantitycardheader}>
        <ConditionalMarquee text={part.name} />
      </div>
      <div id={styles.quantitycardinfo}>
        <p id={styles.quantitycardoriginal}>Original: {part.original_quantity}</p>
        <p id={styles.quantitycardcurrent}>
          Current: <span>{quantity}</span>
        </p>
      </div>
      <div id={styles.quantitycardactions}>
        <div className={styles.counter}>
          <button
            className={styles.counterButtonMinus}
            onClick={() => {
              setQuantity((qty) => (qty > 0 ? qty - 1 : 0));
            }}
          >
            -
          </button>
          <input
            className={styles.counterValue}
            type="number"
            value={quantity}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              setQuantity(Number(e.target.value));
            }}
          />
          <button
            className={styles.counterButtonPlus}
            onClick={() => {
              setQuantity((qty) => qty + 1);
            }}
          >
            +
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function Quantitys() {
  const { team } = useDashboardEvents();
  const [parts, setParts] = useState<Part[]>([]);
  useEffect(() => {
    let mounted = true;
    const loadQuantitys = async () => {
      if (team === null) return;
      const response = await fetch(`/api/teams/${team.id}/pc`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok || !mounted) return;

      const partCategories: PartCategory[] = await response.json();

      const partsByCategory = await Promise.all(
        partCategories.map(async (pt) => {
          const r = await fetch(`/api/pc/${pt.id}/parts`);
          if (!r.ok) return [];
          return (await r.json()) as Part[];
        })
      );

      setParts(partsByCategory.flat());
    };
    loadQuantitys();
    return () => {
      mounted = false;
    };
  }, [team]);
  return (
    <>
      {parts.length === 0 ? (
        <p id={styles.noboxes}>No Parts available.</p>
      ) : (
        <div className={styles.quantityslist}>
          {parts.map((part, index) => {
            console.log("Rendering part:", part, "parts list:", parts);
            return (
              <QuantitiesCard
                key={index}
                part={part}
                delay={index * 0.2 + 0.3}
              />
            );
          })}
        </div>
      )}
    </>
  );
}
