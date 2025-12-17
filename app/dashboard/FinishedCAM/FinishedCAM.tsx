import styles from "./boxtubes.module.css";
import { BoxTube } from "@/app/types";
import { motion } from "framer-motion";

function FinishedCAMCard({ finishedcam }: { finishedcam: BoxTube }) {
  return (
    <div className={styles.finishedcamcard}>
      
    </div>
  );
}

export function FinishedCAM({
  finishedcam,
  finishedcamOpen,
  setFinishedcamOpen,
}: {
  finishedcam: BoxTube[];
  finishedcamOpen: boolean;
  setFinishedcamOpen: (open: boolean) => void;
}) {
  return (
    <motion.div
      id={styles.boxtubesblur}
      initial={{ opacity: 0 }}
      animate={{ opacity: finishedcamOpen ? 1 : 0 }}
      style={{ pointerEvents: finishedcamOpen ? "auto" : "none" }}
      onClick={() => setFinishedcamOpen(false)}
    >
      <motion.div
        id={styles.boxtubes}
        initial={{ x: 500 }}
        animate={{ x: finishedcamOpen ? 0 : 500 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h1 id={styles.boxtubeheader} className="secondarytextGradient">
          Box Tubes
        </h1>
        <hr className={styles.horizontalrule} />
        {finishedcam.length === 0 ? (
          <p id={styles.noboxtubes}>No Box Tubes available.</p>
        ) : (
          <div id={styles.boxtubestable}>
            {finishedcam.map((finishedcam, index) => (
              <FinishedCAMCard key={index} finishedcam={finishedcam} />
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
