import styles from "./partstoplates.module.css";
import { useMaterialEvents } from "../materialEvents";
import Image from "next/image";
import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useParams } from "next/navigation";
import type { PlatesJob } from "@/app/types";

type PlateJobRun = {
  arrange: PlatesJob;
  cam?: PlatesJob;
};

function classNames(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function pickToolIdForMachine(
  machineId: number | null,
  tools: Array<{ id: number; machine_ids?: number[] }>
): number | null {
  if (machineId == null) return null;

  const exact = tools.find(
    (t) =>
      Array.isArray(t.machine_ids) &&
      t.machine_ids.length > 0 &&
      t.machine_ids.includes(machineId)
  );
  if (exact) return exact.id;

  const generic = tools.find(
    (t) => !Array.isArray(t.machine_ids) || t.machine_ids.length === 0
  );
  if (generic) return generic.id;

  return tools[0]?.id ?? null;
}

function buildPlateJobRuns(jobs: PlatesJob[]): PlateJobRun[] {
  const sorted = [...jobs].sort((a, b) => a.id - b.id);
  const runs: PlateJobRun[] = [];
  for (const job of sorted) {
    if (job.kind === "arrange") {
      runs.push({ arrange: job });
      continue;
    }
    if (job.kind === "cam") {
      const last = runs[runs.length - 1];
      if (last) last.cam = job;
    }
  }
  return runs;
}

function MotionPath() {
  return (
    <motion.svg
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 0,
      }}
    >
      <motion.rect
        x=".5"
        y=".5"
        width="calc(100% - 1px)"
        height="calc(100% - 1px)"
        rx="10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        strokeDasharray="10 8"
        animate={{ strokeDashoffset: [0, -36] }}
        transition={{
          duration: 1.2,
          ease: "linear",
          repeat: Infinity,
        }}
      />
    </motion.svg>
  );
}

export function PartsToPlates({ categoryId }: { categoryId: number }) {
  const { plates } = useMaterialEvents();
  return (
    <div className={styles.container}>
      <div className={styles.cardsContainer}>
        {Object.entries(plates).map(([name]) => (
          <PartsToPlatesCard key={name} name={name} categoryId={categoryId} />
        ))}
      </div>
    </div>
  );
}

