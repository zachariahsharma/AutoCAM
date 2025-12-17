import styles from "./boxtubes.module.css";
import { BoxTube } from "@/app/types";
import Marquee from "react-fast-marquee";
import Image from "next/image";
import { useState } from "react";
import { motion } from "framer-motion";

function BoxTubeCard({ boxtube }: { boxtube: BoxTube }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  return (
    <div className={styles.boxtubecard}>
      <div className={styles.boxtubecardheader}>
        <h1 className={styles.boxtubecardname}>
          <Marquee>{boxtube.name}</Marquee>
        </h1>
        <div>
          {boxtube.cammed === true && (
            <div
              className={
                styles.boxtubecardcamdropdown +
                " " +
                (dropdownOpen ? styles.active : "")
              }
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <div>Finished</div>
              <div className={styles.dropdownicon}>
                <Image
                  src="/dashboard/dropdown.svg"
                  alt="dropdown"
                  width={2000}
                  height={2000}
                />
              </div>
            </div>
          )}
          {!boxtube.cammed && (
            <div className={styles.boxtubecardcamdisabled}>
              <span className="textGradient">CAM</span>
            </div>
          )}
          {boxtube.cammed === "in progress" && (
            <div className={styles.boxtubecardcamdisabled}>
              <span className={styles.ellipsis1}>.</span>
              <span className={styles.ellipsis2}>.</span>
              <span className={styles.ellipsis3}>.</span>
            </div>
          )}
          <div
            className={styles.boxtubecardcamdropdowncontent}
            style={{ opacity: dropdownOpen ? 1 : 0 }}
          >
            <div className={styles.firstdropdownitem}>
              <span>Download</span>
              <Image
                src="/dashboard/download.svg"
                alt="dropdown"
                width={2000}
                height={2000}
              />
            </div>
            <hr className={styles.horizontalruledropdown} />
            <div className={styles.seconddropdownitem}>
              <span>Delete</span>
              <Image
                src="/dashboard/delete.svg"
                alt="dropdown"
                width={2000}
                height={2000}
              />
            </div>
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

export function BoxTubes({
  boxtubes,
  boxtubeOpen,
  setBoxtubeOpen,
}: {
  boxtubes: BoxTube[];
  boxtubeOpen: boolean;
  setBoxtubeOpen: (open: boolean) => void;
}) {
  return (
    <motion.div
      id={styles.boxtubesblur}
      initial={{ opacity: 0 }}
      animate={{ opacity: boxtubeOpen ? 1 : 0 }}
      style={{ pointerEvents: boxtubeOpen ? "auto" : "none" }}
      onClick={() => setBoxtubeOpen(false)}
    >
      <motion.div
        id={styles.boxtubes}
        initial={{ x: 500 }}
        animate={{ x: boxtubeOpen ? 0 : 500 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h1 id={styles.boxtubeheader} className="secondarytextGradient">
          Box Tubes
        </h1>
        <hr className={styles.horizontalrule} />
        {boxtubes.length === 0 ? (
          <p id={styles.noboxtubes}>No Box Tubes available.</p>
        ) : (
          <div id={styles.boxtubestable}>
            {boxtubes.map((boxtube, index) => (
              <BoxTubeCard key={index} boxtube={boxtube} />
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
