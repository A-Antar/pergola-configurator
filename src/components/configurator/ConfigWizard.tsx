import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import type { PatioConfig, AttachmentSide } from "@/types/configurator";
import { FRAME_COLORS } from "@/types/configurator";

interface ConfigWizardProps {
  config: PatioConfig;
  onChange: (config: PatioConfig) => void;
  onGetQuote: () => void;
}

const STEPS = ['Material', 'Style', 'Dimensions', 'Colour', 'Accessories'];

export default function ConfigWizard({ config, onChange, onGetQuote }: ConfigWizardProps) {
  const [step, setStep] = useState(0);

  const update = (partial: Partial<PatioConfig>) =>
    onChange({ ...config, ...partial });

  const updateAccessory = (key: keyof PatioConfig['accessories'], val: boolean) =>
    onChange({ ...config, accessories: { ...config.accessories, [key]: val } });

  const canNext = step < STEPS.length - 1;
  const canPrev = step > 0;

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
              <>
                <Separator />
                <div className="space-y-3">
                  <h3 className="font-display text-lg font-semibold text-foreground">Attached Sides</h3>
                  <p className="text-xs text-muted-foreground">Select which sides connect to the house walls</p>
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      { key: 'back' as AttachmentSide, label: 'Back' },
                      { key: 'left' as AttachmentSide, label: 'Left' },
                      { key: 'right' as AttachmentSide, label: 'Right' },
                    ]).map(({ key, label }) => {
                      const active = (config.attachedSides || ['back']).includes(key);
                      return (
                        <button
                          key={key}
                          onClick={() => {
                            const sides = config.attachedSides || ['back'];
                            const next = active
                              ? sides.filter(s => s !== key)
                              : [...sides, key];
                            update({ attachedSides: next.length > 0 ? next : ['back'] });
                          }}
                          className={`p-2 rounded-lg border text-sm font-medium transition-all ${
                            active
                              ? 'border-primary bg-primary/10 text-foreground'
                              : 'border-border text-muted-foreground hover:border-primary/40'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
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
          </div>
        )}

        {step === 4 && (
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
