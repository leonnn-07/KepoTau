"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";

async function writeClipboard(text: string) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }
  // Fallback for older mobile browsers.
  const el = document.createElement("textarea");
  el.value = text;
  el.setAttribute("readonly", "");
  el.style.position = "fixed";
  el.style.opacity = "0";
  document.body.appendChild(el);
  el.select();
  el.setSelectionRange(0, text.length);
  const ok = document.execCommand("copy");
  document.body.removeChild(el);
  if (!ok) throw new Error("Copy failed");
}

export function CopyButton({
  text,
  label,
  className = "btn btn-ghost btn-sm",
}: {
  text: string;
  label: string;
  className?: string;
}) {
  const [state, setState] = useState<"idle" | "copied" | "error">("idle");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  async function copy() {
    try {
      await writeClipboard(text);
      setState("copied");
    } catch {
      setState("error");
    }
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setState("idle"), 1800);
  }

  return (
    <button type="button" onClick={copy} disabled={!text} className={className} aria-live="polite">
      {state === "copied" ? (
        <Check className="size-4 text-emerald-300" aria-hidden />
      ) : (
        <Copy className="size-4" aria-hidden />
      )}
      {state === "copied" ? "Copied" : state === "error" ? "Copy failed" : label}
    </button>
  );
}
