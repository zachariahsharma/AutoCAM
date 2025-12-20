import styles from "./header.module.css";
import { motion, useAnimate } from "framer-motion";
import { PrimaryButton, SecondaryButton } from "@/components/Buttons/Buttons";
import { redirect, useRouter } from "next/navigation";
import Image from "next/image";
import { AccountDropdown } from "../dashboard";
import { useEffect, useState } from "react";

export function Header({
  delay = 1,
  duration = 0.5,
  setBoxtubeOpen,
  setFinishedcamOpen,
  finishedcamOpen,
}: {
  delay?: number;
  duration?: number;
  setBoxtubeOpen: (open: boolean) => void;
  setFinishedcamOpen: (open: boolean) => void;
  finishedcamOpen: boolean;
}) {
  const router = useRouter();
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const [scope, animate] = useAnimate();
  useEffect(() => {
    if (accountDropdownOpen) {
      animate(
        scope.current,
        { opacity: 1, pointerEvents: "auto", y: 0 },
        { duration: 0.2 }
      );
    } else {
      animate(
        scope.current,
        { opacity: 0, pointerEvents: "none", y: -20 },
        { duration: 0.2 }
      );
    }
  }, [accountDropdownOpen]);
  return (
    <div id={styles.header}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: delay, duration: duration }}
      >
        <button id={styles.headerlogoButton} onClick={() => router.push("/")}>
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
          <SecondaryButton
            id={styles.finishedcambutton}
            onClick={() => setFinishedcamOpen(!finishedcamOpen)}
          >
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
          <div
            id={styles.usericoncontainer}
            onClick={() => setAccountDropdownOpen(!accountDropdownOpen)}
          >
            <Image
              src="/dashboard/UserIcon.svg"
              width={2000}
              height={2000}
              alt="user icon"
              onClick={() => setAccountDropdownOpen(!accountDropdownOpen)}
              id={styles.usericon}
            />
          </div>

          <AccountDropdown scope={scope} />
        </div>
      </motion.div>
    </div>
  );
}
