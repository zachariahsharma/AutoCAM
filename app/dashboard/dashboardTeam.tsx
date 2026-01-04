"use client";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Team } from "@/app/types";
import { authClient } from "@/lib/auth/client";

type TabEvents = {
  team: Team | null;
  setTeam: React.Dispatch<React.SetStateAction<Team | null>>;
  emailVerified: boolean;
  isLoadingAuth: boolean;
};

const Ctx = createContext<TabEvents | null>(null);

export function DashboardEventsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [team, setTeam] = useState<Team | null>(null);
  const [emailVerified, setEmailVerified] = useState(true); // Default to true to avoid flash
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  useEffect(() => {
    async function checkEmailVerification() {
      try {
        const { data } = await authClient.getSession();
        if (data?.user) {
          setEmailVerified(data.user.emailVerified ?? false);
        }
      } catch (err) {
        console.error("Error checking email verification:", err);
      } finally {
        setIsLoadingAuth(false);
      }
    }
    checkEmailVerification();
  }, []);

  const value = useMemo(
    () => ({
      team,
      setTeam,
      emailVerified,
      isLoadingAuth,
    }),
    [team, emailVerified, isLoadingAuth]
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
