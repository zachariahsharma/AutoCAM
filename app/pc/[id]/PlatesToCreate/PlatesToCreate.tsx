import styles from "./platestocreate.module.css";
import { Plate } from "@/app/types";
import Image from "next/image";
import { motion } from "framer-motion";

export default function PlatesToCreate({
  plates,
  setPlates,
  categoryId,
}: {
  plates: Plate[];
  setPlates: (plates: Plate[]) => void;
  categoryId: number;
}) {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Plates To Create</h1>
      <div
        onClick={() =>
          setPlates([
            ...plates,
            {
              width: 24,
              length: 48,
              true_depth: 0.25,
              category_id: categoryId,
              status: "pending",
              id: Math.random() * 1000000,
              cam_download_url: "",
              screenshot_url: "",
            },
          ])
        }
        className={styles.addButton}
      >
        <Image
          src="/mat_thickness/add.svg"
          alt="Add Plate"
          width={2000}
          height={2000}
          className={styles.addIcon}
        />
      </div>
      <div className={styles.platesList}>
        {plates.length > 0 ? (
          plates.map((plate, index) => (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              key={index}
              className={styles.plateItem}
            >
              <div className={styles.plateHeader}>
                <hr />
                <span>Plate {index + 1}</span>
              </div>
              <div className={styles.plateWidth}>
                <span>Width</span>
                <input
                  type="number"
                  min="0"
                  defaultValue={24}
                  onChange={(e) => {
                    const newPlates = [...plates];
                    newPlates[index].width = Number(e.target.value);
                    setPlates(newPlates);
                  }}
                />
              </div>
              <div className={styles.plateHeight}>
                <span>Height</span>
                <input
                  type="number"
                  min="0"
                  defaultValue={48}
                  onChange={(e) => {
                    const newPlates = [...plates];
                    newPlates[index].length = Number(e.target.value);
                    setPlates(newPlates);
                  }}
                />
              </div>
              <div className={styles.plateTrueDepth}>
                <span>True Depth</span>
                <input
                  type="number"
                  min="0"
                  defaultValue={0.25}
                  onChange={(e) => {
                    const newPlates = [...plates];
                    newPlates[index].true_depth = Number(e.target.value);
                    setPlates(newPlates);
                  }}
                />
              </div>
              <div className={styles.deletePlate}>
                <Image
                  src="/mat_thickness/delete.svg"
                  alt="Delete Plate"
                  width={2000}
                  height={2000}
                  className={styles.deleteIcon}
                  onClick={() => {
                    const newPlates = plates.filter((_, i) => i !== index);
                    setPlates(newPlates);
                  }}
                />
              </div>
            </motion.div>
          ))
        ) : (
          <div className={styles.noPlatesMessage} />
        )}
      </div>
    </div>
  );
}
