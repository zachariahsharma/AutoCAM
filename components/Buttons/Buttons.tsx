import styles from "./button.module.css";

export function SecondaryButton({
  children,
  id,
  onclick,
}: {
  children?: React.ReactNode;
  id?: string;
  onclick?: () => void;
}) {
  return (
    <button onClick={onclick} id={id} className={styles.secondaryButton}>
      {children}
    </button>
  );
}

export function PrimaryButton({
  children,
  id,
  onclick,
}: {
  children?: React.ReactNode;
  id?: string;
  onclick?: () => void;
}) {
  return (
    <button
      onClick={onclick}
      id={id}
      className={styles.primaryButton}
    >
      {children}
    </button>
  );
}
