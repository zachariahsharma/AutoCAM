"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo } from "react";
import { createPortal } from "react-dom";

export function ModalPortal({
  children,
}: {
  children: ReactNode;
}) {
  const portalElement = useMemo(() => {
    if (typeof document === "undefined") return null;
    const element = document.createElement("div");
    document.body.appendChild(element);
    return element;
  }, []);

  useEffect(() => {
    return () => {
      if (portalElement && document.body.contains(portalElement)) {
        document.body.removeChild(portalElement);
      }
    };
  }, [portalElement]);

  if (!portalElement) {
    return null;
  }

  return createPortal(children, portalElement);
}
