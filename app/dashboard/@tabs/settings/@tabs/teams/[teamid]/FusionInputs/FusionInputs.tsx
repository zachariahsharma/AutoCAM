import { Material, Machine, Tool } from "@/app/types";
import styles from "./fusioninputs.module.css";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import FileUploadModal from "@/components/FileUploadModal/FileUploadModal";
import { useSearchParams } from "next/navigation";

function Machines({ teamId }: { teamId: number }) {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingUpdates, setPendingUpdates] = useState<
    Record<number, NodeJS.Timeout>
  >({});

  // Load machines from API
  useEffect(() => {
    if (!teamId) return;
    let mounted = true;
    setIsLoading(true);
    async function loadMachines() {
      try {
        const response = await fetch(`/api/teams/${teamId}/machines`);
        if (response.ok) {
          const data = await response.json();
          if (mounted) {
            setMachines(data);
          }
        }
      } catch (error) {
        console.error("Error loading machines:", error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }
    loadMachines();
    return () => {
      mounted = false;
    };
  }, [teamId]);

  // Cleanup pending timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(pendingUpdates).forEach(clearTimeout);
    };
  }, [pendingUpdates]);

  const handleAddMachine = async (name: string, file: File) => {
    if (!teamId) return;
    try {
      const formData = new FormData();
      formData.append("data", JSON.stringify({ name }));
      formData.append("file", file);

      const response = await fetch(`/api/teams/${teamId}/machines`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const { id } = await response.json();
        setMachines((prev) => [...prev, { id, name, file: file.name }]);
      }
    } catch (error) {
      console.error("Error adding machine:", error);
    }
  };

  function updateMachineLocal(machineId: number, name: string) {
    setMachines((prev) =>
      prev.map((m) => (m.id === machineId ? { ...m, name } : m))
    );

    // Debounce the API call
    if (pendingUpdates[machineId]) {
      clearTimeout(pendingUpdates[machineId]);
    }

    const timeout = setTimeout(() => {
      updateMachineApi(machineId, name);
      setPendingUpdates((prev) => {
        const { [machineId]: _, ...rest } = prev;
        return rest;
      });
    }, 500);

    setPendingUpdates((prev) => ({ ...prev, [machineId]: timeout }));
  }

  async function updateMachineApi(machineId: number, name: string) {
    try {
      await fetch(`/api/machines/${machineId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
    } catch (error) {
      console.error("Error updating machine:", error);
    }
  }

  async function deleteMachine(machineId: number) {
    try {
      const response = await fetch(`/api/machines/${machineId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setMachines((prev) => prev.filter((m) => m.id !== machineId));
      }
    } catch (error) {
      console.error("Error deleting machine:", error);
    }
  }

  return (
    <main id={styles.machinesContainer}>
      <FileUploadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddMachine}
        title="Add Machine"
        acceptedFileType=".cps"
        fileTypeLabel="CPS"
      />
      <div id={styles.addMachineContainer} onClick={() => setIsModalOpen(true)}>
        <Image
          src="/settings/teams/Plus.svg"
          width={2000}
          height={2000}
          alt="logo"
          className={styles.addIcon}
        />
      </div>
      {isLoading ? (
        <div className={styles.loadingContainer}>
          <span className={styles.loadingSpinner} />
        </div>
      ) : machines.length === 0 ? (
        <div className={styles.emptyState}>Add a machine to get started</div>
      ) : (
        machines.map((machine) => (
          <div key={machine.id} className={styles.machineContainer}>
            <input
              type="text"
              value={machine.name}
              placeholder="Name"
              id={styles.machineInput}
              onChange={(e) => updateMachineLocal(machine.id, e.target.value)}
            />
            <Image
              alt="Trash"
              src="/settings/teams/Trash.svg"
              width={2000}
              height={2000}
              onClick={() => deleteMachine(machine.id)}
              className={styles.trashIcon}
            />
          </div>
        ))
      )}
    </main>
  );
}

