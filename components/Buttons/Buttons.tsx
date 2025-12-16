import styles from "./button.module.css";

export function SecondaryButton(props: any) {
  return (
    <button {...props} className={styles.secondaryButton}>
      {props.children}
    </button>
  );
}

export function PrimaryButton(props: any) {
  return (
    <button {...props} className={styles.primaryButton}>
      {props.children}
    </button>
  );
}
