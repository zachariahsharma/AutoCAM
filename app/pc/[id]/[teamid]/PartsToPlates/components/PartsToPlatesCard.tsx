import styles from "../partstoplates.module.css";
import { useMaterialEvents } from "../../materialEvents";
import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import type { PlatesJob } from "@/app/types";
import type { PlateJobRun } from "./helpers";
import { PlatePartsSection } from "./PlatePartsSection";
import {
  PlateJobsList,
  PlatesJobWithMeta,
} from "./PlateJobsList";
import { CamModal } from "./modals/CamModal";
import { CamDownloadModal } from "./modals/CamDownloadModal";
import { CamDeleteConfirmModal } from "./modals/CamDeleteConfirmModal";
import { ArrangeErrorModal } from "./modals/ArrangeErrorModal";
import { CamErrorModal } from "./modals/CamErrorModal";
import { PlateDeleteConfirmModal } from "./modals/PlateDeleteConfirmModal";

export function PartsToPlatesCard({
  name,
  categoryId,
}: {
  name: string;
  categoryId: number;
}) {
  type ExcessPart = {
    part_id: number;
    quantity: number;
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
  const plateAssignments = isValidPlateId(currentPlateId)
    ? partsToPlates[currentPlateId] ?? []
    : [];

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
  const [assignmentsLoaded, setAssignmentsLoaded] = useState(false);
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
  const [arrangeErrorModalOpen, setArrangeErrorModalOpen] = useState(false);
  const [arrangeErrorMessage, setArrangeErrorMessage] = useState<string | null>(
    null
  );
  const [arrangeErrorArrangeJobId, setArrangeErrorArrangeJobId] = useState<
    number | null
  >(null);
  const [arrangeErrorPlateId, setArrangeErrorPlateId] = useState<number | null>(
    null
  );
  const [arrangeErrorRetryBusy, setArrangeErrorRetryBusy] = useState(false);
  const [plateDeleteConfirmOpen, setPlateDeleteConfirmOpen] = useState(false);
  const [plateDeleteBusy, setPlateDeleteBusy] = useState(false);
  const [plateDeleteTargetId, setPlateDeleteTargetId] = useState<number | null>(
    null
  );
  const [camDownloadMachineName, setCamDownloadMachineName] = useState<
    string | null
  >(null);
  const handledExcessJobs = useRef<Set<number>>(new Set());

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

  function getArrangeErrorMessage(job?: PlatesJobWithMeta): string | null {
    if (!job) return null;
    const resp = job.response;
    if (resp === null || resp === undefined) return null;
    if (typeof resp !== "object") return null;
    const maybe = resp as { error?: unknown };
    if (typeof maybe.error === "string") return maybe.error;
    return null;
  }

  function getArrangeExcessParts(job?: PlatesJobWithMeta): ExcessPart[] {
    if (!job) return [];
    const resp = job.response;
    if (resp === null || resp === undefined) return [];
    if (typeof resp !== "object") return [];
    const maybe = resp as { excess_parts?: unknown };
    if (!Array.isArray(maybe.excess_parts)) return [];
    return maybe.excess_parts
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        const partId = (item as { part_id?: unknown }).part_id;
        const quantity = (item as { quantity?: unknown }).quantity;
        if (typeof partId !== "number") return null;
        if (typeof quantity !== "number") return null;
        if (quantity <= 0) return null;
        return { part_id: partId, quantity };
      })
      .filter((item): item is ExcessPart => item !== null);
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

  function openArrangeErrorModal(
    message: string | null,
    plateId: number | null,
    arrangeId: number | null
  ) {
    if (plateId == null || arrangeId == null) return;
    setArrangeErrorMessage(message);
    setArrangeErrorPlateId(plateId);
    setArrangeErrorArrangeJobId(arrangeId);
    setArrangeErrorModalOpen(true);
  }

  function closeArrangeErrorModal() {
    setArrangeErrorModalOpen(false);
    setArrangeErrorMessage(null);
    setArrangeErrorPlateId(null);
    setArrangeErrorArrangeJobId(null);
    setArrangeErrorRetryBusy(false);
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

  const applyExcessParts = useCallback(
    async (
      plateId: number,
      excessParts: ExcessPart[],
      plateAssignments: { partId: number; quantity: number }[]
    ) => {
      if (excessParts.length === 0) return false;
      if (plateAssignments.length === 0) return false;

      const excessByPart = new Map<number, number>();
      for (const item of excessParts) {
        excessByPart.set(
          item.part_id,
          (excessByPart.get(item.part_id) ?? 0) + item.quantity
        );
      }

      const appliedExcessByPart = new Map<number, number>();
      setPartsToPlates((prev) => {
        const currentAssignments = prev[plateId] ?? [];
        const removedByPart = new Map<number, number>();
        const updatedAssignments = currentAssignments
          .map((part) => {
            const totalExcess = excessByPart.get(part.partId) ?? 0;
            if (totalExcess === 0) return part;
            const alreadyRemoved = removedByPart.get(part.partId) ?? 0;
            const remainingToRemove = Math.max(
              0,
              totalExcess - alreadyRemoved
            );
            if (remainingToRemove === 0) return part;
            const removedQty = Math.min(part.quantity, remainingToRemove);
            if (removedQty <= 0) return part;
            removedByPart.set(
              part.partId,
              (removedByPart.get(part.partId) ?? 0) + removedQty
            );
            const quantity = part.quantity - removedQty;
            if (quantity <= 0) return null;
            return {
              ...part,
              quantity,
            };
          })
          .filter(
            (
              part
            ): part is {
              partId: number;
              quantity: number;
            } => part !== null && part.quantity > 0
          );
        if (removedByPart.size === 0) {
          return prev;
        }
        appliedExcessByPart.clear();
        for (const [partId, quantity] of removedByPart.entries()) {
          appliedExcessByPart.set(partId, quantity);
        }
        return {
          ...prev,
          [plateId]: updatedAssignments,
        };
      });

      if (appliedExcessByPart.size === 0) return false;

      setUnassignedParts((prev) => {
        const next = { ...prev };
        for (const [partId, quantity] of appliedExcessByPart.entries()) {
          next[partId] = (next[partId] ?? 0) + quantity;
        }
        return next;
      });

      try {
        const updates = Array.from(appliedExcessByPart.entries())
          .map(([partId, quantity]) => {
            const current = plateAssignments.find((p) => p.partId === partId);
            if (!current) return null;
            const newQuantity = Math.max(0, current.quantity - quantity);
            return fetch(`/api/pc/${categoryId}/assignments`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                plate_id: plateId,
                part_id: partId,
                quantity: newQuantity,
              }),
            });
          })
          .filter((request): request is Promise<Response> => request !== null);

        if (updates.length > 0) {
          const responses = await Promise.all(updates);
          const failed = responses.filter((res) => !res.ok);
          if (failed.length > 0) {
            console.error("Failed to update assignments for excess parts.");
          }
        }
      } catch (err) {
        console.error("Failed to update assignments for excess parts:", err);
      }

      return true;
    },
    [categoryId, setPartsToPlates, setUnassignedParts]
  );

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
      if (!Number.isFinite(categoryId) || categoryId <= 0) return;
      const plateIndex = Number.parseInt(name);
      const currentPlateId = plates[plateIndex]?.id;
      if (!isValidPlateId(currentPlateId)) return;
      setAssignmentsLoaded(false);

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
      setAssignmentsLoaded(true);
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

  useEffect(() => {
    if (!assignmentsLoaded) return;
    if (!isValidPlateId(currentPlateId)) return;
    const plateAssignments = partsToPlates[currentPlateId] ?? [];

    let cancelled = false;

    const handleExcessParts = async () => {
      const latestArrange = jobs
        .filter((job) => job.kind === "arrange")
        .sort((a, b) => b.id - a.id)[0];
      if (!latestArrange) return;
      const jobId = latestArrange.id;
      if (handledExcessJobs.current.has(jobId)) return;
      const excessParts = getArrangeExcessParts(
        latestArrange as PlatesJobWithMeta
      );
      if (excessParts.length === 0) return;
      handledExcessJobs.current.add(jobId);
      let handled = false;
      try {
        const applied = await applyExcessParts(
          currentPlateId,
          excessParts,
          plateAssignments
        );
        handled = !cancelled && applied;
      } catch (err) {
        console.error("Failed to apply excess parts for plate:", err);
      } finally {
        if (!handled) {
          handledExcessJobs.current.delete(jobId);
        }
      }
    };

    void handleExcessParts();
    return () => {
      cancelled = true;
    };
  }, [
    assignmentsLoaded,
    currentPlateId,
    jobs,
    partsToPlates,
    applyExcessParts,
  ]);

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

  async function retryArrangeFromError() {
    if (arrangeErrorPlateId == null || arrangeErrorArrangeJobId == null) return;
    setArrangeErrorRetryBusy(true);
    try {
      await deleteJobs([arrangeErrorArrangeJobId]);
      const response = await fetch(
        `/api/plates/${arrangeErrorPlateId}/jobs`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "arrange" }),
        }
      );
      if (!response.ok) {
        throw new Error(await response.text());
      }
      await refreshJobs(arrangeErrorPlateId);
      closeArrangeErrorModal();
    } catch (err) {
      console.error("Failed to retry arrange job:", err);
      setArrangeErrorMessage("Failed to retry arrange job. Please try again.");
    } finally {
      setArrangeErrorRetryBusy(false);
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
      const jobsRes = await fetch(`/api/plates/${plateId}/jobs`);
      if (!jobsRes.ok) throw new Error(await jobsRes.text());
      const jobsOnPlate: PlatesJob[] = await jobsRes.json();
      if (plateId === currentPlateId) {
        setJobs(jobsOnPlate);
      }
      if (jobsOnPlate.length > 0) {
        // Remove all jobs on the plate first so nothing is orphaned.
        await deleteJobs(jobsOnPlate.map((job) => job.id));
      }
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
      console.error("Failed to delete plate and jobs:", err);
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

  async function syncPlateAssignments(
    plateId: number,
    desiredAssignments: { partId: number; quantity: number }[]
  ) {
    if (!Number.isFinite(categoryId) || categoryId <= 0) return false;
    try {
      const res = await fetch(`/api/pc/${categoryId}/assignments`);
      if (!res.ok) {
        console.error(
          "Failed to fetch assignments before arrange:",
          await res.text()
        );
        return false;
      }
      const assignments: Array<{
        part_id: number;
        plate_id: number;
        quantity: number;
      }> = await res.json();
      const currentAssignments = assignments.filter(
        (assignment) => assignment.plate_id === plateId
      );

      const desiredMap = new Map<number, number>();
      for (const assignment of desiredAssignments) {
        if (assignment.quantity <= 0) continue;
        desiredMap.set(
          assignment.partId,
          (desiredMap.get(assignment.partId) ?? 0) + assignment.quantity
        );
      }

      const currentMap = new Map<number, number>();
      for (const assignment of currentAssignments) {
        currentMap.set(assignment.part_id, assignment.quantity);
      }

      const partIds = new Set([...desiredMap.keys(), ...currentMap.keys()]);
      const updates = Array.from(partIds).map((partId) =>
        fetch(`/api/pc/${categoryId}/assignments`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            plate_id: plateId,
            part_id: partId,
            quantity: desiredMap.get(partId) ?? 0,
          }),
        })
      );

      if (updates.length === 0) return true;
      const responses = await Promise.all(updates);
      const failed = responses.filter((res) => !res.ok);
      if (failed.length > 0) {
        console.error("Failed to sync assignments before arrange.");
        return false;
      }
      return true;
    } catch (err) {
      console.error("Failed to sync assignments before arrange:", err);
      return false;
    }
  }

  async function handleArrange() {
    if (categoryId === 0) return;
    try {
      const localPlate = plates[plateIndex];
      if (!localPlate) return;
      const assignments = partsToPlates[localPlate.id] || [];
      if (assignments.filter((p) => p.quantity > 0).length === 0) {
        return;
      }

      const databasePlates = await fetch(`/api/pc/${categoryId}/plates`);
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
        const createPlateRes = await fetch(`/api/pc/${categoryId}/plates`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            width: localPlate.width,
            length: localPlate.length,
            true_depth: localPlate.true_depth,
            name: `Plate ${plateIndex + 1}`,
          }),
        });

        if (!createPlateRes.ok) {
          console.error("Failed to create plate:", await createPlateRes.text());
          return;
        }

        realPlateId = (await createPlateRes.json()).id;
        for (const assignment of assignments) {
          if (assignment.quantity <= 0) continue;

          const assignRes = await fetch(`/api/pc/${categoryId}/assignments`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              plate_id: realPlateId,
              part_id: assignment.partId,
              quantity: assignment.quantity,
            }),
          });

          if (!assignRes.ok) {
            console.error(
              "Failed to assign part:",
              assignment.partId,
              await assignRes.text()
            );
          }

          const oldPart = await fetch(`/api/parts/${assignment.partId}`);
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
        const synced = await syncPlateAssignments(realPlateId, assignments);
        if (!synced) return;
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
        console.error("Failed to create arrange job:", await response.text());
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
      <PlatePartsSection
        plateId={currentPlateId}
        plateIndex={plateIndex}
        parts={plateAssignments}
        onDeletePlate={openPlateDeleteConfirm}
        onArrange={handleArrange}
        onReceive={onReceive}
      />
      <PlateJobsList
        currentPlateId={currentPlateId ?? null}
        jobs={jobs}
        jobsDeleteError={jobsDeleteError}
        jobsDeleteBusy={jobsDeleteBusy}
        onDeleteRun={onDeleteRun}
        onOpenArrangeError={openArrangeErrorModal}
        onOpenCamModal={openCamModal}
        onOpenCamError={openCamErrorModal}
        onOpenCamDownload={openCamDownloadModal}
        getArrangeErrorMessage={getArrangeErrorMessage}
        getArrangeExcessParts={getArrangeExcessParts}
        getJobError={getJobError}
        getCamMachineLabel={getCamMachineLabel}
      />
      <CamModal
        open={camModalOpen}
        loading={camModalLoading}
        error={camModalError}
        machines={machines}
        selectedMachineId={selectedMachineId}
        camFileUrl={camFileUrl}
        camFileType={camFileType}
        onClose={closeCamModal}
        onSelectMachine={setSelectedMachineId}
        onSubmit={submitCam}
        getMatchingToolIds={getMatchingToolIds}
      />
      <CamDownloadModal
        open={camDownloadModalOpen}
        loading={camDownloadLoading}
        error={camDownloadError}
        arrangePreviewUrl={arrangePreviewUrl}
        arrangePreviewType={arrangePreviewType}
        camBundleUrl={camBundleUrl}
        machineName={camDownloadMachineName}
        onClose={closeCamDownloadModal}
        onOpenDeleteConfirm={openCamDeleteConfirm}
      />
      <CamDeleteConfirmModal
        open={camDeleteConfirmOpen}
        busy={camDeleteBusy}
        errorMessage={camDownloadError}
        onClose={closeCamDeleteConfirm}
        onConfirm={deleteDownloadedCamJob}
      />
      <ArrangeErrorModal
        open={arrangeErrorModalOpen}
        message={arrangeErrorMessage}
        retryBusy={arrangeErrorRetryBusy}
        onClose={closeArrangeErrorModal}
        onRetry={retryArrangeFromError}
      />
      <CamErrorModal
        open={camErrorModalOpen}
        title={camErrorTitle}
        message={camErrorMessage}
        machineName={camErrorMachineName}
        retryBusy={camErrorRetryBusy}
        onClose={closeCamErrorModal}
        onRetry={retryCamFromError}
      />
      <PlateDeleteConfirmModal
        open={plateDeleteConfirmOpen}
        busy={plateDeleteBusy}
        onClose={closePlateDeleteConfirm}
        onConfirm={() => {
          if (plateDeleteTargetId != null) deletePlate(plateDeleteTargetId);
        }}
      />
    </div>
  );
}
