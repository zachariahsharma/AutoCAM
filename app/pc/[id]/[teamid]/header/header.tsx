import styles from "./header.module.css";
import { motion } from "framer-motion";
import { PrimaryButton, SecondaryButton } from "@/components/Buttons/Buttons";
import { redirect, useRouter } from "next/navigation";
import Image from "next/image";

export function Header({
  delay = 0,
  duration = 0.5,
  material,
  thickness,
}: {
  delay?: number;
  duration?: number;
  material: string | undefined;
  thickness: number | undefined;
}) {
  const router = useRouter();
  return (
    <div id={styles.header}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: delay, duration: duration }}
      >
        <button
          id={styles.headerlogoButton}
          onClick={() => router.push("/dashboard")}
        >
          <Image
            src="/index/Document.svg"
            width={2000}
            height={2000}
            alt="logo"
            id={styles.headerlogo}
          />
        </button>
        <h1 id={styles.headertext}>
          <span className="secondarytextGradient">
            {material} {"  "}
            {thickness}
          </span>
        </h1>
        <div>
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
