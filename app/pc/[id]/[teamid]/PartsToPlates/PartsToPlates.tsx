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

function buildPlateJobRuns(jobs: PlatesJob[]): PlateJobRun[] {
  // Pair CAM jobs to the earliest Arrange without a CAM, using queue order.
  const sorted = [...jobs].sort((a, b) => {
    if (a.queue_position !== b.queue_position)
      return a.queue_position - b.queue_position;
    return a.id - b.id;
  });

  const runs: PlateJobRun[] = [];
  for (const job of sorted) {
    if (job.kind === "arrange") {
      runs.push({ arrange: job });
      continue;
    }

    if (job.kind === "cam") {
      const target = runs.find((run) => !run.cam);
      if (target) {
        target.cam = job;
      } else {
        // Fallback if a CAM appears without an Arrange.
        runs.push({ arrange: job });
      }
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
  type PlatesJobWithMeta = PlatesJob & {
    payload?: unknown;
    response?: unknown;
  };

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

  function isValidPlateId(id: number | null | undefined): id is number {
    return Number.isFinite(id) && (id as number) > 0;
  }

  const [camModalOpen, setCamModalOpen] = useState(false);
  const [camModalArrangeJobId, setCamModalArrangeJobId] = useState<
    number | null
  >(null);
  const [camModalPlateId, setCamModalPlateId] = useState<number | null>(null);
  const [camModalLoading, setCamModalLoading] = useState(false);
  const [camModalError, setCamModalError] = useState<string | null>(null);
  const [camFileUrl, setCamFileUrl] = useState<string | null>(null);
  const [camFileType, setCamFileType] = useState<
    "image" | "pdf" | "other" | null
  >(null);
  const [camDownloadModalOpen, setCamDownloadModalOpen] = useState(false);
  const [camDownloadJobId, setCamDownloadJobId] = useState<number | null>(null);
  const [camDownloadArrangeJobId, setCamDownloadArrangeJobId] = useState<
    number | null
  >(null);
  const [camDownloadPlateId, setCamDownloadPlateId] = useState<number | null>(
    null
  );
  const [camDeleteConfirmOpen, setCamDeleteConfirmOpen] = useState(false);
  const [camDeleteBusy, setCamDeleteBusy] = useState(false);
  const [machineNames, setMachineNames] = useState<Record<number, string>>({});
  const [camDownloadLoading, setCamDownloadLoading] = useState(false);
  const [camDownloadError, setCamDownloadError] = useState<string | null>(null);
  const [camBundleUrl, setCamBundleUrl] = useState<string | null>(null);
  const [arrangePreviewUrl, setArrangePreviewUrl] = useState<string | null>(
    null
  );
  const [arrangePreviewType, setArrangePreviewType] = useState<
    "image" | "pdf" | "other" | null
  >(null);
  const [machines, setMachines] = useState<Array<{ id: number; name: string }>>(
    []
  );
  const [tools, setTools] = useState<
    Array<{ id: number; machine_ids?: number[]; material_ids?: number[] }>
  >([]);
  const [selectedMachineId, setSelectedMachineId] = useState<number | null>(
    null
  );
  const [materialNameForCategory, setMaterialNameForCategory] = useState<
    string | null
  >(null);
  const [materialIdForCategory, setMaterialIdForCategory] = useState<
    number | null
  >(null);
  const [camErrorModalOpen, setCamErrorModalOpen] = useState(false);
  const [camErrorMessage, setCamErrorMessage] = useState<string | null>(null);
  const [camErrorPlateId, setCamErrorPlateId] = useState<number | null>(null);
  const [camErrorArrangeJobId, setCamErrorArrangeJobId] = useState<
    number | null
  >(null);
  const [camErrorCamJobId, setCamErrorCamJobId] = useState<number | null>(null);
  const [camErrorRetryBusy, setCamErrorRetryBusy] = useState(false);
  const [camErrorMachineName, setCamErrorMachineName] = useState<string | null>(
    null
  );
  const [camErrorTitle, setCamErrorTitle] = useState("CAM Error");
  const [plateDeleteConfirmOpen, setPlateDeleteConfirmOpen] = useState(false);
  const [plateDeleteBusy, setPlateDeleteBusy] = useState(false);
  const [plateDeleteTargetId, setPlateDeleteTargetId] = useState<number | null>(
    null
  );
  const [camDownloadMachineName, setCamDownloadMachineName] = useState<
    string | null
  >(null);

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
    setCamFileUrl(null);
    setCamFileType(null);
    setMachines([]);
    setTools([]);
    setSelectedMachineId(null);
  }

  function closeCamDownloadModal() {
    setCamDownloadModalOpen(false);
    setCamDownloadJobId(null);
    setCamDownloadArrangeJobId(null);
    setCamDownloadPlateId(null);
    setCamDownloadError(null);
    setCamBundleUrl(null);
    setArrangePreviewUrl(null);
    setArrangePreviewType(null);
    setCamDownloadLoading(false);
    setCamDownloadMachineName(null);
  }

  function openCamDownloadModal(
    arrangeJobId: number,
    camJobId: number,
    plateId: number
  ) {
    setCamDownloadArrangeJobId(arrangeJobId);
    setCamDownloadJobId(camJobId);
    setCamDownloadPlateId(plateId);
    setCamDownloadModalOpen(true);
  }

  function openCamDeleteConfirm() {
    setCamDeleteConfirmOpen(true);
  }

  function closeCamDeleteConfirm() {
    setCamDeleteConfirmOpen(false);
  }

  function getJobError(job?: PlatesJobWithMeta): string | null {
    if (!job) return null;
    const resp = job.response;
    if (resp === null || resp === undefined) return null;
    if (typeof resp !== "object") return null;
    const maybe = resp as { error?: unknown };
    if (typeof maybe.error === "string") return maybe.error;
    return null;
  }

  function getCamMachineLabel(job?: PlatesJobWithMeta): string | null {
    if (!job) return null;
    const payload = job.payload;
    if (!payload || typeof payload !== "object") return null;
    const machineId = (payload as { machine_id?: unknown }).machine_id;
    if (typeof machineId !== "number") return null;
    const name = machineNames[machineId];
    return name ? name : `Machine ${machineId}`;
  }

  function openCamErrorModal(
    message: string | null,
    plateId: number | null,
    arrangeId: number | null,
    camId: number | null,
    machineName: string | null,
    title?: string
  ) {
    setCamErrorTitle(title ?? (camId ? "CAM Error" : "Job Error"));
    setCamErrorMessage(message ?? "This CAM job completed with an error.");
    setCamErrorPlateId(plateId);
    setCamErrorArrangeJobId(arrangeId);
    setCamErrorCamJobId(camId);
    setCamErrorMachineName(machineName);
    setCamErrorModalOpen(true);
  }

  function closeCamErrorModal() {
    setCamErrorModalOpen(false);
    setCamErrorMessage(null);
    setCamErrorPlateId(null);
    setCamErrorArrangeJobId(null);
    setCamErrorCamJobId(null);
    setCamErrorRetryBusy(false);
    setCamErrorMachineName(null);
  }

  function openPlateDeleteConfirm(plateId: number | null) {
    if (plateId == null) return;
    setPlateDeleteTargetId(plateId);
    setPlateDeleteConfirmOpen(true);
  }

  function closePlateDeleteConfirm() {
    setPlateDeleteConfirmOpen(false);
    setPlateDeleteBusy(false);
    setPlateDeleteTargetId(null);
  }

  async function detectFileType(url: string, signal?: AbortSignal) {
    try {
      const head = await fetch(url, { method: "HEAD", signal });
      if (!head.ok) return null;
      const ct = head.headers.get("content-type")?.toLowerCase() ?? null;
      if (!ct) return null;
      if (ct.startsWith("image/")) return "image" as const;
      if (ct.includes("application/pdf")) return "pdf" as const;
      return "other" as const;
    } catch {
      // Common if the signed URL doesn't allow HEAD/CORS. We'll fall back to rendering as an image.
      return null;
    }
  }

  useEffect(() => {
    if (!Number.isFinite(teamDbId)) return;
    let mounted = true;
    async function loadMachinesForLabels() {
      try {
        const res = await fetch(`/api/teams/${teamDbId}/machines`);
        if (!res.ok || !mounted) return;
        const data = (await res.json()) as Array<{ id: number; name: string }>;
        setMachineNames(Object.fromEntries(data.map((m) => [m.id, m.name])));
      } catch (err) {
        console.error("Failed to load machines for labels", err);
      }
    }
    loadMachinesForLabels();
    async function loadCategoryMaterial() {
      try {
        const res = await fetch(`/api/teams/${teamDbId}/pc`);
        if (!res.ok || !mounted) return;
        const data = (await res.json()) as Array<{
          id: number;
          material?: string;
        }>;
        const category = data.find((pc) => pc.id === categoryId);
        if (category?.material && mounted)
          setMaterialNameForCategory(category.material);
      } catch (err) {
        console.error("Failed to load part category material", err);
      }
    }
    loadCategoryMaterial();
    return () => {
      mounted = false;
    };
  }, [categoryId, teamDbId]);

  useEffect(() => {
    let mounted = true;
    async function assignedParts() {
      if (!plates || !setPartsToPlates) return;
      const plateIndex = Number.parseInt(name);
      const currentPlateId = plates[plateIndex]?.id;
      if (!isValidPlateId(currentPlateId)) return;

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
      setJobs(jobsData);
    }
    assignedParts();
    return () => {
      mounted = false;
    };
  }, [categoryId, name, plates, setPartsToPlates]);

  const shouldPollJobs = jobs.some((job) => job.status !== "completed");
  useEffect(() => {
    if (!isValidPlateId(currentPlateId)) return;
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
    setCamFileUrl(null);
    setCamFileType(null);

    async function load() {
      try {
        const [jobRes, machinesRes, toolsRes, materialsRes] = await Promise.all(
          [
            fetch(`/api/jobs/${camModalArrangeJobId}`),
            fetch(`/api/teams/${teamDbId}/machines`),
            fetch(`/api/teams/${teamDbId}/tools`),
            fetch(`/api/teams/${teamDbId}/materials`),
          ]
        );

        if (!mounted) return;

        if (jobRes.ok) {
          const jobData: { file?: string | null } = await jobRes.json();
          const url = jobData.file ?? null;
          setCamFileUrl(url);

          if (url) {
            const detected = await detectFileType(url);
            // If we can't detect (often due to CORS/HEAD), default to image so screenshots still render.
            setCamFileType(detected ?? "image");
          } else {
            setCamFileType(null);
          }
        } else {
          // Keep loading machines/tools even if the screenshot request fails.
          setCamModalError((await jobRes.text()) || "Failed to load job.");
          setCamFileUrl(null);
          setCamFileType(null);
        }

        if (machinesRes.ok) {
          const machinesData = (await machinesRes.json()) as Array<{
            id: number;
            name: string;
          }>;
          setMachines(machinesData);
          setMachineNames((prev) => {
            const merged = { ...prev };
            for (const m of machinesData) merged[m.id] = m.name;
            return merged;
          });
          setSelectedMachineId((prev) => prev ?? machinesData[0]?.id ?? null);
        }

        if (toolsRes.ok) {
          const toolsData = (await toolsRes.json()) as Array<{
            id: number;
            machine_ids?: number[];
            material_ids?: number[];
          }>;
          setTools(toolsData);
        }

        if (materialsRes.ok) {
          const materialsData = (await materialsRes.json()) as Array<{
            id: number;
            name: string;
          }>;
          if (materialNameForCategory) {
            const match = materialsData.find(
              (m) =>
                m.name.toLowerCase() === materialNameForCategory.toLowerCase()
            );
            if (match) setMaterialIdForCategory(match.id);
          }
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
  }, [camModalOpen, camModalArrangeJobId, teamDbId, materialNameForCategory]);

  useEffect(() => {
    if (!camDownloadModalOpen) return;
    if (camDownloadJobId == null || camDownloadArrangeJobId == null) return;
    let mounted = true;
    setCamDownloadLoading(true);
    setCamDownloadError(null);
    setCamBundleUrl(null);
    setArrangePreviewUrl(null);
    setArrangePreviewType(null);

    async function load() {
      try {
        const [camRes, arrangeRes] = await Promise.all([
          fetch(`/api/jobs/${camDownloadJobId}`),
          fetch(`/api/jobs/${camDownloadArrangeJobId}`),
        ]);

        if (!mounted) return;

        if (camRes.ok) {
          const camData: {
            file?: string | null;
            payload?: { machine_id?: number | null };
          } = await camRes.json();
          setCamBundleUrl(camData.file ?? null);
          const machineId = camData.payload?.machine_id ?? null;
          if (typeof machineId === "number") {
            setCamDownloadMachineName(
              machineNames[machineId] ?? `Machine ${machineId}`
            );
          } else {
            setCamDownloadMachineName(null);
          }
        } else {
          setCamDownloadError((await camRes.text()) || "Failed to load CAM.");
        }

        if (arrangeRes.ok) {
          const arrangeData: { file?: string | null } = await arrangeRes.json();
          const arrangeUrl = arrangeData.file ?? null;
          setArrangePreviewUrl(arrangeUrl);
          if (arrangeUrl) {
            const detected = await detectFileType(arrangeUrl);
            setArrangePreviewType(detected ?? "image");
          } else {
            setArrangePreviewType(null);
          }
        } else {
          setCamDownloadError(
            (await arrangeRes.text()) || "Failed to load arrange preview."
          );
        }
      } catch (err) {
        console.error("Error loading CAM download modal data:", err);
        if (!mounted) return;
        setCamDownloadError("Failed to load CAM bundle or preview.");
      } finally {
        if (!mounted) return;
        setCamDownloadLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [
    camDownloadModalOpen,
    camDownloadJobId,
    camDownloadArrangeJobId,
    machineNames,
  ]);

  async function deleteDownloadedCamJob() {
    if (camDownloadJobId == null) return;
    const plateId = camDownloadPlateId ?? currentPlateId;
    if (!isValidPlateId(plateId)) return;
    const jobIds = [camDownloadJobId, camDownloadArrangeJobId].filter(
      (id): id is number => typeof id === "number"
    );
    if (jobIds.length === 0) return;
    setCamDeleteBusy(true);
    setCamDownloadError(null);
    try {
      await deleteJobs(jobIds);
      const updated = await refreshJobs(plateId);
      if (updated.length === 0) {
        openPlateDeleteConfirm(plateId);
      }
      closeCamDeleteConfirm();
      closeCamDownloadModal();
    } catch (err) {
      console.error("Failed to delete downloaded CAM job:", err);
      setCamDownloadError("Failed to delete jobs. Please try again.");
    } finally {
      setCamDeleteBusy(false);
    }
  }

  async function retryCamFromError() {
    if (camErrorCamJobId == null || camErrorArrangeJobId == null) return;
    const plateId = camErrorPlateId ?? currentPlateId;
    if (plateId == null) return;
    setCamErrorRetryBusy(true);
    try {
      await deleteJobs([camErrorCamJobId]);
      await refreshJobs(plateId);
      closeCamErrorModal();
      openCamModal(plateId, camErrorArrangeJobId);
    } catch (err) {
      console.error("Failed to retry CAM job:", err);
      setCamErrorMessage("Failed to retry CAM job. Please try again.");
    } finally {
      setCamErrorRetryBusy(false);
    }
  }

  async function refreshJobs(plateId: number) {
    if (!isValidPlateId(plateId)) {
      setJobs([]);
      return [];
    }
    const jobRes = await fetch(`/api/plates/${plateId}/jobs`);
    if (!jobRes.ok) return [];
    const jobsData: PlatesJob[] = await jobRes.json();
    setJobs(jobsData);
    return jobsData;
  }

  async function deleteJobs(jobIds: number[]) {
    for (const jobId of jobIds) {
      const res = await fetch(`/api/jobs/${jobId}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
    }
  }

  async function deletePlate(plateId: number) {
    setPlateDeleteBusy(true);
    try {
      const res = await fetch(`/api/plates/${plateId}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      setPlates((prev) => prev.filter((p) => p.id !== plateId));
      setPartsToPlates((prev) => {
        const next = { ...prev };
        delete next[plateId];
        return next;
      });
      if (currentPlateId === plateId) {
        setJobs([]);
      }
      closePlateDeleteConfirm();
    } catch (err) {
      console.error("Failed to delete plate:", err);
      setPlateDeleteBusy(false);
    }
  }

  function getMatchingToolIds(machineId: number | null) {
    return tools
      .filter((tool) => {
        const machineOk =
          machineId == null ||
          !Array.isArray(tool.machine_ids) ||
          tool.machine_ids.length === 0 ||
          tool.machine_ids.includes(machineId);
        const materialOk =
          materialIdForCategory == null ||
          !Array.isArray(tool.material_ids) ||
          tool.material_ids.length === 0 ||
          tool.material_ids.includes(materialIdForCategory);
        return machineOk && materialOk;
      })
      .map((t) => t.id);
  }

  async function onDeleteRun(run: PlateJobRun) {
    if (!isValidPlateId(currentPlateId)) return;
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
      const updated = await refreshJobs(currentPlateId);
      if (updated.length === 0) {
        openPlateDeleteConfirm(currentPlateId);
      }
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
    const matchingTools = getMatchingToolIds(selectedMachineId);
    if (matchingTools.length === 0) {
      setCamModalError(
        "No tool is configured for this machine and material. Add one in Settings → Fusion Inputs."
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
          tool_ids: matchingTools,
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
        {currentPlateId != null ? (
          <button
            type="button"
            className={styles.plateDeleteButton}
            onClick={() => openPlateDeleteConfirm(currentPlateId)}
            aria-label="Delete plate"
          >
            <Image
              src="/dashboard/delete.svg"
              alt="Delete plate"
              width={14}
              height={14}
              className={styles.plateDeleteIcon}
            />
          </button>
        ) : null}
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

              const response = await fetch(`/api/plates/${realPlateId}/jobs`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  type: "arrange",
                }),
              });
              if (!response.ok) {
                console.error(
                  "Failed to create arrange job:",
                  await response.text()
                );
                return;
              }
              const { id: jobId } = await response.json();
              const jobStatus = await fetch(`/api/plates/${realPlateId}/jobs`);
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
          const arrangeQueued = arrange.status === "pending";
          const arrangeInProgress = arrange.status === "in progress";
          const arrangeCompleted = arrange.status === "completed";
          const camQueued = cam?.status === "pending";
          const camInProgress = cam?.status === "in progress";
          const camCompleted = cam?.status === "completed";
          const camErrorText =
            camCompleted && cam ? getJobError(cam as PlatesJobWithMeta) : null;
          const camHasError = camCompleted && Boolean(camErrorText);
          const camMachineLabel = getCamMachineLabel(cam as PlatesJobWithMeta);

          const readyForCam = arrangeCompleted && !cam;
          const readyForCamDownload = camCompleted && !camHasError;

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
                    arrangeQueued
                      ? queueTitle(arrange.queue_position) ?? ""
                      : ""
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
                    camQueued && styles.tooltipTarget,
                    camQueued && styles.stageQueued,
                    camQueued && styles.noBorder,
                    cam && styles.stageComplete
                  )}
                  data-tooltip={
                    camQueued ? queueTitle(cam.queue_position) ?? "" : ""
                  }
                >
                  Queue
                  {camQueued ? <MotionPath /> : null}
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
                    camInProgress && styles.stageInProgress,
                    !camHasError && camCompleted && styles.stageComplete,
                    camHasError && styles.stageError,
                    readyForCamDownload && styles.stageAction,
                    (readyForCamDownload || camHasError) && styles.clickable
                  )}
                  data-tooltip={
                    camHasError
                      ? camErrorText ?? "Job completed with an error."
                      : camQueued
                      ? queueTitle(cam.queue_position) ?? ""
                      : camMachineLabel
                      ? `Machine: ${camMachineLabel}`
                      : ""
                  }
                  role={
                    readyForCamDownload || camHasError ? "button" : undefined
                  }
                  tabIndex={readyForCamDownload || camHasError ? 0 : undefined}
                  onClick={() => {
                    if (!cam) return;
                    if (camHasError) {
                      openCamErrorModal(
                        camErrorText,
                        currentPlateId ?? null,
                        arrange.id,
                        cam.id,
                        camMachineLabel
                      );
                      return;
                    }
                    if (readyForCamDownload) {
                      if (currentPlateId == null) return;
                      openCamDownloadModal(arrange.id, cam.id, currentPlateId);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (!cam) return;
                    if (e.key !== "Enter" && e.key !== " ") return;
                    e.preventDefault();
                    if (camHasError) {
                      openCamErrorModal(
                        camErrorText,
                        currentPlateId ?? null,
                        arrange.id,
                        cam.id,
                        camMachineLabel
                      );
                      return;
                    }
                    if (readyForCamDownload) {
                      if (currentPlateId == null) return;
                      openCamDownloadModal(arrange.id, cam.id, currentPlateId);
                    }
                  }}
                >
                  CAM
                  {camMachineLabel && (
                    <span className={styles.machineHint}>
                      {camMachineLabel}
                    </span>
                  )}
                  {camInProgress && !camHasError ? <MotionPath /> : null}
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
                            selectedMachineId === m.id &&
                              styles.machineOptionSelected
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
                    getMatchingToolIds(selectedMachineId).length === 0 ? (
                    <div className={styles.camModalError}>
                      No tool is configured for this machine and material. Add
                      one in Settings → Fusion Inputs.
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
      <AnimatePresence>
        {camDownloadModalOpen && (
          <motion.div
            className={styles.camModalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCamDownloadModal}
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
                <span>CAM Bundle Ready</span>
                <button
                  type="button"
                  className={styles.camModalClose}
                  onClick={closeCamDownloadModal}
                >
                  <Image
                    src="/settings/teams/X.svg"
                    alt="Close"
                    width={16}
                    height={16}
                    style={{ filter: "invert(1)" }}
                  />
                </button>
              </div>
              <div className={styles.camModalBody}>
                <div className={styles.camModalControls}>
                  <label className={styles.camModalLabel}>
                    Arrange Preview
                  </label>
                  {camDownloadLoading ? (
                    <div className={styles.camModalPlaceholder}>Loading…</div>
                  ) : arrangePreviewUrl ? (
                    arrangePreviewType === "image" ? (
                      <div style={{ display: "grid", gap: 8 }}>
                        <img
                          src={arrangePreviewUrl}
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
                          <a
                            href={arrangePreviewUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Open
                          </a>
                          <a href={arrangePreviewUrl} download>
                            Download
                          </a>
                        </div>
                      </div>
                    )
                  ) : (
                    <div className={styles.camModalPlaceholder}>
                      No arrange screenshot found.
                    </div>
                  )}
                  {camDownloadError ? (
                    <div className={styles.camModalError}>
                      {camDownloadError}
                    </div>
                  ) : null}
                </div>
              </div>
              <div className={styles.camModalFooter}>
                <div className={styles.camModalFooterLeft}>
                  {camDownloadMachineName
                    ? `Machine: ${camDownloadMachineName}`
                    : ""}
                </div>
                <div className={styles.camModalFooterRight}>
                  <button
                    type="button"
                    className={styles.camModalCancel}
                    onClick={closeCamDownloadModal}
                    disabled={camDownloadLoading}
                  >
                    Close
                  </button>
                  {camBundleUrl ? (
                    <a
                      href={camBundleUrl}
                      download
                      className={styles.camModalConfirm}
                      style={{ textAlign: "center" }}
                      onClick={() => openCamDeleteConfirm()}
                    >
                      Download CAM
                    </a>
                  ) : (
                    <button
                      type="button"
                      className={styles.camModalConfirm}
                      disabled
                    >
                      CAM Not Available
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {camDeleteConfirmOpen && (
          <motion.div
            className={styles.camModalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCamDeleteConfirm}
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
                <span>After Download</span>
                <button
                  type="button"
                  className={styles.camModalClose}
                  onClick={closeCamDeleteConfirm}
                  disabled={camDeleteBusy}
                >
                  <Image
                    src="/settings/teams/X.svg"
                    alt="Close"
                    width={16}
                    height={16}
                    style={{ filter: "invert(1)" }}
                  />
                </button>
              </div>
              <div className={styles.camModalBody}>
                <div className={styles.camModalPlaceholder}>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>
                    Delete this plate’s CAM + arrange jobs?
                  </div>
                  <div style={{ color: "var(--muted)", marginBottom: 6 }}>
                    - Delete: removes both the CAM and its arrange job from the
                    queue/history for this plate. You can still re-run
                    Arrange/CAM later if needed.
                  </div>
                  <div style={{ color: "var(--muted)" }}>
                    - Keep: leaves the jobs visible so teammates can download
                    again.
                  </div>
                  {camDownloadError ? (
                    <div
                      className={styles.camModalError}
                      style={{ marginTop: 8 }}
                    >
                      {camDownloadError}
                    </div>
                  ) : null}
                </div>
              </div>
              <div className={styles.camModalFooter}>
                <button
                  type="button"
                  className={styles.camModalCancel}
                  onClick={closeCamDeleteConfirm}
                  disabled={camDeleteBusy}
                >
                  Keep CAM Job
                </button>
                <button
                  type="button"
                  className={styles.camModalConfirm}
                  onClick={deleteDownloadedCamJob}
                  disabled={camDeleteBusy}
                >
                  {camDeleteBusy ? "Deleting…" : "Delete CAM Job"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {camErrorModalOpen && (
          <motion.div
            className={styles.camModalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCamErrorModal}
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
                <span>{camErrorTitle}</span>
                <button
                  type="button"
                  className={styles.camModalClose}
                  onClick={closeCamErrorModal}
                >
                  <Image
                    src="/settings/teams/X.svg"
                    alt="Close"
                    width={16}
                    height={16}
                    style={{ filter: "invert(1)" }}
                  />
                </button>
              </div>
              <div className={styles.camModalBody}>
                <div className={styles.camModalPlaceholder}>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>
                    This CAM job finished with an error.
                  </div>
                  <div style={{ color: "var(--muted)" }}>
                    {camErrorMessage ?? "No additional details provided."}
                  </div>
                  {camErrorMachineName ? (
                    <div
                      style={{
                        color: "var(--muted)",
                        marginTop: 8,
                        fontSize: 13,
                      }}
                    >
                      Machine: {camErrorMachineName}
                    </div>
                  ) : null}
                </div>
              </div>
              <div className={styles.camModalFooter}>
                <button
                  type="button"
                  className={styles.camModalCancel}
                  onClick={closeCamErrorModal}
                >
                  Close
                </button>
                <button
                  type="button"
                  className={styles.camModalConfirm}
                  onClick={retryCamFromError}
                  disabled={camErrorRetryBusy}
                >
                  {camErrorRetryBusy ? "Retrying…" : "Retry CAM"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {plateDeleteConfirmOpen && (
          <motion.div
            className={styles.camModalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closePlateDeleteConfirm}
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
                <span>Delete Plate?</span>
                <button
                  type="button"
                  className={styles.camModalClose}
                  onClick={closePlateDeleteConfirm}
                  disabled={plateDeleteBusy}
                >
                  <Image
                    src="/settings/teams/X.svg"
                    alt="Close"
                    width={16}
                    height={16}
                    style={{ filter: "invert(1)" }}
                  />
                </button>
              </div>
              <div className={styles.camModalBody}>
                <div className={styles.camModalPlaceholder}>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>
                    Remove this plate from the category?
                  </div>
                  <div style={{ color: "var(--muted)" }}>
                    This deletes the plate and its assignments. You can recreate
                    it later if needed.
                  </div>
                </div>
              </div>
              <div className={styles.camModalFooter}>
                <button
                  type="button"
                  className={styles.camModalCancel}
                  onClick={closePlateDeleteConfirm}
                  disabled={plateDeleteBusy}
                >
                  Keep Plate
                </button>
                <button
                  type="button"
                  className={styles.camModalConfirm}
                  onClick={() => {
                    if (plateDeleteTargetId != null)
                      deletePlate(plateDeleteTargetId);
                  }}
                  disabled={plateDeleteBusy}
                >
                  {plateDeleteBusy ? "Deleting…" : "Delete Plate"}
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
