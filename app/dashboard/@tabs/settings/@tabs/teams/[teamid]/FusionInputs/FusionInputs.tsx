import { Material, Machine, Tool } from "@/app/types";
import styles from "./fusioninputs.module.css";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

function Machines({ oldMachines }: { oldMachines: Machine[] }) {
  const [machines, setMachines] = useState<Machine[]>(oldMachines);
  const [machineName, setMachineName] = useState(
    machines.map((machine) => machine.name)
  );
  return (
    <main id={styles.machinesContainer}>
      <div
        id={styles.addMachineContainer}
        onClick={() => {
          const newMachine: Machine = {
            id: machines.length + 1,
            name: "",
            file: "No file selected",
          };
          setMachines((prev) => [...prev, newMachine]);
          setMachineName((prev) => [...prev, ""]);
        }}
      >
        <Image
          src="/settings/teams/Plus.svg"
          width={2000}
          height={2000}
          alt="logo"
          className={styles.addIcon}
        />
      </div>
      {machines.map((machine, index) => (
        <div key={index} className={styles.machineContainer}>
          <input
            type="text"
            value={machineName[index]}
            placeholder="Name"
            onChange={(e) =>
              setMachineName((prev) => {
                const newNames = [...prev];
                newNames[index] = e.target.value;
                return newNames;
              })
            }
          />
          <span id={styles.machineVertical} />
          <span>{machine.file}</span>
          <Image
            alt="Trash"
            src="/settings/teams/Trash.svg"
            width={2000}
            height={2000}
            onClick={() =>
              setMachines((prev) => prev.filter((t) => t.id !== machine.id))
            }
            className={styles.trashIcon}
          />
        </div>
      ))}
    </main>
  );
}

function Materials({ teamId }: { teamId: number }) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingUpdates, setPendingUpdates] = useState<Record<number, NodeJS.Timeout>>({});

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
  tools,
  setTools,
  tool,
  totalMaterials,
  totalMachines,
}: {
  tool: Tool;
  setTools: React.Dispatch<React.SetStateAction<Tool[]>>;
  tools: Tool[];
  totalMaterials: Material[];
  totalMachines: Machine[];
}) {
  const [machines, setMachines] = useState<Machine[]>(tool.machines);
  const [dropdownMaterialsEnabled, setDropdownMaterialsEnabled] =
    useState<boolean>(false);
  const [dropdownMachinesEnabled, setDropdownMachinesEnabled] =
    useState<boolean>(false);
  const [materials, setMaterials] = useState<Material[]>(tool.materials);
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
          const newTools = tools.map((t: Tool) => {
            if (t.id === tool.id) {
              return { ...t, name: e.target.value };
            }
            return t;
          });
          setTools(newTools);
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
                            setMaterials((prev) => {
                              const exists = prev.some(
                                (m) => m.id === material.id
                              );

                              return exists
                                ? prev.filter((m) => m.id !== material.id)
                                : [...prev, material];
                            });
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
                            setMachines((prev) => {
                              const exists = prev.some(
                                (m) => m.id === machine.id
                              );

                              return exists
                                ? prev.filter((m) => m.id !== machine.id)
                                : [...prev, machine];
                            });
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
        <span>{tool.file}</span>
      </div>
      <Image
        alt="Trash"
        src="/settings/teams/Trash.svg"
        width={2000}
        height={2000}
        onClick={() => setTools((prev) => prev.filter((t) => t.id !== tool.id))}
        className={styles.trashIcon}
      />
    </div>
  );
}

function Tools({
  oldTools,
  totalMaterials,
  totalMachines,
}: {
  oldTools: Tool[];
  totalMaterials: Material[];
  totalMachines: Machine[];
}) {
  const [tools, setTools] = useState<Tool[]>(oldTools);
  return (
    <main id={styles.toolsContainer}>
      <div
        id={styles.addMachineContainer}
        onClick={() => {
          const newTool: Tool = {
            id: tools.length + 1,
            name: "",
            materials: [],
            machines: [],
            file: "No file selected",
          };
          setTools((prev) => [...prev, newTool]);
        }}
      >
        <Image
          src="/settings/teams/Plus.svg"
          width={2000}
          height={2000}
          alt="logo"
          className={styles.addIcon}
        />
      </div>
      {tools.map((tool) => (
        <ToolItem
          key={tool.id}
          tool={tool}
          tools={tools}
          setTools={setTools}
          totalMaterials={totalMaterials}
          totalMachines={totalMachines}
        />
      ))}
    </main>
  );
}

export default function FusionInputs({
  defaultMachines,
  defaultMaterials,
  defaultTools,
  teamId,
}: {
  defaultMachines: Machine[];
  defaultMaterials: Material[];
  defaultTools: Tool[];
  teamId: number;
}) {
  const [selectedTab, setSelectedTab] = useState<string>("Machines");
  return (
    <form>
      <label>Machines, Tools & Materials</label>
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
          {selectedTab === "Machines" && (
            <Machines oldMachines={defaultMachines} />
          )}
          {selectedTab === "Materials" && (
            <Materials teamId={teamId} />
          )}
          {selectedTab === "Tools" && (
            <Tools
              oldTools={defaultTools}
              totalMaterials={defaultMaterials}
              totalMachines={defaultMachines}
            />
          )}
        </div>
        <span id={styles.verticalrule} />
      </div>
    </form>
  );
}
