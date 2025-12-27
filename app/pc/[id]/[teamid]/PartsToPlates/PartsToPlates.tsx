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
  return <div className={styles.card}>{name}</div>;
}
