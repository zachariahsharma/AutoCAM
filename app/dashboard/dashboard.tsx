"use client";

import styles from "./dashboard.module.css";
import { motion } from "framer-motion";
import { PrimaryButton, SecondaryButton } from "@/components/Buttons/Buttons";
import { Part, PartCategory } from "@/app/dashboard/page";
import { redirect } from "next/navigation";
import { button } from "framer-motion/client";

function countUniquePartsByEpicArray(category: PartCategory) {
  const map = category.parts.reduce<Map<string, number>>((acc, part) => {
    acc.set(part.epic, (acc.get(part.epic) ?? 0) + 1);
    return acc;
  }, new Map());

  return Array.from(map, ([epic, count]) => ({ epic, count }));
}

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
        <button id={styles.headerlogoButton} onClick={() => redirect("/")}>
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

function PartCatCard({
  partcat,
  delay,
}: {
  partcat: PartCategory;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: delay, duration: 0.3 }}
      className={styles.platecard}
      onClick={() =>
        redirect(`/mt/${partcat.material.toLowerCase()}/${partcat.thickness}`)
      }
    >
      <div id={styles.platecardheader}>
        <span>{partcat.material}</span>{" "}
        <span id={styles.partcardheaderthickness}>{partcat.thickness}</span>
      </div>
      <div id={styles.platecardinfo}>
        <p id={styles.platecardquantity}>
          Quantity:
          {partcat.parts.reduce((sum, { quantity }) => sum + quantity, 0)}
        </p>
        <p id={styles.platecardunique}>Unique: {partcat.parts.length}</p>
      </div>
      <hr id={styles.horizontalrule} />
      <div>
        {partcat.parts.length > 0 ? (
          <table id={styles.platecardpartstable}>
            <tbody>
              {countUniquePartsByEpicArray(partcat).map((part, index) => (
                <tr key={index}>
                  <td>{part.epic}</td>
                  <td>{part.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p id={styles.noparts}>No parts in this category.</p>
        )}
      </div>
      <div id={styles.openiconcontainer}>
        <img
          src="/dashboard/Open.svg"
          width={2000}
          height={2000}
          alt="user icon"
          id={styles.openicon}
        />
      </div>
    </motion.div>
  );
}

function PartCatList({ partcats }: { partcats: PartCategory[] }) {
  return (
    <>
      {partcats.length === 0 ? (
        <p id={styles.nopartcats}>No Categories available.</p>
      ) : (
        <div className={styles.plateslist}>
          {partcats.map((partcat, index) => (
            <PartCatCard key={index} partcat={partcat} delay={index * 0.2+.3} />
          ))}
        </div>
      )}
    </>
  );
}

export default function DashboardPage({
  partcats,
}: {
  partcats: PartCategory[];
}) {
  return (
    <div id={styles.dashboardpage}>
      <Header delay={0} />
      <PartCatList partcats={partcats} />
    </div>
  );
}
