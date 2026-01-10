"use client";

import { motion } from "framer-motion";
import styles from "./boxtubes.module.css";
import { BoxTube, Team } from "@/app/types";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDashboardEvents } from "@/app/dashboard/dashboardTeam";
import { PrimaryButton, SecondaryButton } from "@/components/Buttons/Buttons";
import { ConditionalMarquee } from "./ConditionalMarquee";
import Image from "next/image";

type BoxTubeWithStatus = BoxTube & { status?: "pending" | "in progress" | "completed" };

function BoxTubeCard({
  boxtube,
  delay,
  onRequestCam,
  requesting,
}: {
  boxtube: BoxTubeWithStatus;
  delay: number;
  onRequestCam: (id: number) => void;
  requesting: boolean;
}) {
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
            <PrimaryButton id={styles.downloadboxtubebutton}>
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
        ) : (
          <SecondaryButton
            id={styles.requestcambutton}
            disabled={requesting}
            onClick={() => onRequestCam(boxtube.id)}
          >
            <span className="textGradient">CAM</span>
            {requesting ? <span className={styles.requestingDots}>...</span> : null}
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
          <PrimaryButton onClick={() => router.push("/dashboard/settings/newteam")}>
            <span className="textGradient">Create a Team</span>
          </PrimaryButton>
          <SecondaryButton onClick={() => router.push("/dashboard/settings/jointeam")}>
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
  const [machines, setMachines] = useState<Array<{ id: number; name: string }>>([]);
  const [tools, setTools] = useState<Array<{ id: number; machine_ids?: number[] }>>([]);
  const [requestingJob, setRequestingJob] = useState<Record<number, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    let mounted = true;
    const loadBoxTubes = async () => {
      if (team === null || team === undefined) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      const response = await fetch(`/api/teams/${team.id}/boxTubes`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        const data = await response.json();
        if (mounted) {
          const statusedData = (await Promise.all(
            data.map(async (bt: BoxTube) => {
              const status = await fetchJobStatus(bt.id);
              return { ...bt, status };
            })
          )).filter(Boolean) as BoxTubeWithStatus[];
          setBoxTubes(statusedData);
          console.log("Loaded box tubes:", data);
        }
      }
      if (mounted) {
        setIsLoading(false);
      }
    };
    loadBoxTubes();
    const interval = setInterval(() => {
      loadBoxTubes().catch(() => {});
    }, 5000);
    return () => {
      mounted = false;
      clearInterval(interval);
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
          setMachines((await mRes.json()) as Array<{ id: number; name: string }>);
        }
        if (tRes.ok) {
          setTools((await tRes.json()) as Array<{ id: number; machine_ids?: number[] }>);
        }
      } catch (err) {
        console.error("Failed to load machines/tools", err);
      }
    };
    loadMachinesAndTools();
  }, [team]);

  async function fetchJobStatus(boxTubeId: number): Promise<"pending" | "in progress" | "completed"> {
    try {
      const response = await fetch(`/api/boxTubes/${boxTubeId}/jobs`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) return "pending";
      const jobs = await response.json();
      if (!Array.isArray(jobs) || jobs.length === 0) return "pending";
      const allCompleted = jobs.every((job: { status?: string }) => job.status === "completed");
      return allCompleted ? "completed" : "in progress";
    } catch (err) {
      console.error("Failed to fetch jobs for box tube", boxTubeId, err);
      return "pending";
    }
  }

  function pickMachineAndTool() {
    if (machines.length === 0 || tools.length === 0) return null;
    const machineId = machines[0].id;
    const tool = tools.find((t) => !Array.isArray(t.machine_ids) || t.machine_ids.length === 0 || t.machine_ids.includes(machineId));
    if (!tool) return null;
    return { machineId, toolId: tool.id };
  }

  async function requestCamJob(boxTubeId: number) {
    if (!team) return;
    setError(null);
    const pick = pickMachineAndTool();
    if (!pick) {
      setError("No machine/tool configured. Add one in Settings → Fusion Inputs.");
      return;
    }
    setRequestingJob((prev) => ({ ...prev, [boxTubeId]: true }));
    try {
      const res = await fetch(`/api/boxTubes/${boxTubeId}/jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ machine_id: pick.machineId, tool_id: pick.toolId }),
      });
      if (!res.ok) {
        setError(await res.text());
        return;
      }
      const nextStatus = await fetchJobStatus(boxTubeId);
      setBoxTubes((prev) =>
        prev.map((bt) => (bt.id === boxTubeId ? { ...bt, status: nextStatus } : bt))
      );
    } catch (err) {
      console.error("Failed to request CAM job:", err);
      setError("Failed to request CAM job.");
    } finally {
      setRequestingJob((prev) => {
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
        <div className={styles.boxtubeslist}>
          {boxtubes.map((boxtube, index) => (
            <BoxTubeCard
              key={index}
              boxtube={boxtube}
              delay={index * 0.2 + 0.3}
              onRequestCam={requestCamJob}
              requesting={Boolean(requestingJob[boxtube.id])}
            />
          ))}
        </div>
      )}
    </>
  );
}
