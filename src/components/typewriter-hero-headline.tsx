"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

const LINES = ["Get paid fast with a", "link."] as const;
const CHAR_MS = 45;
const LINE_PAUSE_MS = 320;
const HOLD_MS = 3_500;

function TypewriterCursor() {
  return (
    <span
      className="ml-0.5 inline-block h-[0.9em] w-[3px] translate-y-px animate-pulse bg-current align-middle"
      aria-hidden="true"
    />
  );
}

export function TypewriterHeroHeadline({ className }: { className?: string }) {
  const [lineIndex, setLineIndex] = React.useState(0);
  const [charIndex, setCharIndex] = React.useState(0);
  const [done, setDone] = React.useState(false);
  const [reducedMotion, setReducedMotion] = React.useState(false);

  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => {
      const reduced = mq.matches;
      setReducedMotion(reduced);
      if (reduced) {
        setLineIndex(LINES.length - 1);
        setCharIndex(LINES[LINES.length - 1].length);
        setDone(true);
      }
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  React.useEffect(() => {
    if (reducedMotion) return;

    const line = LINES[lineIndex];
    if (!line) {
      setDone(true);
      return;
    }

    if (charIndex < line.length) {
      const t = window.setTimeout(() => setCharIndex((c) => c + 1), CHAR_MS);
      return () => clearTimeout(t);
    }

    if (lineIndex < LINES.length - 1) {
      const t = window.setTimeout(() => {
        setLineIndex((i) => i + 1);
        setCharIndex(0);
      }, LINE_PAUSE_MS);
      return () => clearTimeout(t);
    }

    setDone(true);
  }, [lineIndex, charIndex, reducedMotion]);

  React.useEffect(() => {
    if (reducedMotion || !done) return;
    const t = window.setTimeout(() => {
      setLineIndex(0);
      setCharIndex(0);
      setDone(false);
    }, HOLD_MS);
    return () => clearTimeout(t);
  }, [done, reducedMotion]);

  const line1 =
    lineIndex === 0 ? LINES[0].slice(0, charIndex) : LINES[0];
  const line2 =
    lineIndex < 1 ? "" : lineIndex === 1 ? LINES[1].slice(0, charIndex) : LINES[1];
  const cursorAfterLine2 = lineIndex >= 1 || done;

  return (
    <h1 className={cn(className)} aria-label="Get paid fast with a link.">
      <span className="block">
        {line1}
        {!cursorAfterLine2 ? <TypewriterCursor /> : null}
      </span>
      <span className="block">
        {line2}
        {cursorAfterLine2 ? <TypewriterCursor /> : null}
      </span>
    </h1>
  );
}
