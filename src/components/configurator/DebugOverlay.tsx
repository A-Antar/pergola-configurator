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

const labelColor = '#ffffff';
const labelBg = '#000000';

interface DebugOverlayProps {
  parts: Part[];
  showLabels?: boolean;
  showBoundingBoxes?: boolean;
}

export default function DebugOverlay({ parts, showLabels = true, showBoundingBoxes = true }: DebugOverlayProps) {
  const structural = parts.filter(p => !['ground', 'wall'].includes(p.kind));

  return (
    <group>
      {structural.map((part) => {
        // Determine the longest axis to orient the label along it
        const [dx, dy, dz] = part.dimensions;
        const longest = Math.max(dx, dz);
        const alongX = dx >= dz;

        return (
          <group key={part.id} position={part.position} rotation={part.rotation}>
            {showBoundingBoxes && (
              <mesh material={wireframeMat}>
                <boxGeometry args={part.dimensions} />
              </mesh>
            )}

            {showLabels && (
              <Text
                position={[0, dy / 2 + 0.05, 0]}
                rotation={alongX ? [0, 0, 0] : [0, Math.PI / 2, 0]}
                fontSize={Math.min(0.12, longest * 0.35)}
                color={labelColor}
                outlineColor={labelBg}
                outlineWidth={0.012}
                anchorX="center"
                anchorY="bottom"
                fontWeight="bold"
              >
                {part.metadata?.label || `${part.kind} ${part.id.split('-').pop()}`}
              </Text>
            )}

            <axesHelper args={[0.15]} />
          </group>
        );
      })}
    </group>
  );
}
