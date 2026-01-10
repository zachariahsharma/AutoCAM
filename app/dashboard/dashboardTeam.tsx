"use client";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Team } from "@/app/types";
import { authClient } from "@/lib/auth/client";

type TabEvents = {
  team: Team | null;
  setTeam: React.Dispatch<React.SetStateAction<Team | null>>;
  emailVerified: boolean;
  isLoadingAuth: boolean;
  userId: string | null;
  userEmail: string | null;
  sessionExpiresAt: string | null;
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
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [sessionExpiresAt, setSessionExpiresAt] = useState<string | null>(null);

  useEffect(() => {
    async function checkEmailVerification() {
      try {
        const { data } = await authClient.getSession();
        if (data?.user) {
          setEmailVerified(data.user.emailVerified ?? false);
          setUserId(data.user.id ?? null);
          setUserEmail(data.user.email ?? null);
          const expiresAt = (data as unknown as { session?: { expiresAt?: unknown } })
            ?.session?.expiresAt;
          if (expiresAt instanceof Date) setSessionExpiresAt(expiresAt.toISOString());
          else if (typeof expiresAt === "string") setSessionExpiresAt(expiresAt);
          else if (typeof expiresAt === "number") setSessionExpiresAt(new Date(expiresAt).toISOString());
          else setSessionExpiresAt(null);
        } else {
          setUserId(null);
          setUserEmail(null);
          setSessionExpiresAt(null);
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
      userId,
      userEmail,
      sessionExpiresAt,
    }),
    [team, emailVerified, isLoadingAuth, userId, userEmail, sessionExpiresAt]
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
