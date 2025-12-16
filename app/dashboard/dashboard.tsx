"use client";

import styles from "./dashboard.module.css";
import { motion } from "framer-motion";
import { PrimaryButton, SecondaryButton } from "@/components/Buttons/Buttons";
import { Part, PartCategory } from "@/app/dashboard/page";
import { redirect } from "next/navigation";

export function Header({
  delay = 1,
  duration = 0.5,
}: {
  delay?: number;
  duration?: number;
}) {
  return (
    <div id={styles.header}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: delay, duration: duration }}
      >
        <button
          id={styles.headerlogoButton}
          onClick={() => redirect("/")}
        >
          <img
            src="/index/Document.svg"
            width={2000}
            height={2000}
            alt="logo"
            id={styles.headerlogo}
          />
        </button>
        <h1 id={styles.headertext}>
          <span className={styles.secondarytextGradient}>AutoCAM</span>
        </h1>
        <div>
          <SecondaryButton id={styles.finishedcambutton}>
            <span className={styles.textGradient}>Finished CAM</span>
          </SecondaryButton>
          <PrimaryButton id={styles.boxtubesbutton}>
            <span className={styles.textGradient}>Box Tubes</span>
          </PrimaryButton>
          <PrimaryButton id={styles.adjustquantitiesbutton}>
            <span className={styles.textGradient}>Adjust Quantities</span>
          </PrimaryButton>
          <div id={styles.usericoncontainer}>
            <img
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

function PartCatCard({ partcat }: { partcat: PartCategory }) {
  return (
    <div className={styles.platecard}>
      <div>
        <span>{partcat.material}</span> <span>{partcat.thickness}</span>
      </div>
      <div>
        <p>
          Quantity:
          {partcat.parts.reduce((sum, { quantity }) => sum + quantity, 0)}
        </p>
        <p>Unique: {partcat.parts.length}</p>
      </div>
    </div>
  );
}

function PartCatList({ partcats }: { partcats: PartCategory[] }) {
  return (
    <div className={styles.plateslist}>
      {partcats.length === 0 ? (
        <p id={styles.nopartcats}>No Categories available.</p>
      ) : (
        partcats.map((partcat, index) => (
          <PartCatCard key={index} partcat={partcat} />
        ))
      )}
    </div>
  );
}

export default function DashboardPage({
  partcats,
}: {
  partcats: PartCategory[];
}) {
  return (
    <div id={styles.dashboardpage}>
      <Header delay={0}/>
      <PartCatList partcats={partcats} />
    </div>
  );
}
