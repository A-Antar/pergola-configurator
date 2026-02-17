/**
 * QA Test Panel — /dev/qa
 * Acceptance test configs + debug toggles for verifying 3D geometry.
 */

import { useState, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bug, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import PatioScene from '@/components/configurator/PatioScene';
import type { PatioConfig } from '@/types/configurator';
import { DEFAULT_PATIO_CONFIG } from '@/types/configurator';
import { buildPatioPipeline } from '@/lib/patio-engine';

interface TestCase {
  name: string;
  description: string;
  config: PatioConfig;
  checks: string[];
}

const TEST_CASES: TestCase[] = [
  {
    name: 'T1: Attached Back + Flat + Cooldek 3×3',
    description: 'Basic attached patio, insulated, small size',
    config: {
      ...DEFAULT_PATIO_CONFIG,
      material: 'insulated',
      shape: 'flat',
      style: 'fly-over',
      width: 3,
      depth: 3,
      height: 2.8,
      attachedSides: ['back'],
    },
    checks: [
      'Back posts removed (attached)',
      'Cream underside visible from below',
      'Cooldek ribs on top',
      'No gaps between sheet and frame',
    ],
  },
  {
    name: 'T2: Attached + Gable + Superdek 6×4',
    description: 'Gable roof with Superdek ridges',
    config: {
      ...DEFAULT_PATIO_CONFIG,
      material: 'colorbond',
      colorbondType: 'superdek',
      shape: 'gable',
      style: 'fly-over',
      width: 6,
      depth: 4,
      height: 3.0,
      attachedSides: ['back'],
    },
    checks: [
      'Two sloped panels meeting at ridge',
      'Ridge cap/beam visible',
      'Triangular gable end infills',
      'Superdek ridges on slopes',
    ],
  },
  {
    name: 'T3: Freestanding + Flat + Insulated 8×4',
    description: 'Wide freestanding — auto mid-posts expected',
    config: {
      ...DEFAULT_PATIO_CONFIG,
      material: 'insulated',
      shape: 'flat',
      style: 'free-standing',
      width: 8,
      depth: 4,
      height: 3.2,
      attachedSides: ['back'],
    },
    checks: [
      'All 4 corners have posts (freestanding)',
      'Mid-posts added for 8m span',
      'No wall brackets',
      'Sheet covers full frame',
    ],
  },
  {
    name: 'T4: Attached L+B + Flat + Flatdek 5×3.5',
    description: 'Left + Back attached — corner post removal',
    config: {
      ...DEFAULT_PATIO_CONFIG,
      material: 'colorbond',
      colorbondType: 'flatdek',
      shape: 'flat',
      style: 'fly-over',
      width: 5,
      depth: 3.5,
      height: 2.8,
      attachedSides: ['back', 'left'],
    },
    checks: [
      'Back-left corner post removed',
      'Wall brackets on back AND left',
      'Right side has posts',
      'Flat smooth sheet (no ribs)',
    ],
  },
  {
    name: 'T5: Skyline + Insulated 6×4',
    description: 'Skyline split-level roof',
    config: {
      ...DEFAULT_PATIO_CONFIG,
      material: 'insulated',
      shape: 'flat',
      style: 'skyline',
      width: 6,
      depth: 4,
      height: 3.0,
      attachedSides: ['back'],
    },
    checks: [
      'Two sheet levels (stepped)',
      'Skylight strip between',
      'No gap at edges',
    ],
  },
];

export default function QATestPanel() {
  const navigate = useNavigate();
  const [activeTest, setActiveTest] = useState(0);
  const [debugMode, setDebugMode] = useState(false);
  const [showLabels, setShowLabels] = useState(true);

  const tc = TEST_CASES[activeTest];
  const pipeline = buildPatioPipeline(tc.config);

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="shrink-0 border-b border-border px-4 py-3 flex items-center gap-3 bg-background/80 backdrop-blur z-10">
        <button onClick={() => navigate('/')} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <Bug className="w-5 h-5 text-primary" />
        <h1 className="font-display text-lg font-bold text-primary">QA Test Panel</h1>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: test list + debug info */}
        <div className="w-[360px] shrink-0 border-r border-border overflow-y-auto p-4 space-y-4">
          {/* Debug toggles */}
          <div className="bg-card border border-border rounded-lg p-3 space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Debug Toggles</h3>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Skeleton Mode</span>
              <Switch checked={debugMode} onCheckedChange={setDebugMode} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Part Labels</span>
              <Switch checked={showLabels} onCheckedChange={setShowLabels} />
            </div>
          </div>

          {/* Test cases */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">Acceptance Tests</h3>
            {TEST_CASES.map((t, i) => (
              <button
                key={i}
                onClick={() => setActiveTest(i)}
                className={`w-full text-left p-3 rounded-lg border text-sm transition-all ${
                  i === activeTest
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-card hover:border-primary/40'
                }`}
              >
                <span className="font-medium text-foreground">{t.name}</span>
                <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>
              </button>
            ))}
          </div>

          {/* Active test checks */}
          <div className="bg-card border border-border rounded-lg p-3 space-y-2">
            <h4 className="text-sm font-semibold text-foreground">Checklist</h4>
            {tc.checks.map((check, i) => (
              <label key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                <input type="checkbox" className="mt-0.5 accent-primary" />
                {check}
              </label>
            ))}
          </div>

          {/* Pipeline summary */}
          <div className="bg-card border border-border rounded-lg p-3 space-y-1">
            <h4 className="text-sm font-semibold text-foreground">Pipeline Output</h4>
            <p className="text-xs text-muted-foreground">
              Patio Type: <span className="text-foreground">{pipeline.layout.patioType.label} — {pipeline.layout.patioType.description}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Beam: <span className="text-foreground">{pipeline.layout.beam.label}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Sheet: <span className="text-foreground">{pipeline.layout.sheet.label}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Parts: <span className="text-foreground">{pipeline.parts.length}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Posts: <span className="text-foreground">{pipeline.layout.postPositions.length}</span>
            </p>
          </div>
        </div>

        {/* Right: 3D viewer */}
        <div className="flex-1 relative">
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-full">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            }
          >
            <PatioScene
              config={tc.config}
              debugMode={debugMode}
              debugParts={debugMode ? pipeline.parts : undefined}
              showDebugLabels={showLabels}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
