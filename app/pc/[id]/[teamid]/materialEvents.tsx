"use client";
import React, { createContext, useContext, useMemo, useState } from "react";
import type { Plate, Part } from "@/app/types";

type materialEvents = {
  plates: Plate[];
  setPlates: React.Dispatch<React.SetStateAction<Plate[]>>;
  selectedParts: { [key: number]: number };
  setSelectedParts: React.Dispatch<
    React.SetStateAction<{ [key: number]: number }>
  >;
  parts: Part[];
  setParts: React.Dispatch<React.SetStateAction<Part[]>>;
};

const Ctx = createContext<materialEvents | null>(null);

export function MaterialEventsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [plates, setPlates] = useState<Plate[]>([]);
  const [selectedParts, setSelectedParts] = useState<{ [key: number]: number }>(
    {}
  );
  const [parts, setParts] = useState<Part[]>([]);

  const value = useMemo(
    () => ({
      plates,
      setPlates,
      selectedParts,
      setSelectedParts,
      parts,
      setParts,
    }),
    [plates, selectedParts, parts]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useMaterialEvents() {
  const v = useContext(Ctx);
  if (!v)
    throw new Error(
      "useMaterialEvents must be used inside materialEventsProvider"
    );
  return v;
}
