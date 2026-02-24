import { useRef, useState, useMemo, useCallback } from "react";
import { useThree, ThreeEvent, useFrame } from "@react-three/fiber";
import { Text, Line } from "@react-three/drei";
import * as THREE from "three";
import type { PatioConfig, WallSide, WallConfig } from "@/types/configurator";

interface WallEditorMeshProps {
  config: PatioConfig;
  onChange: (config: PatioConfig) => void;
  selectedWall: WallSide | null;
  onSelectWall: (side: WallSide | null) => void;
  showDimensions: 'off' | 'key' | 'all';
}

const mm = (v: number) => v / 1000;

/* ── Draggable Dimension Arrow ────────────────── */
function DraggableDimension({ start, end, label, sideLabel, axis, onDrag, offsetDir, color = '#333333' }: {
  start: [number, number, number];
  end: [number, number, number];
  label: string;
  sideLabel: string;
  axis: 'x' | 'z' | 'y';
  onDrag: (deltaMm: number) => void;
  offsetDir: [number, number, number];
  color?: string;
}) {
  const [hovered, setHovered] = useState(false);
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef<THREE.Vector3 | null>(null);
  const { camera, raycaster, gl } = useThree();
  const plane = useRef(new THREE.Plane());
  const intersection = useRef(new THREE.Vector3());
  const groupRef = useRef<THREE.Group>(null);

  const midpoint: [number, number, number] = [
    (start[0] + end[0]) / 2 + offsetDir[0],
    (start[1] + end[1]) / 2 + offsetDir[1],
    (start[2] + end[2]) / 2 + offsetDir[2],
  ];

  // Side label position — at the end, further offset
  const sideLabelPos: [number, number, number] = [
    end[0] + offsetDir[0] * 2,
    end[1] + offsetDir[1] * 2 + 0.15,
    end[2] + offsetDir[2] * 2,
  ];

  const linePoints = useMemo((): [number, number, number][] => [start, end], [start, end]);

  // Extension lines (perpendicular ticks at each end)
  const tickSize = 0.12;
  const startTick1 = useMemo((): [number, number, number][] => {
    if (axis === 'x') return [[start[0], start[1] - tickSize, start[2]], [start[0], start[1] + tickSize, start[2]]];
    if (axis === 'z') return [[start[0], start[1] - tickSize, start[2]], [start[0], start[1] + tickSize, start[2]]];
    return [[start[0] - tickSize, start[1], start[2]], [start[0] + tickSize, start[1], start[2]]];
  }, [start, axis]);

  const endTick1 = useMemo((): [number, number, number][] => {
    if (axis === 'x') return [[end[0], end[1] - tickSize, end[2]], [end[0], end[1] + tickSize, end[2]]];
    if (axis === 'z') return [[end[0], end[1] - tickSize, end[2]], [end[0], end[1] + tickSize, end[2]]];
    return [[end[0] - tickSize, end[1], end[2]], [end[0] + tickSize, end[1], end[2]]];
  }, [end, axis]);

  const handlePointerDown = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setDragging(true);
    const pt = new THREE.Vector3(...end);
    dragStart.current = pt.clone();
    const normal = new THREE.Vector3(0, 1, 0);
    if (axis === 'y') normal.set(0, 0, 1);
    plane.current.setFromNormalAndCoplanarPoint(normal, pt);
    (gl.domElement as HTMLElement).style.cursor = 'grabbing';
  }, [end, axis, gl]);

  const handlePointerMove = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (!dragging || !dragStart.current) return;
    e.stopPropagation();

    const rect = gl.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1,
    );
    raycaster.setFromCamera(mouse, camera);

    if (raycaster.ray.intersectPlane(plane.current, intersection.current)) {
      let delta: number;
      if (axis === 'x') delta = intersection.current.x - dragStart.current.x;
      else if (axis === 'z') delta = intersection.current.z - dragStart.current.z;
      else delta = intersection.current.y - dragStart.current.y;

      const deltaMm = delta * 1000;
      const snapMm = e.shiftKey ? 10 : 100;
      const snapped = Math.round(deltaMm / snapMm) * snapMm;

      if (Math.abs(snapped) >= snapMm * 0.5) {
        onDrag(snapped);
        if (axis === 'x') dragStart.current.x = intersection.current.x;
        else if (axis === 'z') dragStart.current.z = intersection.current.z;
        else dragStart.current.y = intersection.current.y;
      }
    }
  }, [dragging, axis, camera, raycaster, gl, onDrag]);

  const handlePointerUp = useCallback(() => {
    setDragging(false);
    dragStart.current = null;
    (gl.domElement as HTMLElement).style.cursor = '';
  }, [gl]);

  const activeColor = dragging ? '#22c55e' : hovered ? '#16a34a' : color;
  const lineOpacity = dragging ? 1.0 : hovered ? 0.9 : 0.6;

  return (
    <group ref={groupRef}>
      {/* Main dimension line — dashed style */}
      <Line points={linePoints} color={activeColor} lineWidth={1.5} transparent opacity={lineOpacity} dashed dashSize={0.08} dashOffset={0} gapSize={0.05} />

      {/* Tick marks at ends */}
      <Line points={startTick1} color={activeColor} lineWidth={1.5} transparent opacity={lineOpacity} />
      <Line points={endTick1} color={activeColor} lineWidth={1.5} transparent opacity={lineOpacity} />

      {/* Measurement label */}
      <Text
        position={midpoint}
        fontSize={0.14}
        color={activeColor}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.006}
        outlineColor="#ffffff"
        renderOrder={999}
        fontWeight="bold"
      >
        {label}
      </Text>

      {/* Side label (A, B, C, D) — larger */}
      <Text
        position={sideLabelPos}
        fontSize={0.22}
        color={activeColor}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.008}
        outlineColor="#ffffff"
        renderOrder={999}
        fontWeight="bold"
      >
        {sideLabel}
      </Text>

      {/* Drag handle at end — arrow tip */}
      <mesh
        position={end}
        onPointerEnter={() => { setHovered(true); (gl.domElement as HTMLElement).style.cursor = 'grab'; }}
        onPointerLeave={() => { setHovered(false); if (!dragging) (gl.domElement as HTMLElement).style.cursor = ''; }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <coneGeometry args={[0.06, 0.15, 8]} />
        <meshPhysicalMaterial
          color={dragging ? '#f59e0b' : hovered ? '#22c55e' : '#555555'}
          emissive={dragging ? '#f59e0b' : hovered ? '#22c55e' : '#555555'}
          emissiveIntensity={dragging ? 0.6 : hovered ? 0.4 : 0.1}
          roughness={0.4}
        />
      </mesh>

      {/* Drag handle at start — arrow tip */}
      <mesh
        position={start}
        onPointerEnter={() => { setHovered(true); (gl.domElement as HTMLElement).style.cursor = 'grab'; }}
        onPointerLeave={() => { setHovered(false); if (!dragging) (gl.domElement as HTMLElement).style.cursor = ''; }}
        onPointerDown={(e) => {
          e.stopPropagation();
          setDragging(true);
          const pt = new THREE.Vector3(...start);
          dragStart.current = pt.clone();
          const normal = new THREE.Vector3(0, 1, 0);
          if (axis === 'y') normal.set(0, 0, 1);
          plane.current.setFromNormalAndCoplanarPoint(normal, pt);
          (gl.domElement as HTMLElement).style.cursor = 'grabbing';
        }}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <coneGeometry args={[0.06, 0.15, 8]} />
        <meshPhysicalMaterial
          color={dragging ? '#f59e0b' : hovered ? '#22c55e' : '#555555'}
          emissive={dragging ? '#f59e0b' : hovered ? '#22c55e' : '#555555'}
          emissiveIntensity={dragging ? 0.6 : hovered ? 0.4 : 0.1}
          roughness={0.4}
        />
      </mesh>
    </group>
  );
}