function PartsToPlatesCard({
  name,
  categoryId,
}: {
  name: string;
  categoryId: number;
}) {
  const {
    partsToPlates,
    setPartsToPlates,
    plates,
    setPlates,
    setUnassignedParts,
  } = useMaterialEvents();
  const [jobs, setJobs] = useState<PlatesJob[]>([]);
  const [jobsDeleteBusy, setJobsDeleteBusy] = useState<Record<number, boolean>>(
    {}
  );
  const [jobsDeleteError, setJobsDeleteError] = useState<string | null>(null);
  const { teamid } = useParams();
  const teamDbId = Number(Array.isArray(teamid) ? teamid[0] : teamid);
  const plateIndex = Number.parseInt(name);
  const currentPlateId = plates[plateIndex]?.id;

  const [camModalOpen, setCamModalOpen] = useState(false);
  const [camModalArrangeJobId, setCamModalArrangeJobId] = useState<
    number | null
  >(null);
  const [camModalPlateId, setCamModalPlateId] = useState<number | null>(null);
  const [camModalLoading, setCamModalLoading] = useState(false);
  const [camModalError, setCamModalError] = useState<string | null>(null);
  const [camScreenshotUrl, setCamScreenshotUrl] = useState<string | null>(null);
  const [machines, setMachines] = useState<Array<{ id: number; name: string }>>(
    []
  );
  const [tools, setTools] = useState<Array<{ id: number; machine_ids?: number[] }>>(
    []
  );
  const [selectedMachineId, setSelectedMachineId] = useState<number | null>(
    null
  );

  function openCamModal(plateId: number, arrangeJobId: number) {
    setCamModalPlateId(plateId);
    setCamModalArrangeJobId(arrangeJobId);
    setCamModalOpen(true);
  }

  function closeCamModal() {
    setCamModalOpen(false);
    setCamModalPlateId(null);
    setCamModalArrangeJobId(null);
    setCamModalError(null);
    setCamModalLoading(false);
    setCamScreenshotUrl(null);
    setMachines([]);
    setTools([]);
    setSelectedMachineId(null);
  }

  useEffect(() => {
    let mounted = true;
    async function assignedParts() {
      if (!plates || !setPartsToPlates) return;
      const plateIndex = Number.parseInt(name);
      const currentPlateId = plates[plateIndex]?.id;
      if (currentPlateId == null) return;

      const res = await fetch(`/api/pc/${categoryId}/assignments`);
      if (!res.ok) {
        console.error("Failed to fetch assigned parts:", await res.text());
        return;
      }
      const assignments: Array<{
        part_id: number;
        plate_id: number;
        quantity: number;
      }> = await res.json();
      console.log(
        "Assignments for plate",
        currentPlateId,
        ":",
        assignments,
        "for category",
        categoryId
      );
      const newAssignments = assignments
        .map((a) => {
          if (a.plate_id !== currentPlateId) return null;
          return {
            partId: a.part_id,
            quantity: a.quantity,
          };
        })
        .filter((a): a is { partId: number; quantity: number } => a !== null);
      if (!mounted) return;
      setPartsToPlates((prev) => ({
        ...prev,
        [currentPlateId]: newAssignments,
      }));
      const jobRes = await fetch(`/api/plates/${currentPlateId}/jobs`);
      if (!jobRes.ok) {
        console.error("Failed to fetch plate jobs:", await jobRes.text());
        return;
      }
      const jobsData: PlatesJob[] = await jobRes.json();
      console.log("Jobs data for plate", currentPlateId, ":", jobsData);
      setJobs(jobsData);
    }
    assignedParts();
    return () => {
      mounted = false;
    };
  }, [categoryId, name, plates, setPartsToPlates]);

  const shouldPollJobs = jobs.some((job) => job.status !== "completed");
  useEffect(() => {
    if (currentPlateId == null) return;
    if (!shouldPollJobs) return;

    let mounted = true;
    const interval = setInterval(async () => {
      try {
        const jobRes = await fetch(`/api/plates/${currentPlateId}/jobs`);
        if (!jobRes.ok) return;
        const jobsData: PlatesJob[] = await jobRes.json();
        if (!mounted) return;
        setJobs(jobsData);
      } catch (err) {
        console.error("Error polling plate jobs:", err);
      }
    }, 2500);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [currentPlateId, shouldPollJobs]);

  useEffect(() => {
    if (camModalOpen === false || camModalArrangeJobId == null) return;
    if (!Number.isFinite(teamDbId)) {
      setCamModalError("Unable to determine team.");
      return;
    }
    let mounted = true;
    setCamModalLoading(true);
    setCamModalError(null);
    setCamScreenshotUrl(null);

    async function load() {
      try {
        const [jobRes, machinesRes, toolsRes] = await Promise.all([
          fetch(`/api/jobs/${camModalArrangeJobId}`),
          fetch(`/api/teams/${teamDbId}/machines`),
          fetch(`/api/teams/${teamDbId}/tools`),
        ]);

        if (!mounted) return;

        if (!jobRes.ok) {
          setCamModalError(await jobRes.text());
          return;
        }
        const jobData: { file?: string | null } = await jobRes.json();
        setCamScreenshotUrl(jobData.file ?? null);

        if (machinesRes.ok) {
          const machinesData = (await machinesRes.json()) as Array<{
            id: number;
            name: string;
          }>;
          console.log("Loaded machines:", machinesData);
          setMachines(machinesData);
          setSelectedMachineId((prev) => prev ?? machinesData[0]?.id ?? null);
        }

        if (toolsRes.ok) {
          const toolsData = (await toolsRes.json()) as Array<{
            id: number;
            machine_ids?: number[];
          }>;
          setTools(toolsData);
        }
      } catch (err) {
        console.error("Error loading CAM modal data:", err);
        if (!mounted) return;
        setCamModalError("Failed to load CAM modal data.");
      } finally {
        if (!mounted) return;
        setCamModalLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [camModalOpen, camModalArrangeJobId, teamDbId]);

  async function refreshJobs(plateId: number) {
    const jobRes = await fetch(`/api/plates/${plateId}/jobs`);
    if (!jobRes.ok) throw new Error(await jobRes.text());
    const jobsData: PlatesJob[] = await jobRes.json();
    setJobs(jobsData);
  }

  async function deleteJobs(jobIds: number[]) {
    for (const jobId of jobIds) {
      const res = await fetch(`/api/jobs/${jobId}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
    }
  }

  async function onDeleteRun(run: PlateJobRun) {
    if (currentPlateId == null) return;
    const jobIds = [run.arrange.id, run.cam?.id].filter(
      (id): id is number => typeof id === "number"
    );
    if (jobIds.length === 0) return;

    const ok = window.confirm(
      `Delete ${jobIds.length === 1 ? "this job" : "these jobs"}?`
    );
    if (!ok) return;

    setJobsDeleteError(null);
    setJobsDeleteBusy((prev) => {
      const next = { ...prev };
      for (const id of jobIds) next[id] = true;
      return next;
    });

    try {
      await deleteJobs(jobIds);
      if (
        camModalArrangeJobId != null &&
        jobIds.includes(camModalArrangeJobId)
      ) {
        closeCamModal();
      }
      await refreshJobs(currentPlateId);
    } catch (err) {
      console.error("Failed to delete job(s):", err);
      setJobsDeleteError("Failed to delete job(s).");
    } finally {
      setJobsDeleteBusy((prev) => {
        const next = { ...prev };
        for (const id of jobIds) delete next[id];
        return next;
      });
    }
  }

  async function submitCam() {
    if (camModalPlateId == null) return;
    if (selectedMachineId == null) {
      setCamModalError("Select a machine to continue.");
      return;
    }
    const toolId = pickToolIdForMachine(selectedMachineId, tools);
    if (toolId == null) {
      setCamModalError(
        "No tool is configured for this machine. Add one in Settings → Fusion Inputs."
      );
      return;
    }
    setCamModalLoading(true);
    setCamModalError(null);
    try {
      const response = await fetch(`/api/plates/${camModalPlateId}/jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "cam",
          machine_id: selectedMachineId,
          tool_id: toolId,
        }),
      });
      if (!response.ok) {
        setCamModalError(await response.text());
        return;
      }
      await refreshJobs(camModalPlateId);
      closeCamModal();
    } catch (err) {
      console.error("Error creating CAM job:", err);
      setCamModalError("Failed to create CAM job.");
    } finally {
      setCamModalLoading(false);
    }
  }

  function onReceive(data: {
    partId: number;
    quantity: number;
    from?: number;
  }) {
    if (!partsToPlates || !setPartsToPlates) return;
    console.log("Received data:", data);
    const plateIndex = Number.parseInt(name);
    const currentPlateId = plates[plateIndex]?.id;
    if (currentPlateId == null) return;
    if (data.from != null && data.from === currentPlateId) return;

    if (data.from == null) {
      setUnassignedParts((prev) => {
        const currentQuantity = prev[data.partId] || 0;
        const newQuantity = Math.max(0, currentQuantity - data.quantity);
        return { ...prev, [data.partId]: newQuantity };
      });
    }

    setPartsToPlates((prev) => {
      const next = { ...prev };

      if (data.from != null) {
        console.log("Removing from plate:", data.from);
        const oldPlate = next[data.from] ?? [];
        next[data.from] = oldPlate
          .map((part) =>
            part.partId === data.partId
              ? { ...part, quantity: part.quantity - data.quantity }
              : part
          )
          .filter((part) => part.quantity > 0);
      }

      const current = next[currentPlateId] ?? [];
      const exists = current.some((part) => part.partId === data.partId);
      next[currentPlateId] = exists
        ? current.map((part) =>
            part.partId === data.partId
              ? { ...part, quantity: part.quantity + data.quantity }
              : part
          )
        : [...current, { partId: data.partId, quantity: data.quantity }];

      return next;
    });
  }
  return (
    <div className={styles.cardWrapper}>
      <div
        className={styles.cardPlate}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
        }}
        onDrop={(e) => {
          e.preventDefault();
          const raw = e.dataTransfer.getData("application/json");
          if (!raw) return;

          const data = JSON.parse(raw);
          onReceive(data);
        }}
      >
        <div id={styles.plateName}>Plate {Number.parseInt(name) + 1}</div>
        {partsToPlates[plates[Number.parseInt(name)].id]
          ? partsToPlates[plates[Number.parseInt(name)].id]
              .filter((p) => p.quantity > 0)
              .map((part, index) => (
                <PartsCard
                  key={index}
                  partId={part.partId}
                  quantity={part.quantity}
                  plateId={plates[Number.parseInt(name)].id}
                />
              ))
          : null}
        <button
          className={styles.arrangeButton}
          onClick={async () => {
            if (categoryId === 0) return;
            try {
              const plateIndex = Number.parseInt(name);
              const localPlate = plates[plateIndex];
              const plateAssignments = partsToPlates[localPlate.id] || [];

              if (plateAssignments.filter((p) => p.quantity > 0).length === 0) {
                return;
              }
              console.log("body:", {
                width: localPlate.width,
                length: localPlate.length,
                true_depth: localPlate.true_depth,
              });
              const databasePlates = await fetch(
                `/api/pc/${categoryId}/plates`
              );
              if (!databasePlates.ok) {
                console.error(
                  "Failed to fetch database plates:",
                  await databasePlates.text()
                );
                return;
              }
              const databasePlatesData: Array<{
                id: number;
                width: number;
                length: number;
                true_depth: number;
              }> = await databasePlates.json();
              const matchingPlate = databasePlatesData.find(
                (p) => p.id === localPlate.id
              );
              let realPlateId: number;
              console.log("Matching plate:", matchingPlate);
              if (!matchingPlate) {
                const createPlateRes = await fetch(
                  `/api/pc/${categoryId}/plates`,
                  {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      width: localPlate.width,
                      length: localPlate.length,
                      true_depth: localPlate.true_depth,
                      name: `Plate ${Number.parseInt(name) + 1}`,
                    }),
                  }
                );

                if (!createPlateRes.ok) {
                  console.error(
                    "Failed to create plate:",
                    await createPlateRes.text()
                  );
                  return;
                }

                realPlateId = (await createPlateRes.json()).id;
                console.log("Created plate with ID:", realPlateId);
                console.log("Real Plate Id is:", realPlateId);
                for (const assignment of plateAssignments) {
                  if (assignment.quantity <= 0) continue;

                  const assignRes = await fetch(
                    `/api/pc/${categoryId}/assignments`,
                    {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        plate_id: realPlateId,
                        part_id: assignment.partId,
                        quantity: assignment.quantity,
                      }),
                    }
                  );

                  if (!assignRes.ok) {
                    console.error(
                      "Failed to assign part:",
                      assignment.partId,
                      await assignRes.text()
                    );
                  } else {
                    console.log(
                      "Assigned part",
                      assignment.partId,
                      "qty",
                      assignment.quantity,
                      "to plate",
                      realPlateId
                    );
                  }
                  const oldPart = await fetch(
                    `/api/parts/${assignment.partId}`
                  );
                  const oldPartQuantity = (await oldPart.json()).quantity;

                  const changeQuantityRes = await fetch(
                    `/api/parts/${assignment.partId}`,
                    {
                      method: "PATCH",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        quantity: oldPartQuantity - assignment.quantity,
                      }),
                    }
                  );
                  if (!changeQuantityRes.ok) {
                    console.error(
                      "Failed to update part quantity:",
                      await changeQuantityRes.text()
                    );
                  }
                }

                const oldPlateId = localPlate.id;
                const newPlates = plates.map((p, idx) =>
                  idx === plateIndex ? { ...p, id: realPlateId } : p
                );
                setPlates(newPlates);

                const newPartsToPlates = { ...partsToPlates };
                newPartsToPlates[realPlateId] = newPartsToPlates[oldPlateId];
                delete newPartsToPlates[oldPlateId];
                setPartsToPlates(newPartsToPlates);
              } else {
                realPlateId = localPlate.id;
              }

              const response = await fetch(
                `http://localhost:3000/api/plates/${realPlateId}/jobs`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    type: "arrange",
                  }),
                }
              );
              if (!response.ok) {
                console.error(
                  "Failed to create arrange job:",
                  await response.text()
                );
                return;
              }
              const { id: jobId } = await response.json();
              const jobStatus = await fetch(
                `http://localhost:3000/api/plates/${realPlateId}/jobs`
              );
              const jobsData: PlatesJob[] = await jobStatus.json();
              const arrangeJob = jobsData.find((job) => job.id === jobId);
              if (arrangeJob) {
                setJobs((prev) => [...prev, arrangeJob]);
              }
            } catch (err) {
              console.error("Error during arrange:", err);
            }
          }}
        >
          <span>Arrange</span>
          <Image
            src="/mat_thickness/Arrange.svg"
            alt="Arrange"
            width={2000}
            height={2000}
            className={styles.arrangeIcon}
          />
        </button>
      </div>
      <div className={styles.jobsContainer}>
        {jobsDeleteError ? (
          <div className={styles.jobsError}>{jobsDeleteError}</div>
        ) : null}
        {buildPlateJobRuns(jobs).map((run, index) => {
          const arrange = run.arrange;
          const cam = run.cam;
          console.log("Job run:", run);
          const arrangeQueued = arrange.status === "pending";
          const arrangeInProgress = arrange.status === "in progress";
          const arrangeCompleted = arrange.status === "completed";
          const camQueued = cam?.status === "pending";
          const camCompleted = cam?.status === "completed";

          const readyForCam = arrangeCompleted && !cam;

          const queueTitle = (position: number) =>
            position > 0 ? `Queue position: ${position}` : undefined;

          return (
            <div key={arrange.id} className={styles.jobCard}>
              <span className={styles.jobId}>Job {index + 1}</span>
              <div className={styles.jobStatus}>
                <span
                  className={classNames(
                    styles.statusLabel,
                    styles.queued,
                    arrangeQueued && styles.tooltipTarget,
                    arrangeQueued && styles.stageQueued,
                    arrangeQueued && styles.noBorder,
                    arrangeCompleted && styles.stageComplete
                  )}
                  data-tooltip={
                    arrangeQueued ? queueTitle(arrange.queue_position) ?? "" : ""
                  }
                >
                  Queue
                  {arrangeQueued ? <MotionPath /> : null}
                </span>
                <span
                  className={classNames(
                    styles.statusDot,
                    arrangeCompleted && styles.dotComplete
                  )}
                />
                <span
                  className={classNames(
                    styles.statusLabel,
                    styles.largetext,
                    arrangeInProgress && styles.stageQueued,
                    arrangeInProgress && styles.noBorder,
                    arrangeCompleted && styles.stageComplete,
                    readyForCam && styles.stageAction,
                    readyForCam && styles.clickable
                  )}
                  role={readyForCam ? "button" : undefined}
                  tabIndex={readyForCam ? 0 : undefined}
                  onClick={() => {
                    if (!readyForCam) return;
                    if (currentPlateId == null) return;
                    openCamModal(currentPlateId, arrange.id);
                  }}
                  onKeyDown={(e) => {
                    if (!readyForCam) return;
                    if (e.key !== "Enter" && e.key !== " ") return;
                    e.preventDefault();
                    if (currentPlateId == null) return;
                    openCamModal(currentPlateId, arrange.id);
                  }}
                >
                  {arrangeInProgress ? "Arranging" : "Arrange"}
                  {arrangeInProgress ? <MotionPath /> : null}
                </span>
                <span
                  className={classNames(
                    styles.statusDot,
                    arrangeCompleted && styles.dotComplete
                  )}
                />
                <span
                  className={classNames(
                    styles.statusLabel,
                    styles.queued,
                    cam && styles.stageComplete
                  )}
                >
                  Queue
                </span>
                <span
                  className={classNames(
                    styles.statusDot,
                    cam && styles.dotComplete
                  )}
                />
                <span
                  className={classNames(
                    styles.statusLabel,
                    styles.largetext,
                    camQueued && styles.tooltipTarget,
                    camQueued && styles.stageQueued,
                    camQueued && styles.noBorder,
                    camCompleted && styles.stageComplete
                  )}
                  data-tooltip={camQueued ? queueTitle(cam.queue_position) ?? "" : ""}
                >
                  CAM
                  {camQueued ? <MotionPath /> : null}
                </span>
              </div>
              <div className={styles.trashContainer}>
                <button
                  type="button"
                  className={styles.trashButton}
                  onClick={() => onDeleteRun(run)}
                  disabled={Boolean(
                    jobsDeleteBusy[arrange.id] ||
                      (cam && jobsDeleteBusy[cam.id])
                  )}
                  aria-label="Delete job"
                  title="Delete job"
                >
                  <Image
                    src={"/mat_thickness/trash.svg"}
                    alt=""
                    width={2000}
                    height={2000}
                    className={styles.trashIcon}
                  />
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <AnimatePresence>
        {camModalOpen && (
          <motion.div
            className={styles.camModalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCamModal}
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
                  onClick={closeCamModal}
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
                  {camModalLoading ? (
                    <div className={styles.camModalPlaceholder}>Loading…</div>
                  ) : camScreenshotUrl ? (
                    <img
                      src={camScreenshotUrl}
                      alt="Arrangement screenshot"
                      className={styles.camModalImage}
                    />
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
                      {camModalLoading
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
                            selectedMachineId === m.id && styles.machineOptionSelected
                          )}
                          onClick={() => setSelectedMachineId(m.id)}
                          disabled={camModalLoading}
                        >
                          {m.name}
                        </button>
                      ))}
                    </div>
                  )}

                  {camModalError ? (
                    <div className={styles.camModalError}>{camModalError}</div>
                  ) : selectedMachineId != null &&
                    pickToolIdForMachine(selectedMachineId, tools) == null ? (
                    <div className={styles.camModalError}>
                      No tool is configured for this machine. Add one in Settings →
                      Fusion Inputs.
                    </div>
                  ) : null}
                </div>
              </div>
              <div className={styles.camModalFooter}>
                <button
                  type="button"
                  className={styles.camModalCancel}
                  onClick={closeCamModal}
                  disabled={camModalLoading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={styles.camModalConfirm}
                  onClick={submitCam}
                  disabled={
                    camModalLoading ||
                    selectedMachineId == null ||
                    pickToolIdForMachine(selectedMachineId, tools) == null
                  }
                >
                  CAM
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PartsCard({
  partId,
  quantity,
  plateId,
}: {
  partId: number;
  quantity: number;
  plateId: number;
}) {
  const { parts } = useMaterialEvents();
  const [expanded, setExpanded] = useState(false);
  const part = parts.find((p) => p.id === partId) || { name: "Unknown Part" };
  const handleDragStart = (e: React.DragEvent<HTMLElement>, many: number) => {
    const payload = { partId, quantity: many, from: plateId };
    e.dataTransfer.setData("application/json", JSON.stringify(payload));
    e.dataTransfer.effectAllowed = "move";
    const el = e.currentTarget;
    const clone = el.cloneNode(true) as HTMLElement;
    clone.style.position = "fixed";
    clone.style.top = "-1000px";
    clone.style.left = "-1000px";
    clone.style.pointerEvents = "none";
    clone.style.width = `${el.getBoundingClientRect().width}px`;
    document.body.appendChild(clone);
    e.dataTransfer.setDragImage(clone, 20, 20);
    requestAnimationFrame(() => document.body.removeChild(clone));
  };
  return (
    <div className={styles.card}>
      <div
        className={styles.cardHeader}
        draggable
        onDragStart={(e) => handleDragStart(e, quantity)}
      >
        <span>{part?.name}</span>
        <span className={styles.cardHeaderQuantity}>{quantity}</span>
        <Image
          src={"/mat_thickness/Dropdown.svg"}
          alt={"Dropdown"}
          width={2000}
          height={2000}
          id={styles.dropdownicon}
          onClick={() => setExpanded(!expanded)}
        />
      </div>
      <AnimatePresence>
        {expanded ? (
          <motion.div
            className={styles.cardBody}
            style={{ overflow: "hidden" }}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            {Array.from({ length: quantity }).map((_, i) => (
              <div key={i} draggable onDragStart={(e) => handleDragStart(e, 1)}>
                <span>{part?.name}</span>
                <span className={styles.cardBodyQuantity}>1</span>
              </div>
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
