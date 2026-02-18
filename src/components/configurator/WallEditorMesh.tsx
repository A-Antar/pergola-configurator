import { useRef, useState, useMemo, useCallback } from "react";
import { useThree, ThreeEvent } from "@react-three/fiber";
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

interface WallFace {
  side: WallSide;
  position: [number, number, number];
  rotation: [number, number, number];
  size: [number, number]; // [width, height]
  dimLabelPos: [number, number, number];
  dimLabelRotation: [number, number, number];
  lengthDir: 'x' | 'z';
}

/* ── Highlight material ───────────────────────── */
function useHighlightMaterial(isHovered: boolean, isSelected: boolean) {
  return useMemo(() => {
    if (isSelected) {
      return new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#3b82f6'),
        transparent: true,
        opacity: 0.25,
        roughness: 0.5,
        metalness: 0.1,
        emissive: new THREE.Color('#3b82f6'),
        emissiveIntensity: 0.3,
        side: THREE.DoubleSide,
      });
    }
    if (isHovered) {
      return new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#60a5fa'),
        transparent: true,
        opacity: 0.15,
        roughness: 0.5,
        metalness: 0.1,
        emissive: new THREE.Color('#60a5fa'),
        emissiveIntensity: 0.15,
        side: THREE.DoubleSide,
      });
    }
    return null;
  }, [isHovered, isSelected]);
}

/* ── Outline/glow mesh ─────────────────────────── */
function WallOutline({ position, rotation, size, isSelected, isHovered }: {
  position: [number, number, number];
  rotation: [number, number, number];
  size: [number, number];
  isSelected: boolean;
  isHovered: boolean;
}) {
  const color = isSelected ? '#3b82f6' : isHovered ? '#60a5fa' : '#888';
  const lineWidth = isSelected ? 0.02 : 0.01;

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

/* ── Drag Handle ───────────────────────────────── */
function DragHandle({ position, axis, onDrag, snapMm = 100 }: {
  position: [number, number, number];
  axis: 'x' | 'z';
  onDrag: (deltaMm: number) => void;
  snapMm?: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef<THREE.Vector3 | null>(null);
  const { camera, raycaster, gl } = useThree();
  const plane = useRef(new THREE.Plane());
  const intersection = useRef(new THREE.Vector3());

  const handlePointerDown = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setDragging(true);
    dragStart.current = new THREE.Vector3(...position);
    
    // Create drag plane perpendicular to camera
    const normal = new THREE.Vector3(0, 1, 0);
    plane.current.setFromNormalAndCoplanarPoint(normal, new THREE.Vector3(...position));
    
    (e.target as HTMLElement)?.setPointerCapture?.(e.pointerId);
  }, [position]);

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
      const delta = axis === 'x'
        ? intersection.current.x - dragStart.current.x
        : intersection.current.z - dragStart.current.z;
      
      const deltaMm = delta * 1000;
      const snapped = e.shiftKey ? deltaMm : Math.round(deltaMm / snapMm) * snapMm;
      
      if (Math.abs(snapped) >= snapMm * 0.5 || e.shiftKey) {
        onDrag(snapped);
        if (axis === 'x') dragStart.current.x = intersection.current.x;
        else dragStart.current.z = intersection.current.z;
      }
    }
  }, [dragging, axis, camera, raycaster, gl, onDrag, snapMm]);

  const handlePointerUp = useCallback(() => {
    setDragging(false);
    dragStart.current = null;
  }, []);

  return (
    <mesh
      ref={meshRef}
      position={position}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => { setHovered(false); if (!dragging) setDragging(false); }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <sphereGeometry args={[0.08, 16, 16]} />
      <meshPhysicalMaterial
        color={dragging ? '#f59e0b' : hovered ? '#3b82f6' : '#60a5fa'}
        emissive={dragging ? '#f59e0b' : hovered ? '#3b82f6' : '#60a5fa'}
        emissiveIntensity={dragging ? 0.8 : hovered ? 0.5 : 0.3}
        transparent
        opacity={0.9}
        roughness={0.3}
      />
    </mesh>
  );
}

