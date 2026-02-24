import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import type { PatioConfig, AttachmentSide, WallSide, FrameFinish, HdriPreset, FoundationConfig } from "@/types/configurator";
import { FRAME_COLORS } from "@/types/configurator";
import type { FoundationType } from "@/types/decking";
import WallEditorPanel from "./WallEditorPanel";

interface ConfigWizardProps {
  config: PatioConfig;
  onChange: (config: PatioConfig) => void;
  onGetQuote: () => void;
  activeStep?: number;
  onStepChange?: (step: number) => void;
  selectedWall?: WallSide | null;
  onSelectWall?: (side: WallSide | null) => void;
}

const STEPS = ['Material', 'Style', 'Dimensions', 'Foundation', 'Colour', 'Walls', 'Accessories'];

const FOUNDATION_OPTIONS: { id: FoundationType; name: string; desc: string }[] = [
  { id: 'landscape', name: 'Landscape / Soil', desc: 'Excavation required for post holes' },
  { id: 'concrete-thick', name: 'Concrete (≥150mm)', desc: 'Bracket-mount columns with chemset bolts' },
  { id: 'concrete-thin', name: 'Concrete (<125mm / Cracked)', desc: 'Core drill oversized holes, embed columns 600mm' },
];

export default function ConfigWizard({ config, onChange, onGetQuote, activeStep, onStepChange, selectedWall, onSelectWall }: ConfigWizardProps) {
  const [internalStep, setInternalStep] = useState(0);
  const step = activeStep ?? internalStep;
  const setStep = (s: number) => { setInternalStep(s); onStepChange?.(s); };

  const update = (partial: Partial<PatioConfig>) =>
    onChange({ ...config, ...partial });

  const updateAccessory = (key: keyof PatioConfig['accessories'], val: boolean) =>
    onChange({ ...config, accessories: { ...config.accessories, [key]: val } });

  const updateFoundation = (partial: Partial<PatioConfig['foundation']>) =>
    onChange({ ...config, foundation: { ...config.foundation, ...partial } });

  const canNext = step < STEPS.length - 1;
  const canPrev = step > 0;

  // Column count for foundation (posts at ~1.8m spacing both directions)
  const colsAcross = Math.floor(config.width / 1.8) + 1;
  const colsDeep = Math.floor(config.depth / 1.8) + 1;
  const totalColumns = colsAcross * colsDeep;

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
            <h3 className="font-display text-lg font-semibold text-foreground">Roof Material</h3>
            <div className="grid grid-cols-1 gap-2">
              {(['insulated', 'colorbond'] as const).map((mat) => (
                <button
                  key={mat}
                  onClick={() => update({ material: mat })}
                  className={`p-4 rounded-lg border text-left transition-all ${
                    config.material === mat
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-card hover:border-primary/40'
                  }`}
                >
                  <span className="font-medium text-foreground capitalize">{mat === 'insulated' ? 'Insulated Panel' : 'Colorbond'}</span>
                  <p className="text-xs text-muted-foreground mt-1">
                    {mat === 'insulated'
                      ? 'Stratco insulated panels — superior thermal performance'
                      : 'Classic Colorbond steel — lightweight & durable'}
                  </p>
                </button>
              ))}
            </div>
            {config.material === 'colorbond' && (
              <div className="space-y-2 mt-3">
                <span className="text-sm text-muted-foreground">Profile</span>
                <div className="grid grid-cols-2 gap-2">
                  {(['superdek', 'flatdek'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => update({ colorbondType: t })}
                      className={`px-3 py-2 rounded border text-sm transition-all ${
                        config.colorbondType === t
                          ? 'border-primary bg-primary/10 text-foreground'
                          : 'border-border text-muted-foreground hover:border-primary/40'
                      }`}
                    >
                      {t === 'superdek' ? 'Superdek' : 'Flatdek'}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <div className="space-y-3">
              <h3 className="font-display text-lg font-semibold text-foreground">Roof Shape</h3>
              <div className="grid grid-cols-2 gap-2">
                {(['flat', 'gable'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => update({ shape: s })}
                    className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                      config.shape === s
                        ? 'border-primary bg-primary/10 text-foreground'
                        : 'border-border text-muted-foreground hover:border-primary/40'
                    }`}
                  >
                    {s === 'flat' ? 'Flat' : 'Gable'}
                  </button>
                ))}
              </div>
            </div>
            <Separator />
            <div className="space-y-3">
              <h3 className="font-display text-lg font-semibold text-foreground">Style</h3>
              <div className="grid grid-cols-1 gap-2">
                {(['skillion', 'fly-over', 'free-standing', 'skyline', 'timber-look'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => update({ style: s })}
                    className={`px-4 py-3 rounded-lg border text-left text-sm transition-all ${
                      config.style === s
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-card hover:border-primary/40'
                    }`}
                  >
                    <span className="font-medium text-foreground capitalize">{s.replace('-', ' ')}</span>
                  </button>
                ))}
              </div>
            </div>
            {config.style !== 'free-standing' && (
              <div className="bg-muted/50 rounded-lg p-3 mt-2">
                <p className="text-xs text-muted-foreground">
                  Configure wall attachments in the <button onClick={() => setStep(5)} className="text-primary font-medium hover:underline">Walls</button> step.
                </p>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <h3 className="font-display text-lg font-semibold text-foreground">Dimensions</h3>
            {[
              { label: 'Width', key: 'width' as const, min: 2, max: 12, step: 0.5, unit: 'm' },
              { label: 'Depth', key: 'depth' as const, min: 2, max: 8, step: 0.5, unit: 'm' },
              { label: 'Height', key: 'height' as const, min: 2.4, max: 4.5, step: 0.1, unit: 'm' },
            ].map((dim) => (
              <div key={dim.key} className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">{dim.label}</span>
                  <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
                    {config[dim.key].toFixed(1)}{dim.unit}
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
              Area: <span className="text-foreground font-medium">{(config.width * config.depth).toFixed(1)} m²</span>
            </div>
          </div>
        )}

        {step === 3 && (
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

        {step === 4 && (
          <div className="space-y-4">
            <h3 className="font-display text-lg font-semibold text-foreground">Frame Colour</h3>
            <div className="grid grid-cols-4 gap-3">
              {FRAME_COLORS.map((c) => (
                <button
                  key={c.hex}
                  onClick={() => update({ frameColor: c.hex })}
                  className="flex flex-col items-center gap-1.5 group"
                >
                  <div
                    className={`w-10 h-10 rounded-full border-2 transition-all ${
                      config.frameColor === c.hex ? 'border-primary scale-110' : 'border-border group-hover:border-primary/50'
                    }`}
                    style={{ backgroundColor: c.hex }}
                  />
                  <span className="text-[10px] text-muted-foreground">{c.name}</span>
                </button>
              ))}
            </div>

            <Separator />

            {/* Aluminium Finish */}
            <div className="space-y-2">
              <span className="text-sm text-muted-foreground">Aluminium Finish</span>
              <div className="grid grid-cols-4 gap-2">
                {(['matte', 'satin', 'gloss', 'mirror'] as FrameFinish[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => update({ frameFinish: f })}
                    className={`px-2 py-2 rounded border text-xs font-medium capitalize transition-all ${
                      (config.frameFinish ?? 'gloss') === f
                        ? 'border-primary bg-primary/10 text-foreground'
                        : 'border-border text-muted-foreground hover:border-primary/40'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Reflection Strength */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Reflection Strength</span>
                <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
                  {(config.reflectionStrength ?? 2.2).toFixed(1)}
                </Badge>
              </div>
              <Slider
                value={[config.reflectionStrength ?? 2.2]}
                onValueChange={([v]) => update({ reflectionStrength: v })}
                min={0.8}
                max={3.2}
                step={0.1}
              />
            </div>

            {/* HDRI Preset */}
            <div className="space-y-2">
              <span className="text-sm text-muted-foreground">Environment</span>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { key: 'day' as HdriPreset, label: 'Bright Day' },
                  { key: 'studio' as HdriPreset, label: 'Studio' },
                ]).map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => update({ hdriPreset: key })}
                    className={`px-3 py-2 rounded border text-sm transition-all ${
                      (config.hdriPreset ?? 'day') === key
                        ? 'border-primary bg-primary/10 text-foreground'
                        : 'border-border text-muted-foreground hover:border-primary/40'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 5 && (
          <WallEditorPanel
            config={config}
            onChange={onChange}
            selectedWall={selectedWall ?? null}
            onSelectWall={onSelectWall ?? (() => {})}
          />
        )}

        {step === 6 && (
          <div className="space-y-4">
            <h3 className="font-display text-lg font-semibold text-foreground">Accessories</h3>
            {([
              { key: 'lighting' as const, label: 'LED Downlights', desc: 'Recessed ceiling lights' },
              { key: 'fans' as const, label: 'Ceiling Fan', desc: 'Outdoor-rated ceiling fan' },
              { key: 'gutters' as const, label: 'Gutters & Downpipes', desc: 'Integrated water management' },
              { key: 'designerBeam' as const, label: 'Designer Beam', desc: 'Decorative front fascia beam' },
              { key: 'columns' as const, label: 'Decorative Columns', desc: 'Cylindrical post wraps' },
            ]).map((acc) => (
              <div key={acc.key} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <div>
                  <span className="text-sm font-medium text-foreground">{acc.label}</span>
                  <p className="text-xs text-muted-foreground">{acc.desc}</p>
                </div>
                <Switch
                  checked={config.accessories[acc.key]}
                  onCheckedChange={(v) => updateAccessory(acc.key, v)}
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
