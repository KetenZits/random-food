"use client";

import { ContactShadows, Sparkles as DreiSparkles } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { Group, MathUtils, Mesh, Vector2, Vector3 } from "three";

type FoodKind = "chili" | "egg" | "leaf" | "garlic" | "carrot";

function CameraRig({ active, reducedMotion }: { active: boolean; reducedMotion: boolean }) {
  useFrame(({ camera }, delta) => {
    if (reducedMotion) return;
    camera.position.z = MathUtils.damp(camera.position.z, active ? 4.65 : 5.45, 4, delta);
    camera.position.y = MathUtils.damp(camera.position.y, active ? 3.05 : 3.3, 4, delta);
    camera.lookAt(0, -.05, 0);
  });
  return null;
}

function FoodPlate({ active, reducedMotion }: { active: boolean; reducedMotion: boolean }) {
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
    if (!plate.current || reducedMotion) return;
    const targetRotation = active ? Math.sin(clock.elapsedTime * 5) * .1 : Math.sin(clock.elapsedTime * .55) * .025;
    plate.current.rotation.y = MathUtils.damp(plate.current.rotation.y, targetRotation, 5, delta);
    plate.current.position.y = -.42 + Math.sin(clock.elapsedTime * (active ? 5 : 1.1)) * (active ? .035 : .012);
    if (glow.current) {
      const material = glow.current.material as { opacity: number };
      material.opacity = MathUtils.damp(material.opacity, active ? .2 : .045, 5, delta);
      const scale = active ? 1.05 + Math.sin(clock.elapsedTime * 7) * .08 : .92;
      glow.current.scale.setScalar(scale);
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

function Chili() {
  return <group rotation={[0, 0, -.75]}><mesh castShadow scale={[.16, .48, .16]}><capsuleGeometry args={[.25, .7, 5, 12]} /><meshStandardMaterial color="#df493f" roughness={.5} /></mesh><mesh castShadow position={[0, .55, 0]}><coneGeometry args={[.13, .28, 10]} /><meshStandardMaterial color="#5d8e54" roughness={.7} /></mesh></group>;
}

function Egg() {
  return <group rotation={[-.25, 0, .18]}><mesh castShadow scale={[.5, .12, .38]}><sphereGeometry args={[1, 24, 16]} /><meshStandardMaterial color="#fff4db" roughness={.55} /></mesh><mesh castShadow position={[0, .1, 0]} scale={[.18, .08, .18]}><sphereGeometry args={[1, 20, 14]} /><meshStandardMaterial color="#eea62b" roughness={.4} /></mesh></group>;
}

function Leaf() {
  return <group rotation={[.2, .15, -.45]}><mesh castShadow scale={[.24, .06, .52]}><sphereGeometry args={[1, 20, 12]} /><meshStandardMaterial color="#68a460" roughness={.72} /></mesh><mesh position={[0, -.01, .38]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[.025, .025, .45, 8]} /><meshStandardMaterial color="#477c48" /></mesh></group>;
}

function Garlic() {
  return <group>{[-.17, 0, .17].map((x, index) => <mesh key={x} castShadow position={[x, index === 1 ? .06 : 0, 0]} scale={[.2, .28, .2]}><sphereGeometry args={[1, 18, 14]} /><meshStandardMaterial color="#eadcc3" roughness={.8} /></mesh>)}<mesh position={[0, .32, 0]}><coneGeometry args={[.09, .24, 10]} /><meshStandardMaterial color="#c7b794" roughness={.8} /></mesh></group>;
}

function Carrot() {
  return <group rotation={[0, 0, -.65]}><mesh castShadow><coneGeometry args={[.22, .75, 16]} /><meshStandardMaterial color="#eb8e38" roughness={.62} /></mesh><group position={[0, .45, 0]}>{[-.12, 0, .12].map((x) => <mesh key={x} position={[x, .11, 0]} rotation={[0, 0, x * 3]} scale={[.07, .3, .07]}><capsuleGeometry args={[.25, .6, 4, 8]} /><meshStandardMaterial color="#679451" roughness={.7} /></mesh>)}</group></group>;
}

function FoodObject({ kind }: { kind: FoodKind }) {
  if (kind === "chili") return <Chili />;
  if (kind === "egg") return <Egg />;
  if (kind === "leaf") return <Leaf />;
  if (kind === "garlic") return <Garlic />;
  return <Carrot />;
}

function OrbitIngredient({ kind, index, count, active, reducedMotion }: { kind: FoodKind; index: number; count: number; active: boolean; reducedMotion: boolean }) {
  const item = useRef<Group>(null);
  const target = useMemo(() => new Vector3(), []);
  const baseAngle = (index / count) * Math.PI * 2;
  const baseRadius = 2.05 + (index % 2) * .28;

  useFrame(({ clock }, delta) => {
    if (!item.current || reducedMotion) return;
    const speed = active ? 3.8 : .35;
    const angle = baseAngle + clock.elapsedTime * speed;
    const radius = active ? 1.08 + (Math.sin(clock.elapsedTime * 4 + index) + 1) * .18 : baseRadius;
    const y = active ? .3 + Math.sin(clock.elapsedTime * 6 + index) * .16 : .25 + Math.sin(clock.elapsedTime * 1.3 + index) * .28;
    target.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
    item.current.position.lerp(target, 1 - Math.exp(-delta * (active ? 7 : 3)));
    item.current.rotation.y += delta * (active ? 5 : .8);
    item.current.rotation.z += delta * (active ? 2 : .18);
  });

  const initialAngle = baseAngle;
  return <group ref={item} position={[Math.cos(initialAngle) * baseRadius, .25, Math.sin(initialAngle) * baseRadius]} scale={kind === "egg" ? .85 : 1}><FoodObject kind={kind} /></group>;
}

function Scene({ active, reducedMotion }: { active: boolean; reducedMotion: boolean }) {
  const width = useThree((state) => state.size.width);
  const kinds: FoodKind[] = width < 520 || reducedMotion
    ? ["chili", "egg", "leaf", "garlic", "carrot"]
    : ["chili", "egg", "leaf", "garlic", "carrot", "leaf", "chili", "garlic"];

  return <>
    <CameraRig active={active} reducedMotion={reducedMotion} />
    <ambientLight intensity={1.6} />
    <directionalLight castShadow position={[3.5, 5, 4]} intensity={3.2} color="#fff1d3" shadow-mapSize={[512, 512]} />
    <pointLight position={[-3, 2, 1]} intensity={active ? 18 : 8} color="#ff835e" />
    <FoodPlate active={active} reducedMotion={reducedMotion} />
    {kinds.map((kind, index) => <OrbitIngredient key={`${kind}-${index}`} kind={kind} index={index} count={kinds.length} active={active} reducedMotion={reducedMotion} />)}
    <DreiSparkles count={reducedMotion ? 8 : active ? 55 : 22} scale={[5.5, 3.2, 5.5]} size={active ? 3.2 : 1.5} speed={active ? 1.8 : .25} color="#ffd88e" />
    <ContactShadows position={[0, -.76, 0]} opacity={.32} scale={6} blur={2.8} far={3.5} frames={1} />
  </>;
}

export default function RandomizerScene({ active, reducedMotion = false }: { active: boolean; reducedMotion?: boolean }) {
  return <Canvas shadows dpr={[1, 1.5]} camera={{ position: [0, 3.3, 5.45], fov: 40 }} gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}><Scene active={active} reducedMotion={reducedMotion} /></Canvas>;
}