/* ── Dimension Label ──────────────────────────── */
function DimensionLabel({ start, end, label, offsetDir, color = '#00ff88' }: {
  start: [number, number, number];
  end: [number, number, number];
  label: string;
  offsetDir: [number, number, number];
  color?: string;
}) {
  const midpoint: [number, number, number] = [
    (start[0] + end[0]) / 2 + offsetDir[0],
    (start[1] + end[1]) / 2 + offsetDir[1],
    (start[2] + end[2]) / 2 + offsetDir[2],
  ];

  const linePoints = useMemo((): [number, number, number][] => [start, end], [start, end]);

  // Arrow endpoints
  const arrowSize = 0.08;

  return (
    <group>
      {/* Main line */}
      <Line points={linePoints} color={color} lineWidth={1} transparent opacity={0.7} />

      {/* Arrow ticks at start */}
      <mesh position={start}>
        <sphereGeometry args={[arrowSize * 0.4, 6, 6]} />
        <meshBasicMaterial color={color} />
      </mesh>

      {/* Arrow ticks at end */}
      <mesh position={end}>
        <sphereGeometry args={[arrowSize * 0.4, 6, 6]} />
        <meshBasicMaterial color={color} />
      </mesh>

      {/* Numeric label — billboard */}
      <Text
        position={midpoint}
        fontSize={0.12}
        color={color}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.008}
        outlineColor="#000000"
        renderOrder={999}
      >
        {label}
      </Text>
    </group>
  );
}