function Materials({ teamId }: { teamId: number }) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingUpdates, setPendingUpdates] = useState<
    Record<number, NodeJS.Timeout>
  >({});

  // Load materials from API
  useEffect(() => {
    if (!teamId) return;
    let mounted = true;
    setIsLoading(true);
    async function loadMaterials() {
      try {
        const response = await fetch(`/api/teams/${teamId}/materials`);
        if (response.ok) {
          const data = await response.json();
          if (mounted) {
            setMaterials(data);
          }
        }
      } catch (error) {
        console.error("Error loading materials:", error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }
    loadMaterials();
    return () => {
      mounted = false;
    };
  }, [teamId]);

  // Cleanup pending timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(pendingUpdates).forEach(clearTimeout);
    };
  }, [pendingUpdates]);

  async function addMaterial() {
    if (!teamId) return;
    try {
      const response = await fetch(`/api/teams/${teamId}/materials`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "" }),
      });
      if (response.ok) {
        const { id } = await response.json();
        setMaterials((prev) => [...prev, { id, name: "" }]);
      }
    } catch (error) {
      console.error("Error adding material:", error);
    }
  }

  function updateMaterialLocal(materialId: number, name: string) {
    setMaterials((prev) =>
      prev.map((m) => (m.id === materialId ? { ...m, name } : m))
    );

    // Debounce the API call
    if (pendingUpdates[materialId]) {
      clearTimeout(pendingUpdates[materialId]);
    }

    const timeout = setTimeout(() => {
      updateMaterialApi(materialId, name);
      setPendingUpdates((prev) => {
        const { [materialId]: _, ...rest } = prev;
        return rest;
      });
    }, 500);

    setPendingUpdates((prev) => ({ ...prev, [materialId]: timeout }));
  }

  async function updateMaterialApi(materialId: number, name: string) {
    try {
      await fetch(`/api/materials/${materialId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
    } catch (error) {
      console.error("Error updating material:", error);
    }
  }

  async function deleteMaterial(materialId: number) {
    try {
      const response = await fetch(`/api/materials/${materialId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setMaterials((prev) => prev.filter((m) => m.id !== materialId));
      }
    } catch (error) {
      console.error("Error deleting material:", error);
    }
  }

  return (
    <main id={styles.materialsContainer}>
      <div id={styles.addMachineContainer} onClick={addMaterial}>
        <Image
          src="/settings/teams/Plus.svg"
          width={2000}
          height={2000}
          alt="logo"
          className={styles.addIcon}
        />
      </div>
      {isLoading ? (
        <div className={styles.loadingContainer}>
          <span className={styles.loadingSpinner} />
        </div>
      ) : materials.length === 0 ? (
        <div className={styles.emptyState}>Add a material to get started</div>
      ) : (
        materials.map((material) => (
          <div key={material.id} className={styles.machineContainer}>
            <input
              type="text"
              value={material.name}
              placeholder="Name"
              id={styles.materialInput}
              onChange={(e) => updateMaterialLocal(material.id, e.target.value)}
            />
            <Image
              alt="Trash"
              src="/settings/teams/Trash.svg"
              width={2000}
              height={2000}
              onClick={() => deleteMaterial(material.id)}
              className={styles.trashIcon}
            />
          </div>
        ))
      )}
    </main>
  );
}

