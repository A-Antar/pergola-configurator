import { useState, useCallback, useRef, Suspense } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { X, Check } from "lucide-react";
import PatioScene from "@/components/configurator/PatioScene";
import ConfigWizard from "@/components/configurator/ConfigWizard";
import QuotePanel from "@/components/configurator/QuotePanel";
import LeadCaptureDialog from "@/components/configurator/LeadCaptureDialog";
import { DEFAULT_PATIO_CONFIG } from "@/types/configurator";
import type { PatioConfig, WallSide } from "@/types/configurator";
import type { QualityLevel } from "@/lib/materials";
import { calculateEstimate } from "@/components/configurator/QuotePanel";

const STEPS = ['Material', 'Style', 'Dimensions', 'Foundation', 'Colour', 'Walls', 'Accessories'];

const PART_TO_STEP: Record<string, number> = {
  columns: 2,
  beams: 2,
  roof: 0,
  walls: 5,
  accessories: 6,
};

export default function PatioConfigurator() {
  const [config, setConfig] = useState<PatioConfig>(DEFAULT_PATIO_CONFIG);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(0);
  const [quality, setQuality] = useState<QualityLevel>('balanced');
  const [selectedWall, setSelectedWall] = useState<WallSide | null>(null);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handlePartClick = useCallback((part: string) => {
    const step = PART_TO_STEP[part];
    if (step !== undefined) setWizardStep(step);
  }, []);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isEmbed = searchParams.get('embed') === '1';

  const { min, max, breakdown } = calculateEstimate(config);
  const area = config.width * config.depth;

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* ── Enterprise Header / Stepper ── */}
      {!isEmbed && (
        <header className="shrink-0 border-b border-border bg-card/80 glass px-4 py-2.5 z-20">
          <div className="flex items-center gap-4 max-w-screen-2xl mx-auto">
            <button
              onClick={() => navigate('/')}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Step indicators */}
            <div className="flex-1 flex items-center justify-center">
              {STEPS.map((label, i) => {
                const isActive = i === wizardStep;
                const isComplete = i < wizardStep;
                return (
                  <div key={label} className="flex items-center">
                    <button
                      onClick={() => setWizardStep(i)}
                      className="flex items-center gap-1.5 group relative"
                    >
                      <span
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold transition-all duration-200 ${
                          isActive
                            ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25 scale-105'
                            : isComplete
                            ? 'bg-primary/15 text-primary'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {isComplete ? <Check className="w-3.5 h-3.5" /> : i + 1}
                      </span>
                      <span
                        className={`text-[11px] font-medium hidden lg:inline transition-all duration-200 ${
                          isActive
                            ? 'text-foreground'
                            : isComplete
                            ? 'text-foreground/70'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {label}
                      </span>
                    </button>
                    {i < STEPS.length - 1 && (
                      <div
                        className={`w-6 xl:w-10 h-[2px] mx-1.5 rounded-full transition-colors duration-300 ${
                          isComplete ? 'bg-primary/40' : 'bg-border'
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Quick area badge */}
            <div className="hidden md:flex items-center gap-2 text-[11px] text-muted-foreground">
              <span className="font-medium text-foreground">{area.toFixed(1)} m²</span>
              <span>·</span>
              <span className="font-semibold text-primary">${min.toLocaleString()}</span>
            </div>
          </div>
        </header>
      )}

      {/* ── Main content ── */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* 3D Viewport */}
        <div className="flex-1 relative">
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-full bg-background">
                <div className="text-center space-y-3">
                  <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-muted-foreground font-medium">Loading 3D engine…</p>
                </div>
              </div>
            }
          >
            <PatioScene
              config={config}
              onPartClick={handlePartClick}
              quality={quality}
              onQualityChange={setQuality}
              wallEditMode={wizardStep === 5}
              selectedWall={selectedWall}
              onSelectWall={setSelectedWall}
              onConfigChange={setConfig}
              canvasRef={canvasRef}
            />
          </Suspense>
        </div>

        {/* ── Right Panel ── */}
        <div className="shrink-0 w-[85%] sm:w-[340px] lg:w-[380px] border-l border-border bg-card flex flex-col z-10 shadow-[-4px_0_24px_-8px_rgba(0,0,0,0.06)]">
          {/* Config wizard */}
          <div className="flex-1 overflow-hidden">
            <ConfigWizard
              config={config}
              onChange={setConfig}
              onGetQuote={() => setQuoteOpen(true)}
              activeStep={wizardStep}
              onStepChange={setWizardStep}
              selectedWall={selectedWall}
              onSelectWall={setSelectedWall}
            />
          </div>

          {/* ── Premium Price Footer ── */}
          <div className="border-t border-border bg-card">
            {/* Collapsible breakdown */}
            {showBreakdown && (
              <div className="px-5 pt-4 pb-2 border-b border-border/50 space-y-1.5 max-h-48 overflow-y-auto step-content-enter">
                {breakdown.map((item, i) => (
                  <div key={i} className="flex justify-between text-[11px]">
                    <span className="text-muted-foreground truncate mr-3">{item.label}</span>
                    <span className="text-foreground font-medium tabular-nums">${item.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="px-5 py-4">
              <button
                onClick={() => setShowBreakdown(!showBreakdown)}
                className="w-full flex items-center justify-between mb-3 group"
              >
                <span className="text-[11px] text-muted-foreground group-hover:text-foreground transition-colors">
                  {showBreakdown ? 'Hide' : 'View'} price breakdown
                </span>
                <div className="text-right">
                  <span className="font-display text-xl font-bold text-foreground tracking-tight">
                    ${min.toLocaleString()} – ${max.toLocaleString()}
                  </span>
                  <span className="block text-[10px] text-muted-foreground">excl. GST</span>
                </div>
              </button>

              <button
                onClick={() => setQuoteOpen(true)}
                className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold tracking-wide hover:brightness-110 active:scale-[0.98] transition-all shadow-md shadow-primary/20"
              >
                GET FREE QUOTE
              </button>
            </div>
          </div>
        </div>
      </div>

      <LeadCaptureDialog open={quoteOpen} onOpenChange={setQuoteOpen} config={config} canvasRef={canvasRef} />
    </div>
  );
}
