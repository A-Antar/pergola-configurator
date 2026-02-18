import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Ruler, Move, ArrowUpDown, Box } from "lucide-react";
import type { PatioConfig, WallSide, WallConfig } from "@/types/configurator";
import { useState } from "react";

interface WallEditorPanelProps {
  config: PatioConfig;
  onChange: (config: PatioConfig) => void;
  selectedWall: WallSide | null;
  onSelectWall: (side: WallSide | null) => void;
}

const WALL_LABELS: Record<WallSide, string> = {
  back: 'Back Wall',
  left: 'Left Wall',
  right: 'Right Wall',
  front: 'Front Wall',
};

const WALL_DESCRIPTIONS: Record<WallSide, string> = {
  back: 'House wall — primary attachment',
  left: 'Left side boundary wall',
  right: 'Right side boundary wall',
  front: 'Front boundary or fence',
};

/** Snap to nearest step */
const snap = (val: number, step: number) => Math.round(val / step) * step;

export default function WallEditorPanel({ config, onChange, selectedWall, onSelectWall }: WallEditorPanelProps) {
  const [unit, setUnit] = useState<'mm' | 'm'>('mm');

  const updateWall = (side: WallSide, partial: Partial<WallConfig>) => {
    const newWalls = { ...config.walls, [side]: { ...config.walls[side], ...partial } };
    const attachedSides = (['back', 'left', 'right'] as const).filter(s => newWalls[s].enabled);
    onChange({
      ...config,
      walls: newWalls,
      attachedSides: attachedSides.length > 0 ? attachedSides : ['back'],
    });
  };

  const formatDim = (mm: number) => {
    if (unit === 'm') return `${(mm / 1000).toFixed(2)} m`;
    return `${Math.round(mm)} mm`;
  };

  const selected = selectedWall ? config.walls[selectedWall] : null;

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 pt-5 pb-3">
        <h3 className="font-display text-lg font-semibold text-foreground">Wall Editor</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Select and configure attachment walls
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {/* Unit toggle */}
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Display units</Label>
          <div className="flex gap-1 bg-secondary rounded-md p-0.5">
            {(['mm', 'm'] as const).map(u => (
              <button
                key={u}
                onClick={() => setUnit(u)}
                className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                  unit === u
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {u}
              </button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Wall side selector */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-sm font-medium">
            <Box className="w-4 h-4 text-primary" />
            Wall Sides
          </Label>
          <div className="grid grid-cols-2 gap-2">
            {(['back', 'left', 'right', 'front'] as WallSide[]).map(side => {
              const wall = config.walls[side];
              const isSelected = selectedWall === side;
              return (
                <button
                  key={side}
                  onClick={() => onSelectWall(isSelected ? null : side)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/10 ring-1 ring-primary/30'
                      : wall.enabled
                      ? 'border-primary/40 bg-primary/5'
                      : 'border-border bg-card hover:border-primary/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-foreground capitalize">{side}</span>
                    {wall.enabled && (
                      <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                        attached
                      </Badge>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {wall.enabled ? formatDim(wall.length) : 'Not attached'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected wall details — SLIDER SYSTEM */}
        {selectedWall && selected && (
          <>
            <Separator />
            <div className="space-y-4 bg-card/50 rounded-lg border border-border/50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-display text-sm font-semibold text-foreground">
                    {WALL_LABELS[selectedWall]}
                  </h4>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {WALL_DESCRIPTIONS[selectedWall]}
                  </p>
                </div>
                <Switch
                  checked={selected.enabled}
                  onCheckedChange={(v) => updateWall(selectedWall, { enabled: v })}
                />
              </div>

              {selected.enabled && (
                <div className="space-y-5 pt-2">
                  {/* Wall Height Slider */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <ArrowUpDown className="w-3 h-3" />
                        Wall Height
                      </Label>
                      <span className="text-xs font-medium text-foreground">{formatDim(selected.height)}</span>
                    </div>
                    <Slider
                      value={[selected.height]}
                      onValueChange={([v]) => updateWall(selectedWall, { height: snap(v, 100) })}
                      min={2000}
                      max={6000}
                      step={100}
                      className="w-full"
                    />
                    <div className="flex justify-between text-[9px] text-muted-foreground">
                      <span>2000mm</span>
                      <span>6000mm</span>
                    </div>
                  </div>

                  {/* Wall Length Slider */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Ruler className="w-3 h-3" />
                        Wall Length
                      </Label>
                      <span className="text-xs font-medium text-foreground">{formatDim(selected.length)}</span>
                    </div>
                    <Slider
                      value={[selected.length]}
                      onValueChange={([v]) => updateWall(selectedWall, { length: snap(v, 100) })}
                      min={1000}
                      max={15000}
                      step={100}
                      className="w-full"
                    />
                    <div className="flex justify-between text-[9px] text-muted-foreground">
                      <span>1000mm</span>
                      <span>15000mm</span>
                    </div>
                  </div>

                  {/* Wall Thickness Slider */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Box className="w-3 h-3" />
                        Thickness
                      </Label>
                      <span className="text-xs font-medium text-foreground">{formatDim(selected.thickness)}</span>
                    </div>
                    <Slider
                      value={[selected.thickness]}
                      onValueChange={([v]) => updateWall(selectedWall, { thickness: snap(v, 10) })}
                      min={100}
                      max={500}
                      step={10}
                      className="w-full"
                    />
                    <div className="flex justify-between text-[9px] text-muted-foreground">
                      <span>100mm</span>
                      <span>500mm</span>
                    </div>
                  </div>

                  {/* Offset Slider */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Move className="w-3 h-3" />
                        Offset (from edge)
                      </Label>
                      <span className="text-xs font-medium text-foreground">{formatDim(selected.offset)}</span>
                    </div>
                    <Slider
                      value={[selected.offset]}
                      onValueChange={([v]) => updateWall(selectedWall, { offset: snap(v, 10) })}
                      min={-1000}
                      max={1000}
                      step={10}
                      className="w-full"
                    />
                    <div className="flex justify-between text-[9px] text-muted-foreground">
                      <span>-1000mm</span>
                      <span>+1000mm</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      Positive = outward from patio, negative = inward
                    </p>
                  </div>

                  {/* Info about attachment */}
                  {selectedWall !== 'front' && (
                    <div className="bg-primary/5 border border-primary/20 rounded-md p-2.5 mt-2">
                      <p className="text-[10px] text-primary leading-relaxed">
                        Enabling this wall attaches the patio structure here.
                        Posts on this side are replaced with wall brackets.
                      </p>
                    </div>
                  )}
                  {selectedWall === 'front' && (
                    <div className="bg-muted border border-border rounded-md p-2.5 mt-2">
                      <p className="text-[10px] text-muted-foreground leading-relaxed">
                        Front wall is for context only — it does not attach the patio structure.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* Dimension reference info */}
        <Separator />
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground">Quick Reference</Label>
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className="bg-secondary/50 rounded p-2">
              <span className="text-muted-foreground">Patio Width</span>
              <p className="text-foreground font-medium">{formatDim(config.width * 1000)}</p>
            </div>
            <div className="bg-secondary/50 rounded p-2">
              <span className="text-muted-foreground">Patio Depth</span>
              <p className="text-foreground font-medium">{formatDim(config.depth * 1000)}</p>
            </div>
            <div className="bg-secondary/50 rounded p-2">
              <span className="text-muted-foreground">Patio Height</span>
              <p className="text-foreground font-medium">{formatDim(config.height * 1000)}</p>
            </div>
            <div className="bg-secondary/50 rounded p-2">
              <span className="text-muted-foreground">Active Walls</span>
              <p className="text-foreground font-medium">
                {Object.entries(config.walls).filter(([, w]) => w.enabled).map(([s]) => s).join(', ') || 'None'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