function ToolItem({
  setTools,
  tool,
  totalMaterials,
  totalMachines,
  onDeleteTool,
  onUpdateToolName,
}: {
  tool: Tool;
  setTools: React.Dispatch<React.SetStateAction<Tool[]>>;
  totalMaterials: Material[];
  totalMachines: Machine[];
  onDeleteTool: (toolId: number) => void;
  onUpdateToolName: (toolId: number, name: string) => void;
}) {
  const [dropdownMaterialsEnabled, setDropdownMaterialsEnabled] =
    useState<boolean>(false);
  const [dropdownMachinesEnabled, setDropdownMachinesEnabled] =
    useState<boolean>(false);
  const materials = tool.materials;
  const machines = tool.machines;
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownMaterialsRef.current &&
        !dropdownMaterialsRef.current.contains(e.target as Node)
      ) {
        if (dropdownMaterialsBlurRef.current) {
          dropdownMaterialsBlurRef.current.style.opacity = "0";
        }
        setDropdownMaterialsEnabled(false);
      } else if (
        dropdownMachinesRef.current &&
        !dropdownMachinesRef.current.contains(e.target as Node)
      ) {
        if (dropdownMachinesBlurRef.current) {
          dropdownMachinesBlurRef.current.style.opacity = "0";
        }
        setDropdownMachinesEnabled(false);
      }
    }

    if (dropdownMaterialsEnabled || dropdownMachinesEnabled) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownMaterialsEnabled, dropdownMachinesEnabled]);
  const dropdownMaterialsRef = useRef<HTMLDivElement>(null);
  const dropdownMaterialsBlurRef = useRef<HTMLSpanElement>(null);
  const dropdownMachinesRef = useRef<HTMLDivElement>(null);
  const dropdownMachinesBlurRef = useRef<HTMLSpanElement>(null);
  return (
    <div className={styles.machineContainer}>
      <input
        type="text"
        value={tool.name}
        placeholder="Name"
        id={styles.toolInput}
        onChange={(e) => {
          onUpdateToolName(tool.id, e.target.value);
        }}
      />
      <div className={styles.materialDropdown}>
        <div className={styles.materialDropdownHeader}>
          <div className={styles.materialDropdownSelected}>
            {materials.slice(0, 2).map((material) => (
              <div key={material.id}>
                <div className={styles.specificName}>{material.name}</div>
              </div>
            ))}
            {materials.length > 2 && <span>...</span>}
          </div>
          <Image
            src="/settings/teams/Dropdown.svg"
            width={2000}
            height={2000}
            alt="logo"
            onClick={() => {
              setDropdownMaterialsEnabled((prev) => !prev);
            }}
            className={styles.dropdownIcon}
          />
          <AnimatePresence>
            {dropdownMaterialsEnabled && (
              <div ref={dropdownMaterialsRef}>
                <span
                  className={styles.dropdownBlur}
                  ref={dropdownMaterialsBlurRef}
                />
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={styles.materialDropdownList}
                >
                  {totalMaterials.map((material) => (
                    <div key={material.id} className={styles.dropdownItem}>
                      <label className={styles.checkbox}>
                        <input
                          type="checkbox"
                          checked={materials.some((m) => m.id === material.id)}
                          onChange={() => {
                            setTools((prev) =>
                              prev.map((t) => {
                                if (t.id !== tool.id) return t;
                                const exists = t.materials.some(
                                  (m) => m.id === material.id
                                );
                                return {
                                  ...t,
                                  materials: exists
                                    ? t.materials.filter(
                                        (m) => m.id !== material.id
                                      )
                                    : [...t.materials, material],
                                };
                              })
                            );
                          }}
                        />
                        <span className={styles.checkboxBox}>
                          <Image
                            src="/settings/teams/X.svg"
                            width={2000}
                            height={2000}
                            alt="logo"
                            className={styles.checkboxIcon}
                          />
                        </span>
                      </label>
                      <span className={styles.specificName}>
                        {material.name}
                      </span>
                    </div>
                  ))}
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <div className={styles.machineDropdown}>
        <div className={styles.machineDropdownHeader}>
          <div className={styles.machineDropdownSelected}>
            {machines.slice(0, 2).map((machine) => (
              <div key={machine.id}>
                <div className={styles.specificName}>{machine.name}</div>
              </div>
            ))}
            {machines.length > 2 && <span>...</span>}
          </div>
          <Image
            src="/settings/teams/Dropdown.svg"
            width={2000}
            height={2000}
            alt="logo"
            onClick={() => {
              setDropdownMachinesEnabled((prev) => !prev);
            }}
            className={styles.dropdownIcon}
          />
          <AnimatePresence>
            {dropdownMachinesEnabled && (
              <div ref={dropdownMachinesRef}>
                <span
                  className={styles.dropdownBlur}
                  ref={dropdownMachinesBlurRef}
                />
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={styles.machineDropdownList}
                >
                  {totalMachines.map((machine) => (
                    <div key={machine.id} className={styles.dropdownItem}>
                      <label className={styles.checkbox}>
                        <input
                          type="checkbox"
                          checked={machines.some((m) => m.id === machine.id)}
                          onChange={() => {
                            setTools((prev) =>
                              prev.map((t) => {
                                if (t.id !== tool.id) return t;
                                const exists = t.machines.some(
                                  (m) => m.id === machine.id
                                );
                                return {
                                  ...t,
                                  machines: exists
                                    ? t.machines.filter(
                                        (m) => m.id !== machine.id
                                      )
                                    : [...t.machines, machine],
                                };
                              })
                            );
                          }}
                        />
                        <span className={styles.checkboxBox}>
                          <Image
                            src="/settings/teams/X.svg"
                            width={2000}
                            height={2000}
                            alt="logo"
                            className={styles.checkboxIcon}
                          />
                        </span>
                      </label>
                      <span className={styles.specificName}>
                        {machine.name}
                      </span>
                    </div>
                  ))}
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <div className={styles.fileName}>
        <span>{tool.file || "Uploaded"}</span>
      </div>
      <Image
        alt="Trash"
        src="/settings/teams/Trash.svg"
        width={2000}
        height={2000}
        onClick={() => onDeleteTool(tool.id)}
        className={styles.trashIcon}
      />
    </div>
  );
}

function Tools({ teamId }: { teamId: number }) {
  const [tools, setTools] = useState<Tool[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingUpdates, setPendingUpdates] = useState<
    Record<number, NodeJS.Timeout>
  >({});
  const [totalMaterials, setTotalMaterials] = useState<Material[]>([]);
  const [totalMachines, setTotalMachines] = useState<Machine[]>([]);

  // Load tools/materials/machines from API
  useEffect(() => {
    if (!teamId) return;
    let mounted = true;
    setIsLoading(true);

    async function loadAll() {
      try {
        const [toolsRes, materialsRes, machinesRes] = await Promise.all([
          fetch(`/api/teams/${teamId}/tools`),
          fetch(`/api/teams/${teamId}/materials`),
          fetch(`/api/teams/${teamId}/machines`),
        ]);

        if (!mounted) return;

        if (materialsRes.ok) {
          const materials = (await materialsRes.json()) as Material[];
          setTotalMaterials(materials);
        } else {
          setTotalMaterials([]);
        }

        if (machinesRes.ok) {
          const machines = (await machinesRes.json()) as Partial<Machine>[];
          setTotalMachines(
            machines.map((m) => ({
              id: m.id as number,
              name: m.name as string,
              file: typeof m.file === "string" ? m.file : "",
            }))
          );
        } else {
          setTotalMachines([]);
        }

        if (toolsRes.ok) {
          const tools = (await toolsRes.json()) as { id: number; name: string }[];
          setTools(
            tools.map((t) => ({
              id: t.id,
              name: t.name,
              materials: [],
              machines: [],
              file: "",
            }))
          );
        } else {
          setTools([]);
        }
      } catch (error) {
        console.error("Error loading tools:", error);
        if (!mounted) return;
        setTools([]);
        setTotalMaterials([]);
        setTotalMachines([]);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    loadAll();
    return () => {
      mounted = false;
    };
  }, [teamId]);

  // Cleanup pending timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(pendingUpdates).forEach(clearTimeout);
    };
  }, [pendingUpdates]);

  const handleAddTool = async (name: string, file: File) => {
    if (!teamId) return;
    try {
      const formData = new FormData();
      formData.append("data", JSON.stringify({ name }));
      formData.append("file", file);

      const response = await fetch(`/api/teams/${teamId}/tools`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        console.error("Failed to add tool:", await response.text());
        return;
      }

      const { id } = (await response.json()) as { id: number };
      setTools((prev) => [
        ...prev,
        { id, name, materials: [], machines: [], file: file.name },
      ]);
    } catch (error) {
      console.error("Error adding tool:", error);
    }
  };

  function updateToolNameLocal(toolId: number, name: string) {
    setTools((prev) =>
      prev.map((t) => (t.id === toolId ? { ...t, name } : t))
    );

    if (pendingUpdates[toolId]) {
      clearTimeout(pendingUpdates[toolId]);
    }

    const timeout = setTimeout(() => {
      updateToolNameApi(toolId, name);
      setPendingUpdates((prev) => {
        const { [toolId]: _, ...rest } = prev;
        return rest;
      });
    }, 500);

    setPendingUpdates((prev) => ({ ...prev, [toolId]: timeout }));
  }

  async function updateToolNameApi(toolId: number, name: string) {
    try {
      const response = await fetch(`/api/tools/${toolId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!response.ok) {
        console.error("Failed to update tool:", await response.text());
      }
    } catch (error) {
      console.error("Error updating tool:", error);
    }
  }

  async function deleteTool(toolId: number) {
    try {
      const response = await fetch(`/api/tools/${toolId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setTools((prev) => prev.filter((t) => t.id !== toolId));
      } else {
        console.error("Failed to delete tool:", await response.text());
      }
    } catch (error) {
      console.error("Error deleting tool:", error);
    }
  }

  return (
    <main id={styles.toolsContainer}>
      <FileUploadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddTool}
        title="Add Tool"
        acceptedFileType=".json"
        fileTypeLabel="JSON"
      />
      <div id={styles.addMachineContainer} onClick={() => setIsModalOpen(true)}>
        <Image
          src="/settings/teams/Plus.svg"
          width={2000}
          height={2000}
          alt="logo"
          className={styles.addIcon}
        />
      </div>
      {isLoading ? (
        <div className={styles.loadingContainer}>
          <span className={styles.loadingSpinner} />
        </div>
      ) : tools.length === 0 ? (
        <div className={styles.emptyState}>Add a tool to get started</div>
      ) : (
        tools.map((tool) => (
          <ToolItem
            key={tool.id}
            tool={tool}
            setTools={setTools}
            totalMaterials={totalMaterials}
            totalMachines={totalMachines}
            onDeleteTool={deleteTool}
            onUpdateToolName={updateToolNameLocal}
          />
        ))
      )}
    </main>
  );
}

export default function FusionInputs({ teamId }: { teamId: number }) {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab")?.toLowerCase();
  const initialTab =
    tabParam === "materials"
      ? "Materials"
      : tabParam === "tools"
        ? "Tools"
        : "Machines";

  const [selectedTab, setSelectedTab] = useState<string>(initialTab);

  useEffect(() => {
    setSelectedTab(initialTab);
  }, [initialTab]);
  return (
    <form>
      <label className={styles.sectionLabel}>Machines, Tools & Materials</label>
      <div id={styles.container}>
        <div id={styles.sidebar}>
          <div
            onClick={() => setSelectedTab("Machines")}
            className={selectedTab === "Machines" ? styles.active : ""}
          >
            <img
              src="/settings/teams/machines.png"
              width={2000}
              height={2000}
              alt="logo"
              className={styles.sidebarLogo}
            />
            <span>Machines</span>
          </div>
          <div
            onClick={() => setSelectedTab("Materials")}
            className={selectedTab === "Materials" ? styles.active : ""}
          >
            <Image
              src="/settings/teams/materials.svg"
              width={2000}
              height={2000}
              alt="logo"
              className={styles.sidebarLogo}
            />
            <span>Materials</span>
          </div>
          <div
            onClick={() => setSelectedTab("Tools")}
            className={selectedTab === "Tools" ? styles.active : ""}
          >
            <Image
              src="/settings/teams/tools.svg"
              width={2000}
              height={2000}
              alt="logo"
              className={styles.sidebarLogo}
            />
            <span>Tools</span>
          </div>
        </div>
        <div id={styles.inputsContainer}>
          {selectedTab === "Machines" && <Machines teamId={teamId} />}
          {selectedTab === "Materials" && <Materials teamId={teamId} />}
          {selectedTab === "Tools" && <Tools teamId={teamId} />}
        </div>
        <span id={styles.verticalrule} />
      </div>
    </form>
  );
}
