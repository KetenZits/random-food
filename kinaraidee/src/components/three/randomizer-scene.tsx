"use client";

import { ContactShadows, Sparkles as DreiSparkles } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { Group, MathUtils, Mesh, Shape, Vector2, Vector3 } from "three";

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

function seededVariation(index: number, salt: number) {
  const value = Math.sin((index + 1) * 12.9898 + salt * 78.233) * 43_758.5453;
  return value - Math.floor(value);
}

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

function OrbitStar({ index, count, orbitRadius, active, reducedMotion }: { index: number; count: number; orbitRadius: number; active: boolean; reducedMotion: boolean }) {
  const item = useRef<Group>(null);
  const target = useMemo(() => new Vector3(), []);
  const variation = useMemo(() => ({
    phase: (index / count) * Math.PI * 2,
    radiusOffset: (seededVariation(index, 1) - .5) * .26,
    height: .12 + seededVariation(index, 2) * .48,
    bobAmount: .07 + seededVariation(index, 3) * .08,
    orbitSpeed: .27 + seededVariation(index, 4) * .075,
    scale: .68 + seededVariation(index, 5) * .25,
    rotationX: -.48 + (seededVariation(index, 6) - .5) * .14,
    rotationY: (seededVariation(index, 7) - .5) * .2,
    spinZ: .22 + seededVariation(index, 8) * .26,
  }), [count, index]);
  const color = STAR_COLORS[index % STAR_COLORS.length];

  useFrame(({ clock }, delta) => {
    if (!item.current || reducedMotion) return;
    const speed = active ? 2.85 + variation.orbitSpeed : variation.orbitSpeed;
    const angle = variation.phase + clock.elapsedTime * speed;
    const radius = active ? 1.12 + (Math.sin(clock.elapsedTime * 4 + index) + 1) * .16 : orbitRadius + variation.radiusOffset;
    const y = active ? .3 + Math.sin(clock.elapsedTime * 5.5 + index) * .14 : variation.height + Math.sin(clock.elapsedTime * 1.15 + index) * variation.bobAmount;
    target.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
    item.current.position.lerp(target, 1 - Math.exp(-delta * (active ? 6.5 : 3)));
    const tiltStrength = active ? .42 : .08;
    const targetRotationX = variation.rotationX + Math.sin(clock.elapsedTime * 1.6 + index) * tiltStrength;
    const targetRotationY = variation.rotationY + Math.cos(clock.elapsedTime * 1.35 + index) * tiltStrength;
    item.current.rotation.x = MathUtils.damp(item.current.rotation.x, targetRotationX, active ? 5 : 2.5, delta);
    item.current.rotation.y = MathUtils.damp(item.current.rotation.y, targetRotationY, active ? 5 : 2.5, delta);
    item.current.rotation.z += delta * (active ? 1.6 : variation.spinZ);
  });

  const initialRadius = orbitRadius + variation.radiusOffset;
  return <group
    ref={item}
    position={[Math.cos(variation.phase) * initialRadius, variation.height, Math.sin(variation.phase) * initialRadius]}
    rotation={[variation.rotationX, variation.rotationY, variation.phase]}
    scale={variation.scale}
  >
    <mesh castShadow position={[0, 0, -.07]}>
      <extrudeGeometry args={[STAR_SHAPE, { depth: .14, steps: 1, bevelEnabled: true, bevelThickness: .04, bevelSize: .035, bevelSegments: 4, curveSegments: 5 }]} />
      <meshPhysicalMaterial color={color} emissive={color} emissiveIntensity={.035} metalness={.58} roughness={.24} clearcoat={.72} clearcoatRoughness={.2} />
    </mesh>
  </group>;
}

function Scene({ active, reducedMotion }: { active: boolean; reducedMotion: boolean }) {
  const width = useThree((state) => state.size.width);
  const starCount = reducedMotion || width < 520 ? 5 : width < 900 ? 7 : 8;
  const orbitRadius = width < 520 ? 1.68 : width < 900 ? 1.94 : 2.18;

  return <>
    <CameraRig active={active} reducedMotion={reducedMotion} />
    <ambientLight intensity={1.6} />
    <directionalLight castShadow position={[3.5, 5, 4]} intensity={3.2} color="#fff1d3" shadow-mapSize={[512, 512]} />
    <pointLight position={[-3, 2, 1]} intensity={active ? 18 : 8} color="#ff835e" />
    <FoodPlate active={active} reducedMotion={reducedMotion} />
    {Array.from({ length: starCount }, (_, index) => <OrbitStar key={index} index={index} count={starCount} orbitRadius={orbitRadius} active={active} reducedMotion={reducedMotion} />)}
    <DreiSparkles count={reducedMotion ? 8 : active ? 55 : 22} scale={[5.5, 3.2, 5.5]} size={active ? 3.2 : 1.5} speed={active ? 1.8 : .25} color="#ffd88e" />
    <ContactShadows position={[0, -.76, 0]} opacity={.32} scale={6} blur={2.8} far={3.5} frames={1} />
  </>;
}

export default function RandomizerScene({ active, reducedMotion = false }: { active: boolean; reducedMotion?: boolean }) {
  return <Canvas className="max-w-full" shadows dpr={[1, 1.5]} camera={{ position: [0, 3.3, 5.45], fov: 40 }} gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}><Scene active={active} reducedMotion={reducedMotion} /></Canvas>;
}
