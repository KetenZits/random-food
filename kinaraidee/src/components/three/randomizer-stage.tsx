"use client";

import dynamic from "next/dynamic";
import { useReducedMotion } from "motion/react";

const RandomizerScene = dynamic(() => import("@/components/three/randomizer-scene"), { ssr: false, loading: () => <div className="skeleton h-full w-full" /> });

export function RandomizerStage({ active }: { active: boolean }) {
  const reducedMotion = useReducedMotion();
  return <div className="absolute inset-0 h-full w-full max-w-full overflow-hidden" aria-hidden="true"><RandomizerScene active={active} reducedMotion={Boolean(reducedMotion)} /></div>;
}
