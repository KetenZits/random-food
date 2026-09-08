"use client";

import { ContactShadows, Sparkles as DreiSparkles } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import { AdditiveBlending, BackSide, ExtrudeGeometry, Group, MathUtils, Mesh, MeshBasicMaterial, MeshPhysicalMaterial, PointLight, Shape, Vector2, Vector3 } from "three";
import type { RandomizerPhase } from "@/components/three/randomizer-stage";

const STAR_COLORS = ["#f7c95e", "#ef9a64", "#ffe0a3", "#d8ad65"] as const;

function createStarShape() {
  const shape = new Shape();
  const points = 5;

  for (let index = 0; index < points * 2; index += 1) {
    const radius = index % 2 === 0 ? .5 : .23;
    const angle = -Math.PI / 2 + index * Math.PI / points;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (index === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }

  shape.closePath();
  return shape;
}

const STAR_SHAPE = createStarShape();

function hashDay(day: string) {
  return Array.from(day).reduce((hash, character) => ((hash << 5) - hash + character.charCodeAt(0)) | 0, 0);
}

function seededVariation(seed: number, salt: number) {
  const value = Math.sin((seed + 1) * 12.9898 + salt * 78.233) * 43_758.5453;
  return value - Math.floor(value);
}

function CameraRig({ phase, reducedMotion }: { phase: RandomizerPhase; reducedMotion: boolean }) {
  useFrame(({ camera }, delta) => {
    const energized = phase === "accelerating" || phase === "spinning";
    camera.position.z = MathUtils.damp(camera.position.z, !reducedMotion && energized ? 4.92 : 5.45, 4, delta);
    camera.position.y = MathUtils.damp(camera.position.y, !reducedMotion && energized ? 3.12 : 3.3, 4, delta);
    camera.lookAt(0, -.05, 0);
  });
  return null;
}

function FoodPlate({ phase, reducedMotion }: { phase: RandomizerPhase; reducedMotion: boolean }) {
  const plate = useRef<Group>(null);
  const glow = useRef<Mesh>(null);
  const bowlProfile = useMemo(() => [
    new Vector2(0, -.46),
    new Vector2(.62, -.45),
    new Vector2(1.02, -.33),
    new Vector2(1.3, -.08),
    new Vector2(1.42, .16),
    new Vector2(1.34, .25),
    new Vector2(1.16, .12),
    new Vector2(.86, -.015),
    new Vector2(0, -.045),
  ], []);

  useFrame(({ clock }, delta) => {
    if (!plate.current) return;
    const energized = phase === "accelerating" || phase === "spinning";
    const landing = phase === "landed";
    const targetRotation = reducedMotion ? 0 : energized ? Math.sin(clock.elapsedTime * 3.2) * .035 : Math.sin(clock.elapsedTime * .55) * .025;
    const floatAmount = reducedMotion ? 0 : energized ? .035 : landing ? .02 : .012;
    const floatSpeed = energized ? 3.6 : landing ? 2.4 : 1.1;
    const targetScale = reducedMotion
      ? phase === "idle" ? 1 : 1.01
      : energized ? 1.035 : phase === "settling" ? 1.018 : landing ? 1.025 : 1;
    plate.current.rotation.y = MathUtils.damp(plate.current.rotation.y, targetRotation, 5, delta);
    plate.current.position.y = MathUtils.damp(plate.current.position.y, -.42 + Math.sin(clock.elapsedTime * floatSpeed) * floatAmount, 6, delta);
    const scale = MathUtils.damp(plate.current.scale.x, targetScale, 6, delta);
    plate.current.scale.setScalar(scale);
    if (glow.current) {
      const material = glow.current.material as { opacity: number };
      const pulse = (Math.sin(clock.elapsedTime * 7) + 1) / 2;
      const glowOpacity = phase === "spinning" ? .15 + pulse * .09 : phase === "landed" ? .2 : phase === "idle" ? .045 : .1;
      material.opacity = MathUtils.damp(material.opacity, glowOpacity, 6, delta);
      const glowScale = MathUtils.damp(glow.current.scale.x, energized ? 1.06 + pulse * .07 : landing ? 1.12 : .92, 6, delta);
      glow.current.scale.setScalar(glowScale);
    }
  });

  return (
    <group ref={plate} position={[0, -.42, 0]}>
      <mesh castShadow receiveShadow>
        <latheGeometry args={[bowlProfile, 72]} />
        <meshPhysicalMaterial color="#f6eddd" roughness={.28} metalness={.02} clearcoat={.28} clearcoatRoughness={.42} />
      </mesh>
      <mesh castShadow position={[0, .2, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.34, .075, 14, 72]} />
        <meshPhysicalMaterial color="#fff8eb" roughness={.24} clearcoat={.3} />
      </mesh>

      <mesh castShadow position={[-.42, .08, .02]} scale={[.72, .28, .64]}>
        <sphereGeometry args={[1, 32, 20, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#f4e5bf" roughness={.8} />
      </mesh>
      <mesh receiveShadow position={[.43, .045, .04]}>
        <cylinderGeometry args={[.62, .66, .055, 36]} />
        <meshStandardMaterial color="#9e4934" roughness={.75} />
      </mesh>
      {[
        [.22, .18, .12, "#5f8c51"], [.49, .17, -.13, "#c26a38"], [.68, .18, .13, "#5a824b"],
        [.35, .2, .28, "#d28a42"], [.57, .2, .31, "#789a58"],
      ].map(([x, y, z, color], index) => (
        <mesh key={index} castShadow position={[x as number, y as number, z as number]} scale={[.16, .1, .13]} rotation={[0, index * .7, 0]}>
          <sphereGeometry args={[1, 16, 12]} />
          <meshStandardMaterial color={color as string} roughness={.7} />
        </mesh>
      ))}
      <mesh ref={glow} position={[0, -.29, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.48, 1.9, 64]} />
        <meshBasicMaterial color="#ff9b62" transparent opacity={.045} depthWrite={false} />
      </mesh>
    </group>
  );
}

function OrbitStar({ day, index, count, orbitRadius, sizeFactor, phase, exiting, reducedMotion, geometry }: {
  day: string;
  index: number;
  count: number;
  orbitRadius: number;
  sizeFactor: number;
  phase: RandomizerPhase;
  exiting: boolean;
  reducedMotion: boolean;
  geometry: ExtrudeGeometry;
}) {
  const item = useRef<Group>(null);
  const material = useRef<MeshPhysicalMaterial>(null);
  const glowMaterial = useRef<MeshBasicMaterial>(null);
  const target = useMemo(() => new Vector3(), []);
  const phaseStartedAt = useRef(0);
  const previousPhase = useRef(phase);
  const visibility = useRef(0);
  const daySeed = useMemo(() => hashDay(day), [day]);
  const variation = useMemo(() => ({
    height: .12 + seededVariation(daySeed, 2) * .48,
    bobAmount: .07 + seededVariation(daySeed, 3) * .08,
    scale: .72 + seededVariation(daySeed, 5) * .18,
    rotationX: -.48 + (seededVariation(daySeed, 6) - .5) * .14,
    rotationY: (seededVariation(daySeed, 7) - .5) * .2,
    spinZ: .22 + seededVariation(daySeed, 8) * .26,
    floatPhase: seededVariation(daySeed, 9) * Math.PI * 2,
  }), [daySeed]);
  const color = STAR_COLORS[Math.abs(daySeed) % STAR_COLORS.length];
  const angle = (index / Math.max(count, 1)) * Math.PI * 2;

  useFrame(({ clock }, delta) => {
    if (!item.current) return;
    if (previousPhase.current !== phase) {
      previousPhase.current = phase;
      phaseStartedAt.current = clock.elapsedTime;
    }

    const phaseElapsed = clock.elapsedTime - phaseStartedAt.current;
    const energetic = phase === "accelerating" || phase === "spinning";
    const pulse = (Math.sin((clock.elapsedTime - index * .05) * 10) + 1) / 2;
    const bobSpeed = energetic ? 5.5 : 1.15;
    const bobAmount = reducedMotion ? .012 : energetic ? .14 : variation.bobAmount;
    const y = variation.height + Math.sin(clock.elapsedTime * bobSpeed + variation.floatPhase) * bobAmount;
    target.set(Math.cos(angle) * orbitRadius, y, Math.sin(angle) * orbitRadius);
    item.current.position.lerp(target, 1 - Math.exp(-delta * 5));

    const tiltStrength = reducedMotion ? .015 : energetic ? .32 : .08;
    const targetRotationX = variation.rotationX + Math.sin(clock.elapsedTime * 1.6 + variation.floatPhase) * tiltStrength;
    const targetRotationY = variation.rotationY + Math.cos(clock.elapsedTime * 1.35 + variation.floatPhase) * tiltStrength;
    item.current.rotation.x = MathUtils.damp(item.current.rotation.x, targetRotationX, energetic ? 5 : 2.5, delta);
    item.current.rotation.y = MathUtils.damp(item.current.rotation.y, targetRotationY, energetic ? 5 : 2.5, delta);
    item.current.rotation.z += delta * (reducedMotion ? .08 : energetic ? 2.15 : variation.spinZ);

    let animationScale = 1;
    let emissiveIntensity = .055;
    let glowOpacity = .045;
    if (phase === "accelerating") {
      animationScale = reducedMotion ? 1.02 : 1.08 + pulse * .04;
      emissiveIntensity = reducedMotion ? .12 : .65 + pulse * .45;
      glowOpacity = reducedMotion ? .07 : .12 + pulse * .1;
    } else if (phase === "spinning") {
      animationScale = reducedMotion ? 1.035 : 1.1 + pulse * .1;
      emissiveIntensity = reducedMotion ? .18 : 1.35 + pulse * 1.35;
      glowOpacity = reducedMotion ? .09 : .2 + pulse * .16;
    } else if (phase === "settling") {
      animationScale = reducedMotion ? 1.015 : 1.04 + pulse * .035;
      emissiveIntensity = reducedMotion ? .12 : .62 + pulse * .35;
      glowOpacity = reducedMotion ? .07 : .12 + pulse * .08;
    } else if (phase === "landed") {
      const landingBounce = reducedMotion ? 0 : Math.sin(Math.min(1, phaseElapsed / .3) * Math.PI) * .14;
      animationScale = 1 + landingBounce;
      emissiveIntensity = reducedMotion ? .18 : .85 + Math.sin(Math.min(1, phaseElapsed / .3) * Math.PI) * 1.3;
      glowOpacity = reducedMotion ? .09 : .16 + Math.sin(Math.min(1, phaseElapsed / .3) * Math.PI) * .18;
    } else {
      emissiveIntensity = .045 + (Math.sin(clock.elapsedTime * 1.4 + variation.floatPhase) + 1) * .02;
      glowOpacity = .035 + (Math.sin(clock.elapsedTime * 1.2 + variation.floatPhase) + 1) * .012;
    }

    visibility.current = MathUtils.damp(visibility.current, exiting ? 0 : 1, exiting ? 12 : 8, delta);
    const targetScale = variation.scale * sizeFactor * animationScale * visibility.current;
    item.current.scale.setScalar(MathUtils.damp(item.current.scale.x, targetScale, energetic ? 11 : 8, delta));
    if (material.current) material.current.emissiveIntensity = MathUtils.damp(material.current.emissiveIntensity, emissiveIntensity, 8, delta);
    if (glowMaterial.current) glowMaterial.current.opacity = MathUtils.damp(glowMaterial.current.opacity, glowOpacity * visibility.current, 8, delta);
  });

  return <group
    ref={item}
    position={[Math.cos(angle) * orbitRadius, variation.height, Math.sin(angle) * orbitRadius]}
    rotation={[variation.rotationX, variation.rotationY, angle]}
    scale={0}
  >
    <mesh geometry={geometry} position={[0, 0, -.07]} scale={1.15} renderOrder={-1}>
      <meshBasicMaterial ref={glowMaterial} color={color} transparent opacity={0} depthWrite={false} side={BackSide} blending={AdditiveBlending} />
    </mesh>
    <mesh geometry={geometry} castShadow position={[0, 0, -.07]}>
      <meshPhysicalMaterial ref={material} color={color} emissive={color} emissiveIntensity={.035} metalness={.58} roughness={.24} clearcoat={.72} clearcoatRoughness={.2} />
    </mesh>
  </group>;
}

function StarOrbit({ children, phase, reducedMotion }: { children: React.ReactNode; phase: RandomizerPhase; reducedMotion: boolean }) {
  const orbit = useRef<Group>(null);
  const speed = useRef(reducedMotion ? .07 : .24);

  useFrame((_, delta) => {
    if (!orbit.current) return;
    const targetSpeed = reducedMotion
      ? phase === "idle" ? .07 : phase === "landed" ? .05 : .28
      : phase === "accelerating" ? 4.5 : phase === "spinning" ? 4.85 : phase === "settling" ? .52 : phase === "landed" ? .16 : .24;
    const damping = phase === "accelerating" ? 3.4 : phase === "settling" ? 4.6 : 6;
    speed.current = MathUtils.damp(speed.current, targetSpeed, damping, delta);
    orbit.current.rotation.y += speed.current * delta;
  });

  return <group ref={orbit}>{children}</group>;
}

function EnergyLight({ phase }: { phase: RandomizerPhase }) {
  const light = useRef<PointLight>(null);

  useFrame(({ clock }, delta) => {
    if (!light.current) return;
    const pulse = (Math.sin(clock.elapsedTime * 8) + 1) / 2;
    const target = phase === "spinning" ? 17 + pulse * 8 : phase === "landed" ? 18 : phase === "idle" ? 7 : 12;
    light.current.intensity = MathUtils.damp(light.current.intensity, target, 6, delta);
  });

  return <pointLight ref={light} position={[-3, 2, 1]} intensity={7} color="#ff835e" />;
}

type RenderedDay = { day: string; exiting: boolean };

function Scene({ phase, selectedDays, reducedMotion }: { phase: RandomizerPhase; selectedDays: string[]; reducedMotion: boolean }) {
  const width = useThree((state) => state.size.width);
  const [renderedDays, setRenderedDays] = useState<RenderedDay[]>(() => selectedDays.map((day) => ({ day, exiting: false })));
  const orbitRadius = width < 520 ? 1.58 : width < 900 ? 1.92 : 2.16;
  const sizeFactor = width < 520 ? .8 : width < 900 ? .92 : 1;
  const energetic = phase === "accelerating" || phase === "spinning";
  const geometry = useMemo(() => new ExtrudeGeometry(STAR_SHAPE, { depth: .14, steps: 1, bevelEnabled: true, bevelThickness: .04, bevelSize: .035, bevelSegments: 4, curveSegments: 5 }), []);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useEffect(() => {
    const selectedSet = new Set(selectedDays);
    const reconcile = window.setTimeout(() => {
      setRenderedDays((current) => {
        const next = current.map((item) => ({ ...item, exiting: !selectedSet.has(item.day) }));
        for (const day of selectedDays) {
          const existing = next.find((item) => item.day === day);
          if (existing) existing.exiting = false;
          else next.push({ day, exiting: false });
        }
        return next;
      });
    }, 0);

    const cleanup = window.setTimeout(() => {
      setRenderedDays((current) => current.filter((item) => selectedSet.has(item.day)));
    }, 480);
    return () => {
      window.clearTimeout(reconcile);
      window.clearTimeout(cleanup);
    };
  }, [selectedDays]);

  return <>
    <CameraRig phase={phase} reducedMotion={reducedMotion} />
    <ambientLight intensity={1.6} />
    <directionalLight castShadow position={[3.5, 5, 4]} intensity={3.2} color="#fff1d3" shadow-mapSize={[512, 512]} />
    <EnergyLight phase={phase} />
    <FoodPlate phase={phase} reducedMotion={reducedMotion} />
    <StarOrbit phase={phase} reducedMotion={reducedMotion}>
      {renderedDays.map((item, renderedIndex) => {
        const selectedIndex = selectedDays.indexOf(item.day);
        const index = selectedIndex >= 0 ? selectedIndex : renderedIndex;
        const count = selectedIndex >= 0 ? Math.max(selectedDays.length, 1) : Math.max(renderedDays.length, 1);
        return <OrbitStar key={item.day} day={item.day} index={index} count={count} orbitRadius={orbitRadius} sizeFactor={sizeFactor} phase={phase} exiting={item.exiting} reducedMotion={reducedMotion} geometry={geometry} />;
      })}
    </StarOrbit>
    <DreiSparkles count={reducedMotion ? 10 : energetic ? 52 : phase === "landed" ? 34 : 22} scale={[5.5, 3.2, 5.5]} size={reducedMotion ? 1.1 : energetic ? 3 : 1.5} speed={reducedMotion ? .08 : energetic ? 1.65 : phase === "landed" ? .8 : .25} color="#ffd88e" />
    <ContactShadows position={[0, -.76, 0]} opacity={.32} scale={6} blur={2.8} far={3.5} frames={1} />
  </>;
}

export default function RandomizerScene({ phase, selectedDays, reducedMotion = false }: { phase: RandomizerPhase; selectedDays: string[]; reducedMotion?: boolean }) {
  return <Canvas className="max-w-full" shadows dpr={[1, 1.5]} camera={{ position: [0, 3.3, 5.45], fov: 40 }} gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}><Scene phase={phase} selectedDays={selectedDays} reducedMotion={reducedMotion} /></Canvas>;
}
