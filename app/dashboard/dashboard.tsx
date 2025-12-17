"use client";
import Marquee from "react-fast-marquee";

import styles from "./dashboard.module.css";
import { motion } from "framer-motion";

import { Part, PartCategory, BoxTube } from "@/app/types";
import { redirect } from "next/navigation";
import { Header } from "./header/header";

function countUniquePartsByEpicArray(category: PartCategory) {
  const map = category.parts.reduce<Map<string, number>>((acc, part) => {
    acc.set(part.epic, (acc.get(part.epic) ?? 0) + 1);
    return acc;
  }, new Map());

  return Array.from(map, ([epic, count]) => ({ epic, count }));
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
            <PartCatCard
              key={index}
              partcat={partcat}
              delay={index * 0.2 + 0.3}
            />
          ))}
        </div>
      )}
    </>
  );
}

function BoxTubeCard({ boxtube }: { boxtube: BoxTube }) {
  return (
    <div className={styles.boxtubecard}>
      <div className={styles.boxtubecardheader}>
        <h1 className={styles.boxtubecardname}>
          <Marquee>{boxtube.name}</Marquee>
        </h1>
        <div className={styles.boxtubecardcamdropdown}>
          <div>CAM</div>
          <div className={styles.dropdownicon}>
            <img
              src="/dashboard/dropdown.svg"
              alt="dropdown"
              width={2000}
              height={2000}
            />
          </div>
        </div>
      </div>
      <div className={styles.boxtubecardinfo}>
        <div className={styles.boxtubecardquantity}>
          Quantity: {boxtube.quantity}
        </div>
        <div className={styles.boxtubecardepic}>Epic: {boxtube.epic}</div>
      </div>
    </div>
  );
}

function BoxTubes({ boxtubes }: { boxtubes: BoxTube[] }) {
  return (
    <div id={styles.boxtubesblur}>
      <div id={styles.boxtubes}>
        <h1 id={styles.boxtubeheader} className="secondarytextGradient">
          Box Tubes
        </h1>
        <hr id={styles.horizontalrule} />
        {boxtubes.length === 0 ? (
          <p id={styles.noboxtubes}>No Box Tubes available.</p>
        ) : (
          <div id={styles.boxtubestable}>
            {boxtubes.map((boxtube, index) => (
              <BoxTubeCard key={index} boxtube={boxtube} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage({
  partcats,
  boxtubes,
}: {
  partcats: PartCategory[];
  boxtubes: BoxTube[];
}) {
  return (
    <div id={styles.dashboardpage}>
      <Header delay={0} />
      <PartCatList partcats={partcats} />
      <BoxTubes boxtubes={boxtubes} />
    </div>
  );
}
