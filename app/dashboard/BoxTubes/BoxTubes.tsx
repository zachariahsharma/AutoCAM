import styles from "./boxtubes.module.css";
import { BoxTube } from "@/app/types";
import Marquee from "react-fast-marquee";
import Image from "next/image";

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
            <Image
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

export function BoxTubes({ boxtubes }: { boxtubes: BoxTube[] }) {
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
