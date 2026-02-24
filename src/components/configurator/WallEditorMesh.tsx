import { useRef, useState, useMemo, useCallback, useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { Text, Line, Html } from "@react-three/drei";
import * as THREE from "three";
import type { PatioConfig, WallSide, WallConfig } from "@/types/configurator";

interface WallEditorMeshProps {
  config: PatioConfig;
  onChange: (config: PatioConfig) => void;
  selectedWall: WallSide | null;
  onSelectWall: (side: WallSide | null) => void;
  showDimensions: 'off' | 'key' | 'all';
  onDragging?: (isDragging: boolean) => void;
  onSliderOpen?: (open: boolean) => void;
}

const mm = (v: number) => v / 1000;

/* ── Slider Popover (HTML overlay in 3D) ──────── */
function DimensionSlider({ value, min, max, step, unit, onClose, onChange }: {
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onClose: () => void;
  onChange: (v: number) => void;
}) {
  const [localValue, setLocalValue] = useState(value);

  // Sync local when external value changes (e.g. from another source)
  useEffect(() => { setLocalValue(value); }, [value]);

  const handleChange = useCallback((v: number) => {
    setLocalValue(v);
  }, []);

  const handleRelease = useCallback(() => {
    onChange(localValue);
  }, [onChange, localValue]);

  return (
    <div
      className="bg-card border border-border rounded-lg shadow-xl p-3 min-w-[200px]"
      style={{ pointerEvents: 'auto' }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-foreground">
          {localValue.toFixed(step < 1 ? 1 : 0)} {unit}
        </span>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground text-xs ml-2 p-0.5"
        >
          ✕
        </button>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={localValue}
        onChange={(e) => handleChange(parseFloat(e.target.value))}
        onMouseUp={handleRelease}
        onTouchEnd={handleRelease}
        className="w-full accent-primary h-2 cursor-pointer"
      />
      <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
}

/* ── Dimension Arrow with clickable endpoints ──── */
function DimensionArrow({ start, end, label, sideLabel, axis, offsetDir, color = '#333333', onEndpointClick, activeEnd }: {
  start: [number, number, number];
  end: [number, number, number];
  label: string;
  sideLabel: string;
  axis: 'x' | 'z' | 'y';
  offsetDir: [number, number, number];
  color?: string;
  onEndpointClick: (which: 'start' | 'end') => void;
  activeEnd: 'start' | 'end' | null;
}) {
  const [hovered, setHovered] = useState<'start' | 'end' | null>(null);
  const { gl } = useThree();

  const midpoint: [number, number, number] = [
    (start[0] + end[0]) / 2 + offsetDir[0],
    (start[1] + end[1]) / 2 + offsetDir[1],
    (start[2] + end[2]) / 2 + offsetDir[2],
  ];

  const sideLabelPos: [number, number, number] = [
    end[0] + offsetDir[0] * 2,
    end[1] + offsetDir[1] * 2 + 0.15,
    end[2] + offsetDir[2] * 2,
  ];

  const linePoints = useMemo((): [number, number, number][] => [start, end], [start, end]);

  const tickSize = 0.12;
  const startTick = useMemo((): [number, number, number][] => {
    if (axis === 'x') return [[start[0], start[1] - tickSize, start[2]], [start[0], start[1] + tickSize, start[2]]];
    if (axis === 'z') return [[start[0], start[1] - tickSize, start[2]], [start[0], start[1] + tickSize, start[2]]];
    return [[start[0] - tickSize, start[1], start[2]], [start[0] + tickSize, start[1], start[2]]];
  }, [start, axis]);

  const endTick = useMemo((): [number, number, number][] => {
    if (axis === 'x') return [[end[0], end[1] - tickSize, end[2]], [end[0], end[1] + tickSize, end[2]]];
    if (axis === 'z') return [[end[0], end[1] - tickSize, end[2]], [end[0], end[1] + tickSize, end[2]]];
    return [[end[0] - tickSize, end[1], end[2]], [end[0] + tickSize, end[1], end[2]]];
  }, [end, axis]);

  const activeColor = activeEnd ? '#f59e0b' : hovered ? '#16a34a' : color;
  const lineOpacity = activeEnd ? 0.95 : hovered ? 0.9 : 0.6;

  const handleEndpointColor = (which: 'start' | 'end') => {
    if (activeEnd === which) return '#f59e0b';
    if (hovered === which) return '#22c55e';
    return '#555555';
  };

  const handleEndpointEmissive = (which: 'start' | 'end') => {
    if (activeEnd === which) return 0.6;
    if (hovered === which) return 0.4;
    return 0.1;
  };

  return (
    <group>
      <Line points={linePoints} color={activeColor} lineWidth={1.5} transparent opacity={lineOpacity} dashed dashSize={0.08} dashOffset={0} gapSize={0.05} />
      <Line points={startTick} color={activeColor} lineWidth={1.5} transparent opacity={lineOpacity} />
      <Line points={endTick} color={activeColor} lineWidth={1.5} transparent opacity={lineOpacity} />

      <Text position={midpoint} fontSize={0.14} color={activeColor} anchorX="center" anchorY="middle" outlineWidth={0.006} outlineColor="#ffffff" renderOrder={999} fontWeight="bold">
        {label}
      </Text>

      {sideLabel && (
        <Text position={sideLabelPos} fontSize={0.22} color={activeColor} anchorX="center" anchorY="middle" outlineWidth={0.008} outlineColor="#ffffff" renderOrder={999} fontWeight="bold">
          {sideLabel}
        </Text>
      )}

      {/* End handle */}
      <mesh
        position={end}
        onPointerEnter={() => { setHovered('end'); (gl.domElement as HTMLElement).style.cursor = 'pointer'; }}
        onPointerLeave={() => { setHovered(null); (gl.domElement as HTMLElement).style.cursor = ''; }}
        onClick={(e) => { e.stopPropagation(); onEndpointClick('end'); }}
      >
        <coneGeometry args={[0.06, 0.15, 8]} />
        <meshPhysicalMaterial color={handleEndpointColor('end')} emissive={handleEndpointColor('end')} emissiveIntensity={handleEndpointEmissive('end')} roughness={0.4} />
      </mesh>

      {/* Start handle */}
      <mesh
        position={start}
        onPointerEnter={() => { setHovered('start'); (gl.domElement as HTMLElement).style.cursor = 'pointer'; }}
        onPointerLeave={() => { setHovered(null); (gl.domElement as HTMLElement).style.cursor = ''; }}
        onClick={(e) => { e.stopPropagation(); onEndpointClick('start'); }}
      >
        <coneGeometry args={[0.06, 0.15, 8]} />
        <meshPhysicalMaterial color={handleEndpointColor('start')} emissive={handleEndpointColor('start')} emissiveIntensity={handleEndpointEmissive('start')} roughness={0.4} />
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
  config, onChange, selectedWall, onSelectWall, showDimensions, onDragging, onSliderOpen,
}: WallEditorMeshProps) {
  const [hoveredWall, setHoveredWall] = useState<WallSide | null>(null);
  const [activeSlider, setActiveSlider] = useState<{ dim: 'width' | 'depth' | 'height'; which: 'start' | 'end' } | null>(null);
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

  const handleEndpointClick = useCallback((dim: 'width' | 'depth' | 'height', which: 'start' | 'end') => {
    setActiveSlider(prev => {
      const closing = prev?.dim === dim && prev?.which === which;
      onSliderOpen?.(!closing);
      return closing ? null : { dim, which };
    });
  }, [onSliderOpen]);

  const handleSliderChange = useCallback((dim: 'width' | 'depth' | 'height', value: number) => {
    if (dim === 'width') {
      onChange({ ...config, width: value });
    } else if (dim === 'depth') {
      onChange({ ...config, depth: value });
    } else {
      onChange({ ...config, height: value });
    }
  }, [config, onChange]);

  const dimOffset = 0.6;

  // Slider position — place at the active endpoint
  const sliderPosition = useMemo((): [number, number, number] | null => {
    if (!activeSlider) return null;
    const { dim, which } = activeSlider;
    if (dim === 'width') {
      const x = which === 'end' ? width / 2 : -width / 2;
      return [x, 0.4, depth / 2 + dimOffset];
    }
    if (dim === 'depth') {
      const z = which === 'start' ? depth / 2 : -depth / 2;
      return [width / 2 + dimOffset, 0.4, z];
    }
    // height
    const y = which === 'end' ? height : 0;
    return [width / 2 + dimOffset, y, -depth / 2 - dimOffset];
  }, [activeSlider, width, depth, height, dimOffset]);

  const sliderConfig = useMemo(() => {
    if (!activeSlider) return null;
    const { dim } = activeSlider;
    if (dim === 'width') return { value: width, min: 2, max: 12, step: 0.1, unit: 'm' };
    if (dim === 'depth') return { value: depth, min: 2, max: 8, step: 0.1, unit: 'm' };
    return { value: height, min: 2.4, max: 4.5, step: 0.1, unit: 'm' };
  }, [activeSlider, width, depth, height]);

  return (
    <group>
      {/* A — Front edge (width) */}
      <DimensionArrow
        start={[-width / 2, 0.05, depth / 2 + dimOffset]}
        end={[width / 2, 0.05, depth / 2 + dimOffset]}
        label={`${(width * 1000).toFixed(0)}mm`}
        sideLabel="A"
        axis="x"
        offsetDir={[0, 0.2, 0]}
        onEndpointClick={(which) => handleEndpointClick('width', which)}
        activeEnd={activeSlider?.dim === 'width' ? activeSlider.which : null}
      />

      {/* B — Right edge (depth) */}
      <DimensionArrow
        start={[width / 2 + dimOffset, 0.05, depth / 2]}
        end={[width / 2 + dimOffset, 0.05, -depth / 2]}
        label={`${(depth * 1000).toFixed(0)}mm`}
        sideLabel="B"
        axis="z"
        offsetDir={[0.2, 0.2, 0]}
        onEndpointClick={(which) => handleEndpointClick('depth', which)}
        activeEnd={activeSlider?.dim === 'depth' ? activeSlider.which : null}
      />

      {/* C — Back edge (width) */}
      <DimensionArrow
        start={[width / 2, 0.05, -depth / 2 - dimOffset]}
        end={[-width / 2, 0.05, -depth / 2 - dimOffset]}
        label={`${(width * 1000).toFixed(0)}mm`}
        sideLabel="C"
        axis="x"
        offsetDir={[0, 0.2, 0]}
        onEndpointClick={(which) => handleEndpointClick('width', which === 'start' ? 'end' : 'start')}
        activeEnd={activeSlider?.dim === 'width' ? (activeSlider.which === 'start' ? 'end' : 'start') : null}
      />

      {/* D — Left edge (depth) */}
      <DimensionArrow
        start={[-width / 2 - dimOffset, 0.05, -depth / 2]}
        end={[-width / 2 - dimOffset, 0.05, depth / 2]}
        label={`${(depth * 1000).toFixed(0)}mm`}
        sideLabel="D"
        axis="z"
        offsetDir={[-0.2, 0.2, 0]}
        onEndpointClick={(which) => handleEndpointClick('depth', which === 'start' ? 'end' : 'start')}
        activeEnd={activeSlider?.dim === 'depth' ? (activeSlider.which === 'start' ? 'end' : 'start') : null}
      />

      {/* Height — right-back corner */}
      <DimensionArrow
        start={[width / 2 + dimOffset, 0, -depth / 2 - dimOffset]}
        end={[width / 2 + dimOffset, height, -depth / 2 - dimOffset]}
        label={`${(height * 1000).toFixed(0)}mm`}
        sideLabel=""
        axis="y"
        offsetDir={[0.2, 0, 0]}
        onEndpointClick={(which) => handleEndpointClick('height', which)}
        activeEnd={activeSlider?.dim === 'height' ? activeSlider.which : null}
      />

      {/* ── Slider popover (HTML overlay at 3D position) ── */}
      {activeSlider && sliderPosition && sliderConfig && (
        <Html position={sliderPosition} center distanceFactor={8} style={{ pointerEvents: 'auto' }}>
          <DimensionSlider
            value={sliderConfig.value}
            min={sliderConfig.min}
            max={sliderConfig.max}
            step={sliderConfig.step}
            unit={sliderConfig.unit}
            onChange={(v) => handleSliderChange(activeSlider.dim, v)}
            onClose={() => { setActiveSlider(null); onSliderOpen?.(false); }}
          />
        </Html>
      )}

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
