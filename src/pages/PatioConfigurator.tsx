import { useState, useCallback, Suspense } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { X } from "lucide-react";
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

  const handlePartClick = useCallback((part: string) => {
    const step = PART_TO_STEP[part];
    if (step !== undefined) {
      setWizardStep(step);
    }
  }, []);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isEmbed = searchParams.get('embed') === '1';

  const { min, max } = calculateEstimate(config);

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* ── Horizontal Stepper Bar ── */}
      {!isEmbed && (
        <header className="shrink-0 border-b border-border bg-card px-4 py-3 z-20">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Step circles with connecting lines */}
            <div className="flex-1 flex items-center justify-center">
              {STEPS.map((label, i) => (
                <div key={label} className="flex items-center">
                  <button
                    onClick={() => setWizardStep(i)}
                    className="flex items-center gap-1.5 group"
                  >
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-all ${
                        i === wizardStep
                          ? 'border-primary bg-primary text-primary-foreground'
                          : i < wizardStep
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-background text-muted-foreground'
                      }`}
                    >
                      {i + 1}
                    </span>
                    <span
                      className={`text-xs font-medium hidden lg:inline transition-colors ${
                        i === wizardStep
                          ? 'text-primary'
                          : i < wizardStep
                          ? 'text-foreground'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {label}
                    </span>
                  </button>
                  {i < STEPS.length - 1 && (
                    <div
                      className={`w-8 xl:w-12 h-px mx-1 transition-colors ${
                        i < wizardStep ? 'bg-primary' : 'bg-border'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </header>
      )}

      {/* ── Main content ── */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* 3D Viewport — fills available space */}
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
            />
          </Suspense>
        </div>

        {/* ── Right Panel — Configuration + Price ── */}
        <div className="shrink-0 w-[85%] sm:w-[340px] lg:w-[360px] border-l border-border bg-card flex flex-col z-10">
          {/* Config wizard content */}
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

          {/* Price footer */}
          <div className="border-t border-border px-5 py-4 bg-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">Price before tax</span>
              <span className="font-display text-xl font-bold text-foreground">
                ${min.toLocaleString()} – ${max.toLocaleString()}
              </span>
            </div>
            <button
              onClick={() => setQuoteOpen(true)}
              className="w-full py-3 rounded-lg bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors"
            >
              GET FREE QUOTE
            </button>
          </div>
        </div>
      </div>

      <LeadCaptureDialog open={quoteOpen} onOpenChange={setQuoteOpen} config={config} />
    </div>
  );
}