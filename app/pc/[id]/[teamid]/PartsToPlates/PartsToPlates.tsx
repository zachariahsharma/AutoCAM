import styles from "./partstoplates.module.css";
import { useMaterialEvents } from "../materialEvents";
import { PartsToPlatesCard } from "./components/PartsToPlatesCard";

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
