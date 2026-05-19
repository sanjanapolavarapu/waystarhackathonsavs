"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

const HEADLINE = "Get paid fast with a link.";
const CHAR_MS = 45;
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
  const [charIndex, setCharIndex] = React.useState(0);
  const [done, setDone] = React.useState(false);
  const [reducedMotion, setReducedMotion] = React.useState(false);

  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => {
      const reduced = mq.matches;
      setReducedMotion(reduced);
      if (reduced) {
        setCharIndex(HEADLINE.length);
        setDone(true);
      }
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  React.useEffect(() => {
    if (reducedMotion) return;

    if (charIndex < HEADLINE.length) {
      const t = window.setTimeout(() => setCharIndex((c) => c + 1), CHAR_MS);
      return () => clearTimeout(t);
    }

    setDone(true);
  }, [charIndex, reducedMotion]);

  React.useEffect(() => {
    if (reducedMotion || !done) return;
    const t = window.setTimeout(() => {
      setCharIndex(0);
      setDone(false);
    }, HOLD_MS);
    return () => clearTimeout(t);
  }, [done, reducedMotion]);

  return (
    <h1 className={cn("block w-full whitespace-nowrap", className)} aria-label={HEADLINE}>
      <span className="inline">
        {HEADLINE.slice(0, charIndex)}
        <TypewriterCursor />
      </span>
    </h1>
  );
}
