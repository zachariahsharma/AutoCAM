"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export function ModalPortal({
  children,
}: {
  children: ReactNode;
}) {
  const [element, setElement] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    setElement(container);
    return () => {
      if (document.body.contains(container)) {
        document.body.removeChild(container);
      }
    };
  }, []);

  if (!element) {
    return null;
  }

  return createPortal(children, element);
}
