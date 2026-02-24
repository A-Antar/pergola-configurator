/**
 * High-detail 3D Deck Mesh
 * Individual boards with gaps, visible joists, bearers, and posts.
 */
import { useMemo } from "react";
import * as THREE from "three";
import type { DeckingConfig } from "@/types/decking";

// Board dimensions (metres)
const BOARD_W = 0.138;
const BOARD_GAP = 0.005;
const BOARD_H = 0.022;

const JOIST_W = 0.045;
const JOIST_H = 0.140;
const JOIST_SPACING = 0.45;

const BEARER_W = 0.090;
const BEARER_H = 0.090;
const BEARER_SPACING = 1.8;

const POST_SIZE = 0.090;

interface DeckMeshProps {
  config: DeckingConfig;
}

function createBoardMaterial(hex: string) {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(hex),
    roughness: 0.7,
    metalness: 0.0,
  });
}

function createFrameMaterial() {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color('#8b7355'),
    roughness: 0.75,
    metalness: 0.0,
  });
}

export default function DeckMesh({ config }: DeckMeshProps) {
  const { length, width, height, color, boardDirection } = config;

  const boardMat = useMemo(() => createBoardMaterial(color), [color]);
  const frameMat = useMemo(() => createFrameMaterial(), []);

  // Board direction determines primary/secondary axes
  const boardLen = boardDirection === 'lengthwise' ? length : width;
  const boardSpanDir = boardDirection === 'lengthwise' ? width : length;

  const boardCount = Math.floor(boardSpanDir / (BOARD_W + BOARD_GAP));
  const boardGeo = useMemo(() => new THREE.BoxGeometry(boardLen, BOARD_H, BOARD_W), [boardLen]);

  // Joists perpendicular to boards
  const joistLen = boardSpanDir;
  const joistPrimarySpan = boardLen;
  const joistCount = Math.floor(joistPrimarySpan / JOIST_SPACING) + 1;
  const joistGeo = useMemo(() => new THREE.BoxGeometry(JOIST_W, JOIST_H, joistLen), [joistLen]);

  // Bearers perpendicular to joists
  const bearerLen = boardLen;
  const bearerSpan = boardSpanDir;
  const bearerCount = Math.floor(bearerSpan / BEARER_SPACING) + 1;
  const bearerGeo = useMemo(() => new THREE.BoxGeometry(bearerLen, BEARER_H, BEARER_W), [bearerLen]);

  // Posts
  const postGeo = useMemo(() => new THREE.BoxGeometry(POST_SIZE, height - BEARER_H - JOIST_H - BOARD_H, POST_SIZE), [height]);
  const postPositions = useMemo(() => {
    const positions: [number, number, number][] = [];
    const colCount = Math.floor(boardLen / BEARER_SPACING) + 1;
    for (let b = 0; b < bearerCount; b++) {
      for (let c = 0; c < colCount; c++) {
        const x = -boardLen / 2 + c * (boardLen / Math.max(colCount - 1, 1));
        const z = -bearerSpan / 2 + b * (bearerSpan / Math.max(bearerCount - 1, 1));
        positions.push([x, 0, z]);
      }
    }
    return positions;
  }, [boardLen, bearerSpan, bearerCount]);

  const deckTopY = height;
  const boardY = deckTopY - BOARD_H / 2;
  const joistY = deckTopY - BOARD_H - JOIST_H / 2;
  const bearerY = deckTopY - BOARD_H - JOIST_H - BEARER_H / 2;
  const postH = height - BOARD_H - JOIST_H - BEARER_H;
  const postY = postH / 2;

  // Stairs
  const stairElements = useMemo(() => {
    if (!config.stairs.enabled) return null;
    const stairWidth = config.stairs.width;
    const riseCount = Math.max(Math.ceil(height / 0.18), 1);
    const treadDepth = 0.28;
    const riseHeight = height / riseCount;
    const elements: { pos: [number, number, number]; size: [number, number, number] }[] = [];

    for (let i = 0; i < riseCount; i++) {
      const y = riseHeight * (i + 0.5);
      let x = 0, z = 0;
      if (config.stairs.position === 'front') {
        z = width / 2 + treadDepth * (riseCount - i - 0.5);
      } else if (config.stairs.position === 'left') {
        x = -(length / 2 + treadDepth * (riseCount - i - 0.5));
      } else {
        x = length / 2 + treadDepth * (riseCount - i - 0.5);
      }
      elements.push({ pos: [x, y, z], size: [config.stairs.position === 'front' ? stairWidth : treadDepth, BOARD_H, config.stairs.position === 'front' ? treadDepth : stairWidth] });
    }
    return elements;
  }, [config.stairs, height, length, width]);

  // Railings
  const railElements = useMemo(() => {
    if (config.railingStyle === 'none') return [];
    const RAIL_H = 1.0;
    const RAIL_W = 0.05;
    const elements: { pos: [number, number, number]; size: [number, number, number]; isPost?: boolean }[] = [];

    config.railingPositions.forEach((side) => {
      const sideLen = side === 'front' || side === 'back' ? length : width;
      const postCount = Math.max(Math.ceil(sideLen / 1.5) + 1, 2);

      // Top rail
      let rx = 0, rz = 0;
      if (side === 'front') rz = width / 2;
      else if (side === 'back') rz = -width / 2;
      else if (side === 'left') rx = -length / 2;
      else rx = length / 2;

      const horizontal = side === 'front' || side === 'back';
      elements.push({
        pos: [rx, deckTopY + RAIL_H, rz],
        size: horizontal ? [sideLen, RAIL_W, RAIL_W] : [RAIL_W, RAIL_W, sideLen],
      });

      // Posts
      for (let p = 0; p < postCount; p++) {
        const t = postCount === 1 ? 0 : p / (postCount - 1);
        const offset = -sideLen / 2 + t * sideLen;
        let px = rx, pz = rz;
        if (horizontal) px = offset; else pz = offset;
        elements.push({
          pos: [px, deckTopY + RAIL_H / 2, pz],
          size: [RAIL_W, RAIL_H, RAIL_W],
          isPost: true,
        });
      }

      // Infill: wire = horizontal lines, timber = vertical balusters, glass = panel
      if (config.railingStyle === 'wire') {
        for (let w = 1; w <= 4; w++) {
          const wy = deckTopY + (RAIL_H * w) / 5;
          elements.push({
            pos: [rx, wy, rz],
            size: horizontal ? [sideLen, 0.006, 0.006] : [0.006, 0.006, sideLen],
          });
        }
      } else if (config.railingStyle === 'timber') {
        const balCount = Math.ceil(sideLen / 0.12);
        for (let b = 0; b < balCount; b++) {
          const t2 = balCount === 1 ? 0 : b / (balCount - 1);
          const off = -sideLen / 2 + t2 * sideLen;
          let bx = rx, bz = rz;
          if (horizontal) bx = off; else bz = off;
          elements.push({
            pos: [bx, deckTopY + RAIL_H / 2, bz],
            size: [0.02, RAIL_H * 0.85, 0.02],
          });
        }
      }
    });
    return elements;
  }, [config.railingStyle, config.railingPositions, length, width, deckTopY]);

  // Glass railing panels
  const glassPanels = useMemo(() => {
    if (config.railingStyle !== 'glass') return [];
    const RAIL_H = 1.0;
    const panels: { pos: [number, number, number]; size: [number, number, number] }[] = [];
    config.railingPositions.forEach((side) => {
      const sideLen = side === 'front' || side === 'back' ? length : width;
      let rx = 0, rz = 0;
      if (side === 'front') rz = width / 2;
      else if (side === 'back') rz = -width / 2;
      else if (side === 'left') rx = -length / 2;
      else rx = length / 2;
      const horizontal = side === 'front' || side === 'back';
      panels.push({
        pos: [rx, deckTopY + RAIL_H / 2, rz],
        size: horizontal ? [sideLen, RAIL_H * 0.9, 0.012] : [0.012, RAIL_H * 0.9, sideLen],
      });
    });
    return panels;
  }, [config.railingStyle, config.railingPositions, length, width, deckTopY]);

  const glassMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#aaddff'),
    transparent: true,
    opacity: 0.25,
    roughness: 0.05,
    metalness: 0.0,
    transmission: 0.7,
  }), []);

  const railMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color('#444444'),
    roughness: 0.4,
    metalness: 0.6,
  }), []);

  // Foundation materials
  const foundationType = config.foundation?.type ?? 'landscape';
  const grassMat = useMemo(() => new THREE.MeshStandardMaterial({ color: new THREE.Color('#4a6b35'), roughness: 0.85 }), []);
  const soilMat = useMemo(() => new THREE.MeshStandardMaterial({ color: new THREE.Color('#5a4a3a'), roughness: 0.95 }), []);
  const soilDarkMat = useMemo(() => new THREE.MeshStandardMaterial({ color: new THREE.Color('#3d3028'), roughness: 0.9 }), []);
  const concreteMat = useMemo(() => new THREE.MeshStandardMaterial({ color: new THREE.Color('#b0aca6'), roughness: 0.75, metalness: 0.05 }), []);
  const crackedMat = useMemo(() => new THREE.MeshStandardMaterial({ color: new THREE.Color('#a09a92'), roughness: 0.8 }), []);
  const crackLineMat = useMemo(() => new THREE.MeshStandardMaterial({ color: new THREE.Color('#6b6560'), roughness: 0.9 }), []);
  const holeEdgeMat = useMemo(() => new THREE.MeshStandardMaterial({ color: new THREE.Color('#7a7570'), roughness: 0.7 }), []);

  return (
    <group>
      {/* Foundation base */}
      {foundationType === 'landscape' && (
        <group>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} material={grassMat} receiveShadow>
            <planeGeometry args={[length + 4, width + 4]} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.005, 0]} material={soilMat} receiveShadow>
            <planeGeometry args={[length + 0.6, width + 0.6]} />
          </mesh>
          {postPositions.map(([x, _, z], i) => (
            <group key={`fh-${i}`} position={[x, 0, z]}>
              <mesh position={[0, -0.3, 0]} material={soilDarkMat}>
                <boxGeometry args={[0.6, 0.6, 0.6]} />
              </mesh>
            </group>
          ))}
        </group>
      )}
      {foundationType === 'concrete-thick' && (
        <group>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} material={grassMat} receiveShadow>
            <planeGeometry args={[length + 4, width + 4]} />
          </mesh>
          <mesh position={[0, -0.075, 0]} material={concreteMat} receiveShadow castShadow>
            <boxGeometry args={[length + 1, 0.15, width + 1]} />
          </mesh>
          {postPositions.map(([x, _, z], i) => (
            <mesh key={`bp-${i}`} position={[x, 0.002, z]} rotation={[-Math.PI / 2, 0, 0]} material={holeEdgeMat}>
              <planeGeometry args={[POST_SIZE + 0.04, POST_SIZE + 0.04]} />
            </mesh>
          ))}
        </group>
      )}
      {foundationType === 'concrete-thin' && (
        <group>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} material={grassMat} receiveShadow>
            <planeGeometry args={[length + 4, width + 4]} />
          </mesh>
          <mesh position={[0, -0.05, 0]} material={crackedMat} receiveShadow castShadow>
            <boxGeometry args={[length + 1, 0.1, width + 1]} />
          </mesh>
          {Array.from({ length: 5 }).map((_, i) => {
            const angle = (i * 37 + 15) * (Math.PI / 180);
            const cx = (i - 2) * 0.8;
            const cz = (i % 2 === 0 ? 0.3 : -0.4) * (i - 2);
            return (
              <mesh key={`crack-${i}`} position={[cx, 0.002, cz]} rotation={[-Math.PI / 2, angle, 0]} material={crackLineMat}>
                <planeGeometry args={[0.008, 1.5 + i * 0.3]} />
              </mesh>
            );
          })}
          {postPositions.map(([x, _, z], i) => (
            <group key={`core-${i}`} position={[x, 0, z]}>
              <mesh position={[0, -0.3, 0]} material={soilDarkMat}>
                <cylinderGeometry args={[0.3, 0.3, 0.6, 16]} />
              </mesh>
              <mesh position={[0, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]} material={holeEdgeMat}>
                <ringGeometry args={[0.28, 0.34, 16]} />
              </mesh>
            </group>
          ))}
        </group>
      )}

      {/* Deck boards */}
      {Array.from({ length: boardCount }).map((_, i) => {
        const offset = -boardSpanDir / 2 + (BOARD_W + BOARD_GAP) * i + BOARD_W / 2;
        const pos: [number, number, number] = boardDirection === 'lengthwise'
          ? [0, boardY, offset]
          : [offset, boardY, 0];
        const rot: [number, number, number] = boardDirection === 'widthwise'
          ? [0, Math.PI / 2, 0]
          : [0, 0, 0];
        return (
          <mesh key={`b${i}`} geometry={boardGeo} material={boardMat} position={pos} rotation={rot} castShadow receiveShadow />
        );
      })}

      {/* Joists */}
      {Array.from({ length: joistCount }).map((_, i) => {
        const offset = -joistPrimarySpan / 2 + JOIST_SPACING * i;
        const clampedOffset = Math.min(offset, joistPrimarySpan / 2);
        const pos: [number, number, number] = boardDirection === 'lengthwise'
          ? [clampedOffset, joistY, 0]
          : [0, joistY, clampedOffset];
        const rot: [number, number, number] = boardDirection === 'widthwise'
          ? [0, Math.PI / 2, 0]
          : [0, 0, 0];
        return (
          <mesh key={`j${i}`} geometry={joistGeo} material={frameMat} position={pos} rotation={rot} castShadow />
        );
      })}

      {/* Bearers */}
      {Array.from({ length: bearerCount }).map((_, i) => {
        const offset = -bearerSpan / 2 + (bearerSpan / Math.max(bearerCount - 1, 1)) * i;
        const pos: [number, number, number] = boardDirection === 'lengthwise'
          ? [0, bearerY, offset]
          : [offset, bearerY, 0];
        const rot: [number, number, number] = boardDirection === 'widthwise'
          ? [0, Math.PI / 2, 0]
          : [0, 0, 0];
        return (
          <mesh key={`br${i}`} geometry={bearerGeo} material={frameMat} position={pos} rotation={rot} castShadow />
        );
      })}

      {/* Posts */}
      {postPositions.map(([x, _, z], i) => (
        <mesh key={`p${i}`} geometry={postGeo} material={frameMat} position={[x, postY, z]} castShadow />
      ))}

      {/* Stairs */}
      {stairElements?.map((el, i) => (
        <mesh key={`s${i}`} castShadow receiveShadow position={el.pos}>
          <boxGeometry args={el.size} />
          <meshStandardMaterial color={color} roughness={0.7} />
        </mesh>
      ))}

      {/* Railings (metal parts) */}
      {railElements.map((el, i) => (
        <mesh key={`r${i}`} material={railMat} position={el.pos} castShadow>
          <boxGeometry args={el.size} />
        </mesh>
      ))}

      {/* Glass panels */}
      {glassPanels.map((el, i) => (
        <mesh key={`g${i}`} material={glassMat} position={el.pos}>
          <boxGeometry args={el.size} />
        </mesh>
      ))}
    </group>
  );
}
