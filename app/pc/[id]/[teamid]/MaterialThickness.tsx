"use client";
import styles from "./materialthickness.module.css";
import { Material, PartCategory, Part } from "@/app/types";
import AvailableParts from "./AvailableParts/AvailableParts";
import { Header } from "./header/header";
import PlatesToCreate from "./PlatesToCreate/PlatesToCreate";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useAnimate } from "framer-motion";
import { Unassigned } from "./PlateAssignment/Unassigned";
import { PartsToPlates } from "./PartsToPlates/PartsToPlates";
import { useRouter } from "next/navigation";
import { useMaterialEvents } from "./materialEvents";
import { authClient } from "@/lib/auth/client";

export default function MaterialThickness({
  pcid,
  teamid,
}: {
  pcid: string;
  teamid: string;
}) {
  const [scope, animate] = useAnimate();
  const [partcategory, setPartcategory] = useState<PartCategory | null>(null);
  const [teamMaterials, setTeamMaterials] = useState<Material[] | null>(null);
  const [teamTools, setTeamTools] = useState<{ id: number; name: string }[] | null>(
    null
  );
  const [isAdminOrOwner, setIsAdminOrOwner] = useState(false);
  const [isAddingMaterial, setIsAddingMaterial] = useState(false);
  const [addMaterialError, setAddMaterialError] = useState<string | null>(null);
  const warningRef = useRef<HTMLDivElement>(null);
  const [warningOffset, setWarningOffset] = useState(0);
  const [epicsMap, setEpicsMap] = useState<{ [key: string]: Part[] }>({});
  const router = useRouter();
  const {
    setParts,
    setPlates,
    plates,
    selectedParts,
    setSelectedParts,
    partsToPlates,
    setPartsToPlates,
    unassignedParts,
    setUnassignedParts,
  } = useMaterialEvents();

  useEffect(() => {
    if (!setPartsToPlates) return;
    setPartsToPlates((prev) => {
      let didChange = false;
      const next = { ...prev };
      for (const plate of plates) {
        if (next[plate.id] == null) {
          next[plate.id] = [];
          didChange = true;
        }
      }
      return didChange ? next : prev;
    });
  }, [plates, setPartsToPlates]);

  useEffect(() => {
    let mounted = true;
    async function fetchData() {
      const res = await fetch(`/api/teams/${teamid}/pc/`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      let data = await res.json();
      let found = false;
      for (const pc of data) {
        if (pc.id.toString() === pcid) {
          data = pc;
          found = true;
          break;
        }
      }
      if (found === false) {
        router.push("/404");
      }
      const response = await fetch(`/api/pc/${data.id}/parts`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const partsData = await response.json();
      if (!mounted) return;
      setParts(partsData);
      const selectedPartsInit: { [key: string]: number } = {};
      for (const part of partsData) {
        selectedPartsInit[part.id] = 0;
      }
      setSelectedParts(selectedPartsInit);
      setUnassignedParts(selectedPartsInit);
      data.parts = partsData;
      console.log("Fetched Part Category:", data);
      setPartcategory(data);
      const mappedEpics: { [key: string]: Part[] } = {};
      data.parts.forEach((part: Part) => {
        if (!mappedEpics[part.epic]) {
          mappedEpics[part.epic] = [];
        }
        mappedEpics[part.epic].push(part);
      });
      setEpicsMap(mappedEpics);
    }

    fetchData();
    return () => {
      mounted = false;
    };
  }, [pcid, router, setParts, setSelectedParts, setUnassignedParts, teamid]);

  useEffect(() => {
    if (!teamid) return;
    let mounted = true;

    async function loadTeamSettingsData() {
      try {
        const { data } = await authClient.getSession();
        const currentUserEmail = data?.user?.email ?? null;

        const [materialsRes, toolsRes, membersRes] = await Promise.all([
          fetch(`/api/teams/${teamid}/materials`),
          fetch(`/api/teams/${teamid}/tools`),
          currentUserEmail ? fetch(`/api/teams/${teamid}/members`) : null,
        ]);

        if (!mounted) return;

        if (materialsRes.ok) {
          setTeamMaterials((await materialsRes.json()) as Material[]);
        } else {
          setTeamMaterials(null);
        }

        if (toolsRes.ok) {
          setTeamTools((await toolsRes.json()) as { id: number; name: string }[]);
        } else {
          setTeamTools(null);
        }

        if (membersRes && membersRes.ok && currentUserEmail) {
          const members = (await membersRes.json()) as {
            email: string;
            admin: boolean;
            isOwner: boolean;
          }[];
          const me = members.find((m) => m.email === currentUserEmail);
          setIsAdminOrOwner(Boolean(me?.admin || me?.isOwner));
        } else {
          setIsAdminOrOwner(false);
        }
      } catch (error) {
        console.error("Error loading team settings data:", error);
        if (!mounted) return;
        setTeamMaterials(null);
        setTeamTools(null);
        setIsAdminOrOwner(false);
      }
    }

    loadTeamSettingsData();
    return () => {
      mounted = false;
    };
  }, [teamid]);

  const materialMissing =
    !!partcategory?.material &&
    teamMaterials !== null &&
    !teamMaterials.some((m) => m.name === partcategory.material);

  const toolsMissing = teamTools !== null && teamTools.length === 0;

  const showWarnings = materialMissing || toolsMissing;
  const headerTopOffset = showWarnings ? warningOffset : 0;

  useLayoutEffect(() => {
    if (!showWarnings) {
      setWarningOffset(0);
      return;
    }
    setWarningOffset(warningRef.current?.offsetHeight ?? 0);
  }, [showWarnings, materialMissing, toolsMissing, isAdminOrOwner, addMaterialError, isAddingMaterial]);

  async function goToTeamSettings(tab: "Machines" | "Materials" | "Tools") {
    try {
      const teamsResponse = await fetch("/api/teams");
      if (!teamsResponse.ok) {
        router.push("/dashboard/settings/personal");
        return;
      }
      const teamsData = (await teamsResponse.json()) as { id: number }[];
      teamsData.sort((a, b) => a.id - b.id);
      const teamIndex = teamsData.findIndex(
        (t) => t.id === Number.parseInt(teamid, 10)
      );
      router.push(
        `/dashboard/settings/teams/${teamIndex >= 0 ? teamIndex : 0}?tab=${encodeURIComponent(
          tab
        )}`
      );
    } catch (error) {
      console.error("Error navigating to team settings:", error);
      router.push("/dashboard/settings/personal");
    }
  }

  async function addMissingMaterialAndGo() {
    if (!isAdminOrOwner || !partcategory?.material) return;
    setAddMaterialError(null);
    setIsAddingMaterial(true);
    try {
      const response = await fetch(`/api/teams/${teamid}/materials`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: partcategory.material }),
      });

      if (!response.ok && response.status !== 409) {
        const message = await response.text();
        setAddMaterialError(message || "Failed to add material");
        return;
      }

      await goToTeamSettings("Materials");
    } catch (error) {
      console.error("Error adding missing material:", error);
      setAddMaterialError("Failed to add material");
    } finally {
      setIsAddingMaterial(false);
    }
  }
  const totalSelectedParts = Object.values(selectedParts).reduce(
    (total, quantity) => total + quantity,
    0
  );
  const sorting = plates.length > 0 && totalSelectedParts > 0;

  useEffect(() => {
    animate(
      scope.current,
      { height: sorting ? "calc(50vh - 180px)" : "calc(100vh - 180px)" },
      { duration: 0.5 }
    );
  }, [animate, scope, sorting]);
  return (
    <div className={styles.container}>
      {showWarnings ? (
        <div ref={warningRef} className={styles.warningStack}>
          {materialMissing ? (
            <div className={styles.warningBox}>
              <div className={styles.warningText}>
                {isAdminOrOwner ? (
                  <>
                    There is no material in Team Settings matching{" "}
                    <span className={styles.warningEmphasis}>
                      {partcategory?.material}
                    </span>
                    .
                  </>
                ) : (
                  <>
                    This material doesn’t exist in Team Settings. Please contact
                    an admin to adjust this.
                  </>
                )}
                {addMaterialError ? (
                  <div className={styles.warningError}>{addMaterialError}</div>
                ) : null}
              </div>
              {isAdminOrOwner ? (
                <button
                  className={styles.warningButton}
                  onClick={addMissingMaterialAndGo}
                  disabled={isAddingMaterial}
                >
                  {isAddingMaterial ? "Adding..." : "Add to settings"}
                </button>
              ) : null}
            </div>
          ) : null}

          {toolsMissing ? (
            <div className={styles.warningBox}>
              <div className={styles.warningText}>
                {isAdminOrOwner ? (
                  <>There are no tools set up in Team Settings for this team.</>
                ) : (
                  <>
                    No tools are set up in Team Settings. Please contact an
                    admin to adjust this.
                  </>
                )}
              </div>
              {isAdminOrOwner ? (
                <button
                  className={styles.warningButton}
                  onClick={() => goToTeamSettings("Tools")}
                >
                  Add tools
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
      <Header
        material={partcategory?.material}
        thickness={partcategory?.thickness}
        topOffset={headerTopOffset}
      />
      <div className={styles.contentData} ref={scope}>
        <AvailableParts epicsMap={epicsMap} />
        <PlatesToCreate
          plates={plates}
          setPlates={setPlates}
          categoryId={partcategory !== null ? partcategory.id : 0}
        />
      </div>
      {sorting ? (
        <div className={styles.contentSorting}>
          <Unassigned />
          <PartsToPlates categoryId={partcategory !== null ? partcategory.id : 0} />
        </div>
      ) : null}
    </div>
  );
}
