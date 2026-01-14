import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import styles from "../../partstoplates.module.css";
import { classNames } from "../helpers";

type CamModalProps = {
  open: boolean;
  loading: boolean;
  error: string | null;
  machines: Array<{ id: number; name: string }>;
  selectedMachineId: number | null;
  camFileUrl: string | null;
  camFileType: "image" | "pdf" | "other" | null;
  onClose: () => void;
  onSelectMachine: (machineId: number) => void;
  onSubmit: () => void;
  getMatchingToolIds: (machineId: number | null) => number[];
};

export function CamModal({
  open,
  loading,
  error,
  machines,
  selectedMachineId,
  camFileUrl,
  camFileType,
  onClose,
  onSelectMachine,
  onSubmit,
  getMatchingToolIds,
}: CamModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={styles.camModalOverlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className={styles.camModal}
            initial={{ opacity: 0, scale: 0.98, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 12 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.camModalHeader}>
              <span>Start CAM</span>
              <button
                type="button"
                className={styles.camModalClose}
                onClick={onClose}
              >
                <Image
                  src="/settings/teams/X.svg"
                  alt="Close"
                  width={16}
                  height={16}
                />
              </button>
            </div>
            <div className={styles.camModalBody}>
              <div className={styles.camModalScreenshot}>
                {loading ? (
                  <div className={styles.camModalPlaceholder}>Loading…</div>
                ) : camFileUrl ? (
                  camFileType === "image" ? (
                    <div style={{ display: "grid", gap: 8 }}>
                      <img
                        src={camFileUrl}
                        alt="Arrangement screenshot"
                        className={styles.camModalImage}
                      />
                    </div>
                  ) : (
                    <div className={styles.camModalPlaceholder}>
                      <div>No preview available.</div>
                      <div
                        style={{
                          display: "flex",
                          gap: 10,
                          justifyContent: "center",
                          marginTop: 8,
                        }}
                      >
                        <a href={camFileUrl} target="_blank" rel="noreferrer">
                          Open
                        </a>
                        <a href={camFileUrl} download>
                          Download
                        </a>
                      </div>
                    </div>
                  )
                ) : (
                  <div className={styles.camModalPlaceholder}>
                    No screenshot available.
                  </div>
                )}
              </div>
              <div className={styles.camModalControls}>
                <label className={styles.camModalLabel}>Machine</label>
                {machines.length === 0 ? (
                  <div className={styles.camModalPlaceholder}>
                    {loading
                      ? "Loading machines…"
                      : "No machines configured for this team."}
                  </div>
                ) : (
                  <div
                    className={styles.machineGrid}
                    role="radiogroup"
                    aria-label="Machine selection"
                  >
                    {machines.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        role="radio"
                        aria-checked={selectedMachineId === m.id}
                        className={classNames(
                          styles.machineOption,
                          selectedMachineId === m.id &&
                            styles.machineOptionSelected
                        )}
                        onClick={() => onSelectMachine(m.id)}
                        disabled={loading}
                      >
                        {m.name}
                      </button>
                    ))}
                  </div>
                )}

                {error ? (
                  <div className={styles.camModalError}>{error}</div>
                ) : selectedMachineId != null &&
                  getMatchingToolIds(selectedMachineId).length === 0 ? (
                  <div className={styles.camModalError}>
                    No tool is configured for this machine and material. Add one
                    in Settings → Fusion Inputs.
                  </div>
                ) : null}
              </div>
            </div>
            <div className={styles.camModalFooter}>
              <button
                type="button"
                className={styles.camModalCancel}
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.camModalConfirm}
                onClick={onSubmit}
                disabled={
                  loading ||
                  selectedMachineId == null ||
                  getMatchingToolIds(selectedMachineId).length === 0
                }
              >
                CAM
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
