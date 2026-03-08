"use client";

import { useEffect } from "react";

const SUPPRESSED_PATTERNS = [
  "Lock broken by another request",
  "AbortError",
  "The operation was aborted",
  "signal is aborted without reason",
];

function shouldSuppress(msg: string): boolean {
  return SUPPRESSED_PATTERNS.some((p) => msg.includes(p));
}

export function ErrorSuppressor() {
  useEffect(() => {
    const onError = (e: ErrorEvent) => {
      if (shouldSuppress(e.message ?? "")) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    };

    const onRejection = (e: PromiseRejectionEvent) => {
      const msg =
        e.reason instanceof Error
          ? e.reason.message
          : typeof e.reason === "string"
            ? e.reason
            : "";
      if (shouldSuppress(msg)) {
        e.preventDefault();
      }
    };

    window.addEventListener("error", onError, { capture: true });
    window.addEventListener("unhandledrejection", onRejection, { capture: true });

    return () => {
      window.removeEventListener("error", onError, { capture: true });
      window.removeEventListener("unhandledrejection", onRejection, { capture: true });
    };
  }, []);

  return null;
}
