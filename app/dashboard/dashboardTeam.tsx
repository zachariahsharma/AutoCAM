"use client";
import React, { createContext, useContext, useMemo, useState } from "react";
import type { Team } from "@/app/types";

type TabEvents = {
  team: Team | null;
  setTeam: React.Dispatch<React.SetStateAction<Team | null>>;
};

const Ctx = createContext<TabEvents | null>(null);

export function DashboardEventsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [team, setTeam] = useState<Team | null>(null);

  const value = useMemo(
    () => ({
      team,
      setTeam,
    }),
    [team]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDashboardEvents() {
  const v = useContext(Ctx);
  if (!v)
    throw new Error(
      "useDashboardEvents must be used inside DashboardEventsProvider"
    );
  return v;
}
