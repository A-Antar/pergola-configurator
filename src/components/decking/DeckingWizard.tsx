import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import type { DeckingConfig, DeckingMaterial, RailingStyle, RailingPosition } from "@/types/decking";
import { DECKING_MATERIALS, DECKING_COLORS } from "@/types/decking";

interface DeckingWizardProps {
  config: DeckingConfig;
  onChange: (config: DeckingConfig) => void;
  onGetQuote: () => void;
}

const STEPS = ['Material', 'Dimensions', 'Colour', 'Railings', 'Accessories'];

export default function DeckingWizard({ config, onChange, onGetQuote }: DeckingWizardProps) {
  const [step, setStep] = useState(0);

  const update = (partial: Partial<DeckingConfig>) =>
    onChange({ ...config, ...partial });

  const canNext = step < STEPS.length - 1;
  const canPrev = step > 0;

  const colors = DECKING_COLORS[config.material];

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

        {step === 3 && (
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

        {step === 4 && (
          <div className="space-y-4">
            <h3 className="font-display text-lg font-semibold text-foreground">Accessories</h3>
            {([
              { key: 'lighting' as const, label: 'LED Deck Lighting', desc: 'Recessed step & perimeter lights' },
              { key: 'seating' as const, label: 'Built-in Seating', desc: 'Integrated bench seating' },
            ]).map((acc) => (
              <div key={acc.key} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <div>
                  <span className="text-sm font-medium text-foreground">{acc.label}</span>
                  <p className="text-xs text-muted-foreground">{acc.desc}</p>
                </div>
                <Switch
                  checked={config.accessories[acc.key]}
                  onCheckedChange={(v) =>
                    onChange({ ...config, accessories: { ...config.accessories, [acc.key]: v } })
                  }
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="px-5 py-3 border-t border-border/60 flex items-center justify-between">
        {canPrev ? (
          <button onClick={() => setStep(step - 1)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium transition-colors">
            <ChevronLeft className="w-3.5 h-3.5" />
            Back
          </button>
        ) : (
          <span />
        )}
        {canNext ? (
          <button onClick={() => setStep(step + 1)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-all">
            Continue
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button onClick={onGetQuote} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:brightness-110 transition-all">
            Get Quote
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}