import styles from "./partstoplates.module.css";
import { useMaterialEvents } from "../materialEvents";
import Image from "next/image";

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
  function onReceive(data: { partId: number; quantity: number }) {
    console.log(data);
  }
  return (
    <div
      className={styles.card}
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
      Plate {Number.parseInt(name) + 1}
    </div>
  );
}
