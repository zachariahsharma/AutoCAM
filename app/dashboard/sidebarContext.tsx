"use client";

import { createContext, useContext, useState, useEffect, useLayoutEffect, ReactNode } from "react";

interface SidebarContextType {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
  toggleSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

const EXPANDED_WIDTH = "220px";
const COLLAPSED_WIDTH = "60px";
const MOBILE_BREAKPOINT = 768; // Tablet and below

// Check if we should start collapsed (mobile/tablet)
function getInitialCollapsed(): boolean {
  if (typeof window === "undefined") return false;
  return window.innerWidth <= MOBILE_BREAKPOINT;
}

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(getInitialCollapsed);

  // Set CSS variable immediately on mount and when collapsed changes
  useLayoutEffect(() => {
    document.documentElement.style.setProperty(
      "--sidebar-width",
      isCollapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH
    );
  }, [isCollapsed]);

  // Listen for resize to auto-collapse on mobile
  useEffect(() => {
    function handleResize() {
      if (window.innerWidth <= MOBILE_BREAKPOINT) {
        setIsCollapsed(true);
      }
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebar = () => setIsCollapsed((prev) => !prev);

  return (
    <SidebarContext.Provider value={{ isCollapsed, setIsCollapsed, toggleSidebar }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}
