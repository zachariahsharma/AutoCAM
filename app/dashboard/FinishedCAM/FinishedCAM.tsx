import styles from "./finishedcam.module.css";
import { Plate } from "@/app/types";
import { motion } from "framer-motion";

function FinishedCAMCard({ finishedcam }: { finishedcam: Plate }) {
  return (
    <div className={styles.finishedcamcard}>
      <span className={styles.label}>{finishedcam.category_id}</span>
    </div>
  );
}

export function FinishedCAM({
  finishedcam,
  finishedcamOpen,
  setFinishedcamOpen,
}: {
  finishedcam: Plate[];
  finishedcamOpen: boolean;
  setFinishedcamOpen: (open: boolean) => void;
}) {
  return (
    <motion.div
      id={styles.finishedcamblur}
      initial={{ opacity: 0 }}
      animate={{ opacity: finishedcamOpen ? 1 : 0 }}
      style={{ pointerEvents: finishedcamOpen ? "auto" : "none" }}
      onClick={() => setFinishedcamOpen(false)}
    >
      <motion.div
        id={styles.finishedcam}
        initial={{ x: 500 }}
        animate={{ x: finishedcamOpen ? 0 : 500 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h1 id={styles.finishedcamheader} className="secondarytextGradient">
          Finished CAM
        </h1>
        <hr className={styles.horizontalrule} />
        {finishedcam.length === 0 ? (
          <p id={styles.nofinishedcam}>No Finished CAM available.</p>
        ) : (
          <div id={styles.finishedcamstable}>
            {finishedcam.map((finishedcam, index) => (
              <FinishedCAMCard key={index} finishedcam={finishedcam} />
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
