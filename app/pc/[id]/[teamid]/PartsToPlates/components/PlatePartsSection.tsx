import Image from "next/image";
import styles from "../partstoplates.module.css";
import { PartsCard } from "./PartsCard";

type PlatePartsSectionProps = {
  plateId: number | null | undefined;
  plateIndex: number;
  parts: { partId: number; quantity: number }[];
  onDeletePlate: (plateId: number) => void;
  onArrange: () => void;
  onReceive: (data: { partId: number; quantity: number; from?: number }) => void;
};

export function PlatePartsSection({
  plateId,
  plateIndex,
  parts,
  onDeletePlate,
  onArrange,
  onReceive,
}: PlatePartsSectionProps) {
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
      <div id={styles.plateName}>Plate {plateIndex + 1}</div>
      {plateId != null ? (
        <button
          type="button"
          className={styles.plateDeleteButton}
          onClick={() => onDeletePlate(plateId)}
          aria-label="Delete plate"
        >
          <Image
            src="/dashboard/delete.svg"
            alt="Delete plate"
            width={14}
            height={14}
            className={styles.plateDeleteIcon}
          />
        </button>
      ) : null}
      {plateId != null
        ? parts
            .filter((p) => p.quantity > 0)
            .map((part, index) => (
              <PartsCard
                key={`${part.partId}-${index}`}
                partId={part.partId}
                quantity={part.quantity}
                plateId={plateId}
              />
            ))
        : null}
      <button className={styles.arrangeButton} onClick={onArrange}>
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
