"use client";

import { motion } from "framer-motion";
import styles from "./boxtubes.module.css";
import { BoxTube } from "@/app/types";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useDashboardEvents } from "@/app/dashboard/dashboardTeam";
import { PrimaryButton, SecondaryButton } from "@/components/Buttons/Buttons";
import { ConditionalMarquee } from "./ConditionalMarquee";
import Image from "next/image";

type BoxTubeStatus = {
  status: "pending" | "in progress" | "completed";
  completedJobId?: number | null;
  queuePosition?: number | null;
};

type BoxTubeWithStatus = BoxTube & BoxTubeStatus;

function BoxTubeCard({
  boxtube,
  delay,
  onRequestCam,
  requesting,
  jobError,
  onShowError,
  onDownload,
  downloading,
}: {
  boxtube: BoxTubeWithStatus;
  delay: number;
  onRequestCam: (id: number) => void;
  requesting: boolean;
  jobError?: string;
  onShowError?: () => void;
  onDownload?: (boxtube: BoxTubeWithStatus) => void;
  downloading?: boolean;
}) {
  const downloadReady = boxtube.completedJobId != null;
  const pendingWithQueue = boxtube.status === "pending" && boxtube.queuePosition != null;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: delay, duration: 0.3 }}
      className={styles.boxtubecard}
    >
      <div id={styles.boxtubecardheader}>
        <ConditionalMarquee text={boxtube.name} />
      </div>
      <div id={styles.boxtubecardinfo}>
        <p id={styles.boxtubecardepic}>Epic: {boxtube.epic}</p>
        <p id={styles.boxtubecardquantity}>Quantity: {boxtube.quantity}</p>
      </div>
      <div id={styles.boxtubecardactions}>
        {boxtube.status === "completed" ? (
          <div id={styles.boxtubecardcompletedactions}>
            <PrimaryButton
              id={styles.downloadboxtubebutton}
              disabled={downloading || !downloadReady}
              onClick={() => onDownload?.(boxtube)}
            >
              <span className="textGradient">
                <Image
                  src="/dashboard/download.svg"
                  alt="download"
                  width={16}
                  height={16}
                />{" "}
                Download
              </span>
            </PrimaryButton>
            <div id={styles.removeboxtubebutton}>
              <Image
                src="/dashboard/remove.svg"
                alt="remove"
                width={2000}
                height={2000}
                id={styles.removeicon}
              />
            </div>
          </div>
        ) : boxtube.status === "in progress" ? (
          <div className={styles.boxtubecardcamdisabled}>
            <span className={styles.ellipsis1}>.</span>
            <span className={styles.ellipsis2}>.</span>
            <span className={styles.ellipsis3}>.</span>
          </div>
        ) : pendingWithQueue ? (
          <SecondaryButton id={styles.requestcambutton} disabled>
            <span className="textGradient">In queue: {boxtube.queuePosition}</span>
          </SecondaryButton>
        ) : jobError ? (
          <button
            className={styles.errorButton}
            onClick={onShowError}
            type="button"
          >
            <span className={styles.errorDot} />
            View Error
          </button>
        ) : (
          <SecondaryButton
            id={styles.requestcambutton}
            disabled={requesting}
            onClick={() => onRequestCam(boxtube.id)}
          >
            <span className="textGradient">CAM</span>
            {requesting ? (
              <span className={styles.requestingDots}>...</span>
            ) : null}
          </SecondaryButton>
        )}
      </div>
    </motion.div>
  );
}

function NoTeamCard() {
  const router = useRouter();
  return (
    <div className={styles.noTeamContainer}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className={styles.noTeamCard}
      >
        <h2>No Team Found</h2>
        <p>You need to be part of a team to view box tubes.</p>
        <div className={styles.noTeamButtons}>
          <PrimaryButton
            onClick={() => router.push("/dashboard/settings/newteam")}
          >
            <span className="textGradient">Create a Team</span>
          </PrimaryButton>
          <SecondaryButton
            onClick={() => router.push("/dashboard/settings/jointeam")}
          >
            <span className="textGradient">Join a Team</span>
          </SecondaryButton>
        </div>
      </motion.div>
    </div>
  );
}