/* ── Wall highlight helpers ────────────────────── */
function WallOutline({ position, rotation, size, isSelected, isHovered }: {
  position: [number, number, number];
  rotation: [number, number, number];
  size: [number, number];
  isSelected: boolean;
  isHovered: boolean;
}) {
  const color = isSelected ? '#3b82f6' : isHovered ? '#60a5fa' : '#888';
  const [w, h] = size;
  const hw = w / 2;
  const hh = h / 2;

  const points = useMemo(() => [
    new THREE.Vector3(-hw, -hh, 0),
    new THREE.Vector3(hw, -hh, 0),
    new THREE.Vector3(hw, hh, 0),
    new THREE.Vector3(-hw, hh, 0),
    new THREE.Vector3(-hw, -hh, 0),
  ], [hw, hh]);

  if (!isSelected && !isHovered) return null;

  return (
    <group position={position} rotation={rotation}>
      <Line points={points} color={color} lineWidth={2} />
    </group>
  );
}

/* ── Main WallEditorMesh ──────────────────────── */
export default function WallEditorMesh({
  config, onChange, selectedWall, onSelectWall, showDimensions,
}: WallEditorMeshProps) {
  const [hoveredWall, setHoveredWall] = useState<WallSide | null>(null);
  const { width, depth, height, walls } = config;

  const wallFaces = useMemo(() => {
    const faces: { side: WallSide; position: [number, number, number]; rotation: [number, number, number]; size: [number, number]; lengthDir: 'x' | 'z' }[] = [];
    const wallH = (side: WallSide) => mm(walls[side].height);
    const wallT = (side: WallSide) => mm(walls[side].thickness);
    const wallO = (side: WallSide) => mm(walls[side].offset);
    const wallL = (side: WallSide) => mm(walls[side].length);

    faces.push({ side: 'back', position: [0, wallH('back') / 2, -depth / 2 - wallT('back') / 2 - wallO('back')], rotation: [0, 0, 0], size: [wallL('back') / 1000 || width + 2, wallH('back')], lengthDir: 'x' });
    faces.push({ side: 'left', position: [-width / 2 - wallT('left') / 2 - wallO('left'), wallH('left') / 2, 0], rotation: [0, Math.PI / 2, 0], size: [wallL('left') / 1000 || depth + 2, wallH('left')], lengthDir: 'z' });
    faces.push({ side: 'right', position: [width / 2 + wallT('right') / 2 + wallO('right'), wallH('right') / 2, 0], rotation: [0, Math.PI / 2, 0], size: [wallL('right') / 1000 || depth + 2, wallH('right')], lengthDir: 'z' });
    faces.push({ side: 'front', position: [0, wallH('front') / 2, depth / 2 + wallT('front') / 2 + wallO('front')], rotation: [0, 0, 0], size: [wallL('front') / 1000 || width + 2, wallH('front')], lengthDir: 'x' });
    return faces;
  }, [width, depth, height, walls]);

  const updateWall = useCallback((side: WallSide, partial: Partial<WallConfig>) => {
    const newWalls = { ...config.walls, [side]: { ...config.walls[side], ...partial } };
    const attachedSides = (['back', 'left', 'right'] as const).filter(s => newWalls[s].enabled);
    onChange({ ...config, walls: newWalls, attachedSides: attachedSides.length > 0 ? attachedSides : ['back'] });
  }, [config, onChange]);

  const handleWidthDrag = useCallback((deltaMm: number) => {
    const newWidth = Math.max(2, Math.min(12, width + deltaMm / 1000));
    const snapped = Math.round(newWidth * 2) / 2; // snap to 0.5m
    onChange({ ...config, width: snapped });
  }, [config, onChange, width]);

  const handleDepthDrag = useCallback((deltaMm: number) => {
    const newDepth = Math.max(2, Math.min(8, depth + deltaMm / 1000));
    const snapped = Math.round(newDepth * 2) / 2;
    onChange({ ...config, depth: snapped });
  }, [config, onChange, depth]);

  const handleHeightDrag = useCallback((deltaMm: number) => {
    const newHeight = Math.max(2.4, Math.min(4.5, height + deltaMm / 1000));
    const snapped = Math.round(newHeight * 10) / 10; // snap to 0.1m
    onChange({ ...config, height: snapped });
  }, [config, onChange, height]);

  const dimOffset = 0.6;

  return (
    <group>
      {/* ── Always-visible draggable dimensions ── */}

      {/* A — Front edge (width) */}
      <DraggableDimension
        start={[-width / 2, 0.05, depth / 2 + dimOffset]}
        end={[width / 2, 0.05, depth / 2 + dimOffset]}
        label={`${Math.round(width * 100)}`}
        sideLabel="A"
        axis="x"
        onDrag={handleWidthDrag}
        offsetDir={[0, 0.2, 0]}
      />

      {/* B — Right edge (depth) */}
      <DraggableDimension
        start={[width / 2 + dimOffset, 0.05, depth / 2]}
        end={[width / 2 + dimOffset, 0.05, -depth / 2]}
        label={`${Math.round(depth * 100)}`}
        sideLabel="B"
        axis="z"
        onDrag={(d) => handleDepthDrag(-d)}
        offsetDir={[0.2, 0.2, 0]}
      />

      {/* C — Back edge (width) */}
      <DraggableDimension
        start={[width / 2, 0.05, -depth / 2 - dimOffset]}
        end={[-width / 2, 0.05, -depth / 2 - dimOffset]}
        label={`${Math.round(width * 100)}`}
        sideLabel="C"
        axis="x"
        onDrag={(d) => handleWidthDrag(-d)}
        offsetDir={[0, 0.2, 0]}
      />

      {/* D — Left edge (depth) */}
      <DraggableDimension
        start={[-width / 2 - dimOffset, 0.05, -depth / 2]}
        end={[-width / 2 - dimOffset, 0.05, depth / 2]}
        label={`${Math.round(depth * 100)}`}
        sideLabel="D"
        axis="z"
        onDrag={handleDepthDrag}
        offsetDir={[-0.2, 0.2, 0]}
      />

      {/* Height — right-back corner */}
      <DraggableDimension
        start={[width / 2 + dimOffset, 0, -depth / 2 - dimOffset]}
        end={[width / 2 + dimOffset, height, -depth / 2 - dimOffset]}
        label={`${Math.round(height * 100)}`}
        sideLabel=""
        axis="y"
        onDrag={handleHeightDrag}
        offsetDir={[0.2, 0, 0]}
      />

      {/* ── Wall selection overlays (only in wall edit mode) ── */}
      {wallFaces.map(face => {
        const wall = walls[face.side];
        const isHovered = hoveredWall === face.side;
        const isSelected = selectedWall === face.side;
        const showFace = wall.enabled || isHovered || isSelected;

        return (
          <group key={face.side}>
            <mesh
              position={face.position}
              rotation={face.rotation}
              onPointerEnter={(e) => { e.stopPropagation(); setHoveredWall(face.side); }}
              onPointerLeave={() => setHoveredWall(null)}
              onClick={(e) => { e.stopPropagation(); onSelectWall(face.side); }}
            >
              <planeGeometry args={[face.size[0], face.size[1]]} />
              <meshBasicMaterial visible={false} side={THREE.DoubleSide} />
            </mesh>

            {showFace && (
              <mesh position={face.position} rotation={face.rotation}>
                <planeGeometry args={[face.size[0], face.size[1]]} />
                <meshPhysicalMaterial
                  color={isSelected ? '#3b82f6' : isHovered ? '#60a5fa' : '#94a3b8'}
                  transparent opacity={isSelected ? 0.2 : isHovered ? 0.1 : 0.05}
                  emissive={isSelected ? '#3b82f6' : isHovered ? '#60a5fa' : '#94a3b8'}
                  emissiveIntensity={isSelected ? 0.3 : isHovered ? 0.15 : 0.05}
                  side={THREE.DoubleSide} depthWrite={false}
                />
              </mesh>
            )}

            <WallOutline
              position={face.position}
              rotation={face.rotation}
              size={face.size}
              isSelected={isSelected}
              isHovered={isHovered}
            />
          </group>
        );
      })}
    </group>
  );
}