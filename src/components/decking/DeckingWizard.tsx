import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import type { DeckingConfig, DeckingMaterial, RailingStyle, RailingPosition, FoundationType } from "@/types/decking";
import { DECKING_MATERIALS, DECKING_COLORS } from "@/types/decking";

interface DeckingWizardProps {
  config: DeckingConfig;
  onChange: (config: DeckingConfig) => void;
  onGetQuote: () => void;
}

const STEPS = ['Material', 'Dimensions', 'Foundation', 'Colour', 'Railings', 'Accessories'];

const FOUNDATION_OPTIONS: { id: FoundationType; name: string; desc: string }[] = [
  { id: 'landscape', name: 'Landscape / Soil', desc: 'Excavation required for post holes' },
  { id: 'concrete-thick', name: 'Concrete (≥150mm)', desc: 'Bracket-mount columns with chemset bolts' },
  { id: 'concrete-thin', name: 'Concrete (<125mm / Cracked)', desc: 'Core drill oversized holes, embed columns 600mm' },
];

export default function DeckingWizard({ config, onChange, onGetQuote }: DeckingWizardProps) {
  const [step, setStep] = useState(0);

  const update = (partial: Partial<DeckingConfig>) =>
    onChange({ ...config, ...partial });

  const updateFoundation = (partial: Partial<DeckingConfig['foundation']>) =>
    onChange({ ...config, foundation: { ...config.foundation, ...partial } });

  const canNext = step < STEPS.length - 1;
  const canPrev = step > 0;

  const colors = DECKING_COLORS[config.material];

  // Calculate post/column count for foundation pricing display
  const boardLen = config.boardDirection === 'lengthwise' ? config.length : config.width;
  const boardSpanDir = config.boardDirection === 'lengthwise' ? config.width : config.length;
  const bearerCount = Math.floor(boardSpanDir / 1.8) + 1;
  const colCountPerBearer = Math.floor(boardLen / 1.8) + 1;
  const totalColumns = bearerCount * colCountPerBearer;

  return (
    <div className="flex flex-col h-full">
      {/* Step indicators */}
      <div className="flex items-center gap-1 px-5 pt-5 pb-3">
        {STEPS.map((s, i) => (
          <button
            key={s}
            onClick={() => setStep(i)}
            className={`flex-1 text-center py-1.5 text-[10px] font-medium rounded transition-colors ${
              i === step
                ? 'bg-primary text-primary-foreground'
                : i < step
                ? 'bg-primary/20 text-primary'
                : 'bg-secondary text-muted-foreground'
            }`}
          >
            {i < step ? <span className="flex items-center justify-center gap-1"><Check className="w-3 h-3" />{s}</span> : s}
          </button>
        ))}
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        {step === 0 && (
          <div className="space-y-4">
            <h3 className="font-display text-lg font-semibold text-foreground">Decking Material</h3>
            <div className="grid grid-cols-1 gap-2">
              {DECKING_MATERIALS.map((mat) => (
                <button
                  key={mat.id}
                  onClick={() => {
                    const newColors = DECKING_COLORS[mat.id];
                    update({ material: mat.id, color: newColors[0].hex });
                  }}
                  className={`p-4 rounded-lg border text-left transition-all ${
                    config.material === mat.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-card hover:border-primary/40'
                  }`}
                >
                  <span className="font-medium text-foreground">{mat.name}</span>
                  <p className="text-xs text-muted-foreground mt-1">{mat.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <h3 className="font-display text-lg font-semibold text-foreground">Dimensions</h3>
            {[
              { label: 'Length', key: 'length' as const, min: 2, max: 12, step: 0.5, unit: 'm' },
              { label: 'Width', key: 'width' as const, min: 1.5, max: 8, step: 0.5, unit: 'm' },
              { label: 'Height', key: 'height' as const, min: 0.2, max: 1.5, step: 0.05, unit: 'm' },
            ].map((dim) => (
              <div key={dim.key} className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">{dim.label}</span>
                  <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
                    {config[dim.key].toFixed(dim.key === 'height' ? 2 : 1)}{dim.unit}
                  </Badge>
                </div>
                <Slider
                  value={[config[dim.key]]}
                  onValueChange={([v]) => update({ [dim.key]: v })}
                  min={dim.min}
                  max={dim.max}
                  step={dim.step}
                />
              </div>
            ))}
            <div className="bg-secondary/50 rounded p-3 text-xs text-muted-foreground">
              Area: <span className="text-foreground font-medium">{(config.length * config.width).toFixed(1)} m²</span>
            </div>
            <Separator />
            <div className="space-y-2">
              <span className="text-sm text-muted-foreground">Board Direction</span>
              <div className="grid grid-cols-2 gap-2">
                {(['lengthwise', 'widthwise'] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() => update({ boardDirection: d })}
                    className={`px-3 py-2 rounded border text-sm capitalize transition-all ${
                      config.boardDirection === d
                        ? 'border-primary bg-primary/10 text-foreground'
                        : 'border-border text-muted-foreground hover:border-primary/40'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h3 className="font-display text-lg font-semibold text-foreground">Foundation / Base</h3>
            <div className="grid grid-cols-1 gap-2">
              {FOUNDATION_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => updateFoundation({ type: opt.id })}
                  className={`p-4 rounded-lg border text-left transition-all ${
                    config.foundation.type === opt.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-card hover:border-primary/40'
                  }`}
                >
                  <span className="font-medium text-foreground">{opt.name}</span>
                  <p className="text-xs text-muted-foreground mt-1">{opt.desc}</p>
                </button>
              ))}
            </div>

            <Separator />

            <div className="bg-secondary/50 rounded p-3 text-xs text-muted-foreground">
              Columns/holes: <span className="text-foreground font-medium">{totalColumns}</span>
            </div>

            {/* Landscape / Soil inputs */}
            {config.foundation.type === 'landscape' && (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  {totalColumns <= 2
                    ? `≤ 2 holes → Hand excavation: labourer @ $${config.foundation.labourRate}/hr × 6 hrs`
                    : `> 2 holes → 1.5T Excavator @ $${config.foundation.excavatorRate}/hr × 8 hrs + 2-way float`}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Labour $/hr</label>
                    <Input type="number" value={config.foundation.labourRate} onChange={(e) => updateFoundation({ labourRate: Number(e.target.value) || 0 })} className="h-8 text-sm" />
                  </div>
                  {totalColumns > 2 && (
                    <>
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">Excavator $/hr</label>
                        <Input type="number" value={config.foundation.excavatorRate} onChange={(e) => updateFoundation({ excavatorRate: Number(e.target.value) || 0 })} className="h-8 text-sm" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">Float (2-way)</label>
                        <Input type="number" value={config.foundation.floatCharge} onChange={(e) => updateFoundation({ floatCharge: Number(e.target.value) || 0 })} className="h-8 text-sm" />
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Concrete thick inputs */}
            {config.foundation.type === 'concrete-thick' && (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Bracket mount: {totalColumns} brackets + chemset + 6hr min labour
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Bracket $ each</label>
                    <Input type="number" value={config.foundation.bracketCostEach} onChange={(e) => updateFoundation({ bracketCostEach: Number(e.target.value) || 0 })} className="h-8 text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Chemset + bolts $</label>
                    <Input type="number" value={config.foundation.chemsetCost} onChange={(e) => updateFoundation({ chemsetCost: Number(e.target.value) || 0 })} className="h-8 text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Labour $/hr</label>
                    <Input type="number" value={config.foundation.labourRate} onChange={(e) => updateFoundation({ labourRate: Number(e.target.value) || 0 })} className="h-8 text-sm" />
                  </div>
                </div>
              </div>
            )}

            {/* Concrete thin/cracked inputs */}
            {config.foundation.type === 'concrete-thin' && (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Core drill {totalColumns} oversized holes @ 600mm deep. Columns extended 600mm for embedment.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Concrete $/m³</label>
                    <Input type="number" value={config.foundation.concreteCostPerM3} onChange={(e) => updateFoundation({ concreteCostPerM3: Number(e.target.value) || 0 })} className="h-8 text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Labour $/hr</label>
                    <Input type="number" value={config.foundation.labourRate} onChange={(e) => updateFoundation({ labourRate: Number(e.target.value) || 0 })} className="h-8 text-sm" />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h3 className="font-display text-lg font-semibold text-foreground">Board Colour</h3>
            <div className="grid grid-cols-4 gap-3">
              {colors.map((c) => (
                <button
                  key={c.hex}
                  onClick={() => update({ color: c.hex })}
                  className="flex flex-col items-center gap-1.5 group"
                >
                  <div
                    className={`w-10 h-10 rounded-full border-2 transition-all ${
                      config.color === c.hex ? 'border-primary scale-110' : 'border-border group-hover:border-primary/50'
                    }`}
                    style={{ backgroundColor: c.hex }}
                  />
                  <span className="text-[10px] text-muted-foreground">{c.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-5">
            <h3 className="font-display text-lg font-semibold text-foreground">Railings</h3>
            <div className="space-y-2">
              <span className="text-sm text-muted-foreground">Style</span>
              <div className="grid grid-cols-2 gap-2">
                {(['none', 'glass', 'wire', 'timber'] as RailingStyle[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => update({ railingStyle: s })}
                    className={`px-3 py-2.5 rounded-lg border text-sm capitalize transition-all ${
                      config.railingStyle === s
                        ? 'border-primary bg-primary/10 text-foreground'
                        : 'border-border text-muted-foreground hover:border-primary/40'
                    }`}
                  >
                    {s === 'none' ? 'No Railing' : s}
                  </button>
                ))}
              </div>
            </div>
            {config.railingStyle !== 'none' && (
              <>
                <Separator />
                <div className="space-y-2">
                  <span className="text-sm text-muted-foreground">Railing Positions</span>
                  {(['front', 'left', 'right', 'back'] as RailingPosition[]).map((pos) => (
                    <div key={pos} className="flex items-center justify-between py-1.5">
                      <span className="text-sm text-foreground capitalize">{pos}</span>
                      <Switch
                        checked={config.railingPositions.includes(pos)}
                        onCheckedChange={(checked) => {
                          const positions = checked
                            ? [...config.railingPositions, pos]
                            : config.railingPositions.filter((p) => p !== pos);
                          update({ railingPositions: positions });
                        }}
                      />
                    </div>
                  ))}
                </div>
              </>
            )}
            <Separator />
            <div className="space-y-3">
              <h3 className="font-display text-base font-semibold text-foreground">Stairs</h3>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Add stairs</span>
                <Switch
                  checked={config.stairs.enabled}
                  onCheckedChange={(v) => update({ stairs: { ...config.stairs, enabled: v } })}
                />
              </div>
              {config.stairs.enabled && (
                <div className="space-y-3 pl-1">
                  <div className="space-y-2">
                    <span className="text-xs text-muted-foreground">Position</span>
                    <div className="grid grid-cols-3 gap-2">
                      {(['front', 'left', 'right'] as const).map((p) => (
                        <button
                          key={p}
                          onClick={() => update({ stairs: { ...config.stairs, position: p } })}
                          className={`px-2 py-1.5 rounded border text-xs capitalize transition-all ${
                            config.stairs.position === p
                              ? 'border-primary bg-primary/10 text-foreground'
                              : 'border-border text-muted-foreground hover:border-primary/40'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-xs text-muted-foreground">Stair Width</span>
                      <Badge variant="secondary" className="bg-secondary text-secondary-foreground text-[10px]">
                        {config.stairs.width.toFixed(1)}m
                      </Badge>
                    </div>
                    <Slider
                      value={[config.stairs.width]}
                      onValueChange={([v]) => update({ stairs: { ...config.stairs, width: v } })}
                      min={0.6}
                      max={3}
                      step={0.1}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <h3 className="font-display text-lg font-semibold text-foreground">Accessories</h3>
            {([
              { key: 'lighting' as const, label: 'LED Deck Lighting', desc: 'Recessed step & perimeter lights' },
              { key: 'seating' as const, label: 'Built-in Seating', desc: 'Integrated bench seating along edge' },
            ]).map((acc) => (
              <div key={acc.key} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <div>
                  <span className="text-sm font-medium text-foreground">{acc.label}</span>
                  <p className="text-xs text-muted-foreground">{acc.desc}</p>
                </div>
                <Switch
                  checked={config.accessories[acc.key]}
                  onCheckedChange={(v) => update({ accessories: { ...config.accessories, [acc.key]: v } })}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="px-5 py-4 border-t border-border flex gap-2">
        {canPrev && (
          <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
        )}
        {canNext ? (
          <Button onClick={() => setStep(step + 1)} className="flex-1">
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={onGetQuote} className="flex-1">
            Get Free Quote
          </Button>
        )}
      </div>
    </div>
  );
}