export default function Boxtubes() {
  const { team } = useDashboardEvents();
  const [boxtubes, setBoxTubes] = useState<BoxTubeWithStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [machines, setMachines] = useState<Array<{ id: number; name: string }>>(
    []
  );
  const [tools, setTools] = useState<
    Array<{ id: number; machine_ids?: number[]; default_selected?: boolean }>
  >([]);
  const [requestingJob, setRequestingJob] = useState<Record<number, boolean>>(
    {}
  );
  const [error, setError] = useState<string | null>(null);
  const [jobErrors, setJobErrors] = useState<Record<number, string>>({});
  const [activeError, setActiveError] = useState<{
    message: string;
    boxTubeName?: string;
  } | null>(null);
  const [downloading, setDownloading] = useState<Record<number, boolean>>({});
  const boxtubesRef = useRef<BoxTubeWithStatus[]>([]);

  useEffect(() => {
    let mounted = true;
    const loadBoxTubes = async () => {
      if (team === null || team === undefined) {
        setBoxTubes([]);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      const response = await fetch(`/api/teams/${team.id}/boxTubes`, {
        method: "GET",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
      });
      if (response.ok) {
        const data = await response.json();
        if (mounted) {
          const statusedData = (
            await Promise.all(
              data.map(async (bt: BoxTube) => {
                const meta = await fetchJobMeta(bt.id);
                return { ...bt, ...meta };
              })
            )
          ).filter(Boolean) as BoxTubeWithStatus[];
          setBoxTubes(statusedData);
        }
      }
      if (mounted) {
        setIsLoading(false);
      }
    };
    loadBoxTubes();
    return () => {
      mounted = false;
    };
  }, [team]);

  useEffect(() => {
    const loadMachinesAndTools = async () => {
      if (!team) return;
      try {
        const [mRes, tRes] = await Promise.all([
          fetch(`/api/teams/${team.id}/machines`),
          fetch(`/api/teams/${team.id}/tools`),
        ]);
        if (mRes.ok) {
          setMachines(
            (await mRes.json()) as Array<{ id: number; name: string }>
          );
        }
        if (tRes.ok) {
          setTools(
            (await tRes.json()) as Array<{
              id: number;
              machine_ids?: number[];
              default_selected?: boolean;
            }>
          );
        }
      } catch (err) {
        console.error("Failed to load machines/tools", err);
      }
    };
    loadMachinesAndTools();
  }, [team]);

  useEffect(() => {
    boxtubesRef.current = boxtubes;
  }, [boxtubes]);

  useEffect(() => {
    if (!team) return;
    let cancelled = false;

    const refreshJobStatuses = async () => {
      const current = boxtubesRef.current;
      if (current.length === 0) return;
      const updates = await Promise.all(
        current.map(async (bt) => ({
          id: bt.id,
          meta: await fetchJobMeta(bt.id),
        }))
      );
      if (cancelled) return;
      setBoxTubes((prev) =>
        prev.map((bt) => {
          const next = updates.find((u) => u.id === bt.id);
          return next ? { ...bt, ...next.meta } : bt;
        })
      );
    };

    refreshJobStatuses();
    const interval = setInterval(() => {
      refreshJobStatuses().catch(() => {});
    }, 5000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [team]);

  async function fetchJobMeta(boxTubeId: number): Promise<BoxTubeStatus> {
    try {
      const response = await fetch(`/api/boxTubes/${boxTubeId}/jobs`, {
        method: "GET",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
      });
      if (!response.ok) return { status: "pending", completedJobId: null, queuePosition: null };
      const jobs: Array<{ status?: string; id?: number; queue_position?: number }> =
        await response.json();
      if (!Array.isArray(jobs) || jobs.length === 0)
        return { status: "pending", completedJobId: null, queuePosition: null };
      const queuePosition =
        jobs
          .map((j) => (typeof j.queue_position === "number" ? j.queue_position : null))
          .filter((n): n is number => n !== null)
          .sort((a, b) => a - b)[0] ?? null;
      const completed = jobs
        .filter(
          (job) => job.status === "completed" && typeof job.id === "number"
        )
        .sort((a, b) => (b.id ?? 0) - (a.id ?? 0));
      const inProgress = jobs.some((job) => job.status === "in progress");
      if (completed.length > 0) {
        return { status: "completed", completedJobId: completed[0].id ?? null, queuePosition: null };
      }
      if (inProgress) return { status: "in progress", completedJobId: null, queuePosition };
      return { status: "pending", completedJobId: null, queuePosition };
    } catch (err) {
      console.error("Failed to fetch jobs for box tube", boxTubeId, err);
      return { status: "pending", completedJobId: null, queuePosition: null };
    }
  }

  function pickMachineAndTool() {
    if (machines.length === 0 || tools.length === 0) return null;
    const machineId = machines[0].id;
    const tool = tools.find(
      (t) =>
        !Array.isArray(t.machine_ids) ||
        t.machine_ids.length === 0 ||
        t.machine_ids.includes(machineId)
    );
    if (!tool) return null;
    return { machineId, toolId: tool.id };
  }

  async function requestCamJob(boxTubeId: number) {
    if (!team) return;
    setError(null);
    setJobErrors((prev) => {
      const next = { ...prev };
      delete next[boxTubeId];
      return next;
    });
    const pick = pickMachineAndTool();
    if (!pick) {
      setError(
        "No machine/tool configured. Add one in Settings → Fusion Inputs."
      );
      return;
    }
    setRequestingJob((prev) => ({ ...prev, [boxTubeId]: true }));
    try {
      const res = await fetch(`/api/boxTubes/${boxTubeId}/jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          machine_id: pick.machineId,
          tool_id: pick.toolId,
        }),
      });
      if (!res.ok) {
        const message = await res.text();
        setJobErrors((prev) => ({
          ...prev,
          [boxTubeId]: message || "Failed to request CAM job.",
        }));
        return;
      }
      const nextStatus = await fetchJobMeta(boxTubeId);
      setBoxTubes((prev) =>
        prev.map((bt) => (bt.id === boxTubeId ? { ...bt, ...nextStatus } : bt))
      );
    } catch (err) {
      console.error("Failed to request CAM job:", err);
      setJobErrors((prev) => ({
        ...prev,
        [boxTubeId]: "Failed to request CAM job.",
      }));
    } finally {
      setRequestingJob((prev) => {
        const next = { ...prev };
        delete next[boxTubeId];
        return next;
      });
    }
  }

  async function downloadBoxTube(bt: BoxTubeWithStatus) {
    const { id: boxTubeId, name, completedJobId } = bt;
    setActiveError(null);
    setDownloading((prev) => ({ ...prev, [boxTubeId]: true }));
    try {
      if (!completedJobId) {
        throw new Error(
          "No CAM bundle available yet. Please try again once the job completes."
        );
      }
      const res = await fetch(`/api/jobs/${completedJobId}`);
      if (!res.ok) {
        const message = await res.text();
        throw new Error(message || "Failed to fetch CAM bundle.");
      }
      const data = await res.json();
      const url = typeof data?.file === "string" ? data.file : null;
      if (!url) {
        throw new Error("No CAM bundle available for this job.");
      }
      const link = document.createElement("a");
      link.href = url;
      link.download = `${name ?? "boxtube"}-cam`;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.click();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to download CAM file for this box tube.";
      setActiveError({ message, boxTubeName: name });
    } finally {
      setDownloading((prev) => {
        const next = { ...prev };
        delete next[boxTubeId];
        return next;
      });
    }
  }

  // Show no team card if user has no team
  if (!team && !isLoading) {
    return <NoTeamCard />;
  }

  return (
    <>
      {isLoading ? (
        <div id={styles.loadingContainer}>
          <span id={styles.loadingSpinner} />
        </div>
      ) : error ? (
        <div className={styles.jobsError}>{error}</div>
      ) : boxtubes.length === 0 ? (
        <p id={styles.noboxes}>No Box Tubes available.</p>
      ) : (
        <>
          <div className={styles.boxtubeslist}>
            {boxtubes.map((boxtube, index) => (
              <BoxTubeCard
                key={boxtube.id}
                boxtube={boxtube}
                delay={index * 0.2 + 0.3}
                onRequestCam={requestCamJob}
                requesting={Boolean(requestingJob[boxtube.id])}
                jobError={jobErrors[boxtube.id]}
                onShowError={
                  jobErrors[boxtube.id]
                    ? () =>
                        setActiveError({
                          message: jobErrors[boxtube.id],
                          boxTubeName: boxtube.name,
                        })
                    : undefined
                }
                onDownload={downloadBoxTube}
                downloading={Boolean(downloading[boxtube.id])}
              />
            ))}
          </div>
          {activeError ? (
            <div
              className={styles.errorModalOverlay}
              role="presentation"
              onClick={() => setActiveError(null)}
            >
              <div
                className={styles.errorModal}
                role="dialog"
                aria-modal="true"
                onClick={(e) => e.stopPropagation()}
              >
                <h3>Error requesting CAM job</h3>
                {activeError.boxTubeName ? (
                  <p className={styles.errorModalSubtitle}>
                    Box Tube: {activeError.boxTubeName}
                  </p>
                ) : null}
                <p className={styles.errorModalBody}>{activeError.message}</p>
                <button
                  type="button"
                  className={styles.errorModalClose}
                  onClick={() => setActiveError(null)}
                >
                  Close
                </button>
              </div>
            </div>
          ) : null}
        </>
      )}
    </>
  );
}