/* ── Main WallEditorMesh ──────────────────────── */
export default function WallEditorMesh({
  config, onChange, selectedWall, onSelectWall, showDimensions,
}: WallEditorMeshProps) {
  const [hoveredWall, setHoveredWall] = useState<WallSide | null>(null);
  const { width, depth, height, walls } = config;

  const wallFaces = useMemo((): WallFace[] => {
    const faces: WallFace[] = [];
    const wallH = (side: WallSide) => mm(walls[side].height);
    const wallT = (side: WallSide) => mm(walls[side].thickness);
    const wallO = (side: WallSide) => mm(walls[side].offset);
    const wallL = (side: WallSide) => mm(walls[side].length);

    // Back wall
    faces.push({
      side: 'back',
      position: [0, wallH('back') / 2, -depth / 2 - wallT('back') / 2 - wallO('back')],
      rotation: [0, 0, 0],
      size: [wallL('back') / 1000 || width + 2, wallH('back')],
      dimLabelPos: [0, wallH('back') + 0.2, -depth / 2 - wallO('back')],
      dimLabelRotation: [0, 0, 0],
      lengthDir: 'x',
    });

    // Left wall
    faces.push({
      side: 'left',
      position: [-width / 2 - wallT('left') / 2 - wallO('left'), wallH('left') / 2, 0],
      rotation: [0, Math.PI / 2, 0],
      size: [wallL('left') / 1000 || depth + 2, wallH('left')],
      dimLabelPos: [-width / 2 - wallO('left'), wallH('left') + 0.2, 0],
      dimLabelRotation: [0, 0, 0],
      lengthDir: 'z',
    });

    // Right wall
    faces.push({
      side: 'right',
      position: [width / 2 + wallT('right') / 2 + wallO('right'), wallH('right') / 2, 0],
      rotation: [0, Math.PI / 2, 0],
      size: [wallL('right') / 1000 || depth + 2, wallH('right')],
      dimLabelPos: [width / 2 + wallO('right'), wallH('right') + 0.2, 0],
      dimLabelRotation: [0, 0, 0],
      lengthDir: 'z',
    });

    // Front wall
    faces.push({
      side: 'front',
      position: [0, wallH('front') / 2, depth / 2 + wallT('front') / 2 + wallO('front')],
      rotation: [0, 0, 0],
      size: [wallL('front') / 1000 || width + 2, wallH('front')],
      dimLabelPos: [0, wallH('front') + 0.2, depth / 2 + wallO('front')],
      dimLabelRotation: [0, 0, 0],
      lengthDir: 'x',
    });

    return faces;
  }, [width, depth, height, walls]);

  const updateWall = useCallback((side: WallSide, partial: Partial<WallConfig>) => {
    const newWalls = { ...config.walls, [side]: { ...config.walls[side], ...partial } };
    const attachedSides = (['back', 'left', 'right'] as const).filter(s => newWalls[s].enabled);
    onChange({
      ...config,
      walls: newWalls,
      attachedSides: attachedSides.length > 0 ? attachedSides : ['back'],
    });
  }, [config, onChange]);

  return (
    <group>
      {/* Wall highlight faces */}
      {wallFaces.map(face => {
        const wall = walls[face.side];
        const isHovered = hoveredWall === face.side;
        const isSelected = selectedWall === face.side;
        const showFace = wall.enabled || isHovered || isSelected;

        return (
          <group key={face.side}>
            {/* Clickable invisible face (always present for interaction) */}
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

            {/* Visible highlight overlay */}
            {showFace && (
              <mesh position={face.position} rotation={face.rotation}>
                <planeGeometry args={[face.size[0], face.size[1]]} />
                <meshPhysicalMaterial
                  color={isSelected ? '#3b82f6' : isHovered ? '#60a5fa' : '#94a3b8'}
                  transparent
                  opacity={isSelected ? 0.2 : isHovered ? 0.1 : 0.05}
                  emissive={isSelected ? '#3b82f6' : isHovered ? '#60a5fa' : '#94a3b8'}
                  emissiveIntensity={isSelected ? 0.3 : isHovered ? 0.15 : 0.05}
                  side={THREE.DoubleSide}
                  depthWrite={false}
                />
              </mesh>
            )}

            {/* Outline */}
            <WallOutline
              position={face.position}
              rotation={face.rotation}
              size={face.size}
              isSelected={isSelected}
              isHovered={isHovered}
            />

            {/* Drag handles for selected wall */}
            {isSelected && wall.enabled && (
              <>
                {face.lengthDir === 'x' ? (
                  <>
                    <DragHandle
                      position={[face.position[0] - face.size[0] / 2, face.position[1], face.position[2]]}
                      axis="x"
                      onDrag={(deltaMm) => {
                        const newLen = Math.max(1000, wall.length + deltaMm);
                        updateWall(face.side, { length: newLen });
                      }}
                    />
                    <DragHandle
                      position={[face.position[0] + face.size[0] / 2, face.position[1], face.position[2]]}
                      axis="x"
                      onDrag={(deltaMm) => {
                        const newLen = Math.max(1000, wall.length + deltaMm);
                        updateWall(face.side, { length: newLen });
                      }}
                    />
                  </>
                ) : (
                  <>
                    <DragHandle
                      position={[face.position[0], face.position[1], face.position[2] - face.size[0] / 2]}
                      axis="z"
                      onDrag={(deltaMm) => {
                        const newLen = Math.max(1000, wall.length - deltaMm);
                        updateWall(face.side, { length: newLen });
                      }}
                    />
                    <DragHandle
                      position={[face.position[0], face.position[1], face.position[2] + face.size[0] / 2]}
                      axis="z"
                      onDrag={(deltaMm) => {
                        const newLen = Math.max(1000, wall.length + deltaMm);
                        updateWall(face.side, { length: newLen });
                      }}
                    />
                  </>
                )}
              </>
            )}
          </group>
        );
      })}

      {/* ── Dimension Labels ─────────────────────── */}
      {showDimensions !== 'off' && (
        <group>
          {/* Width dimension */}
          <DimensionLabel
            start={[-width / 2, 0.05, depth / 2 + 0.8]}
            end={[width / 2, 0.05, depth / 2 + 0.8]}
            label={`${Math.round(width * 1000)} mm`}
            offsetDir={[0, 0.15, 0]}
            color="#00ff88"
          />

          {/* Depth dimension */}
          <DimensionLabel
            start={[width / 2 + 0.8, 0.05, -depth / 2]}
            end={[width / 2 + 0.8, 0.05, depth / 2]}
            label={`${Math.round(depth * 1000)} mm`}
            offsetDir={[0.15, 0.15, 0]}
            color="#00ff88"
          />

          {/* Height dimension */}
          <DimensionLabel
            start={[width / 2 + 0.8, 0, -depth / 2]}
            end={[width / 2 + 0.8, height, -depth / 2]}
            label={`${Math.round(height * 1000)} mm`}
            offsetDir={[0.15, 0, 0]}
            color="#00aaff"
          />

          {/* All mode: wall heights */}
          {showDimensions === 'all' && (
            <>
              {wallFaces.filter(f => walls[f.side].enabled).map(face => {
                const wall = walls[face.side];
                return (
                  <DimensionLabel
                    key={`wall-h-${face.side}`}
                    start={[face.dimLabelPos[0] + 0.3, 0, face.dimLabelPos[2]]}
                    end={[face.dimLabelPos[0] + 0.3, mm(wall.height), face.dimLabelPos[2]]}
                    label={`${wall.height} mm`}
                    offsetDir={[0.15, 0, 0]}
                    color="#ff8844"
                  />
                );
              })}
            </>
          )}
        </group>
      )}
    </group>
  );
}
