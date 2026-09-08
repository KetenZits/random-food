"use client";

import dynamic from "next/dynamic";
import { useReducedMotion } from "motion/react";

const RandomizerScene = dynamic(() => import("@/components/three/randomizer-scene"), { ssr: false, loading: () => <div className="skeleton h-full w-full" /> });

export type RandomizerPhase = "idle" | "accelerating" | "spinning" | "settling" | "landed";

export function RandomizerStage({ phase, selectedDays }: { phase: RandomizerPhase; selectedDays: string[] }) {
  const reducedMotion = useReducedMotion();
  return <div className="absolute inset-0 h-full w-full max-w-full overflow-hidden" aria-hidden="true"><RandomizerScene phase={phase} selectedDays={selectedDays} reducedMotion={Boolean(reducedMotion)} /></div>;
}
