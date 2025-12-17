import styles from "./header.module.css";
import { motion } from "framer-motion";
import { PrimaryButton, SecondaryButton } from "@/components/Buttons/Buttons";
import { redirect } from "next/navigation";
import Image from "next/image";

export function Header({
  delay = 1,
  duration = 0.5,
  setBoxtubeOpen,
}: {
  delay?: number;
  duration?: number;
  setBoxtubeOpen: (open: boolean) => void;
}) {
  return (
    <div id={styles.header}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: delay, duration: duration }}
      >
        <button id={styles.headerlogoButton} onClick={() => redirect("/")}>
          <Image
            src="/index/Document.svg"
            width={2000}
            height={2000}
            alt="logo"
            id={styles.headerlogo}
          />
        </button>
        <h1 id={styles.headertext}>
          <span className="secondarytextGradient">AutoCAM</span>
        </h1>
        <div>
          <SecondaryButton id={styles.finishedcambutton}>
            <span className="textGradient">Finished CAM</span>
          </SecondaryButton>
          <PrimaryButton
            id={styles.boxtubesbutton}
            onClick={() => setBoxtubeOpen(true)}
          >
            <span className="textGradient">Box Tubes</span>
          </PrimaryButton>
          <PrimaryButton id={styles.adjustquantitiesbutton}>
            <span className="textGradient">Adjust Quantities</span>
          </PrimaryButton>
          <div id={styles.usericoncontainer}>
            <Image
              src="/dashboard/UserIcon.svg"
              width={2000}
              height={2000}
              alt="user icon"
              id={styles.usericon}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
