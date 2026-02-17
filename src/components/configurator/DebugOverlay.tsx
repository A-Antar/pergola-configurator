/**
 * Debug Skeleton Mode overlay for the 3D viewer.
 * Renders axis gizmos, bounding boxes, and labels for each part.
 */

import { Text } from '@react-three/drei';
import * as THREE from 'three';
import type { Part } from '@/lib/patio-engine';

const wireframeMat = new THREE.MeshBasicMaterial({
  color: '#00ff88',
  wireframe: true,
  transparent: true,
  opacity: 0.6,
});

const labelColor = '#00ffaa';

interface DebugOverlayProps {
  parts: Part[];
  showLabels?: boolean;
  showBoundingBoxes?: boolean;
}

export default function DebugOverlay({ parts, showLabels = true, showBoundingBoxes = true }: DebugOverlayProps) {
  // Filter to structural parts only (skip ground/wall for clarity)
  const structural = parts.filter(p => !['ground', 'wall'].includes(p.kind));

  return (
    <group>
      {structural.map((part) => (
        <group key={part.id} position={part.position} rotation={part.rotation}>
          {/* Bounding box wireframe */}
          {showBoundingBoxes && (
            <mesh material={wireframeMat}>
              <boxGeometry args={part.dimensions} />
            </mesh>
          )}

          {/* Label */}
          {showLabels && (
            <Text
              position={[0, part.dimensions[1] / 2 + 0.08, 0]}
              fontSize={0.06}
              color={labelColor}
              anchorX="center"
              anchorY="bottom"
            >
              {part.metadata?.label || `${part.kind} ${part.id.split('-').pop()}`}
            </Text>
          )}

          {/* Mini axis gizmo */}
          <axesHelper args={[0.15]} />
        </group>
      ))}
    </group>
  );
}
