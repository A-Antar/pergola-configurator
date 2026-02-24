import { useState, useCallback, Suspense } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, ChevronRight } from "lucide-react";
import PatioScene from "@/components/configurator/PatioScene";
import ConfigWizard from "@/components/configurator/ConfigWizard";
import QuotePanel from "@/components/configurator/QuotePanel";
import LeadCaptureDialog from "@/components/configurator/LeadCaptureDialog";
import { DEFAULT_PATIO_CONFIG } from "@/types/configurator";
import type { PatioConfig, WallSide } from "@/types/configurator";
import type { QualityLevel } from "@/lib/materials";
import { calculateEstimate } from "@/components/configurator/QuotePanel";

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
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [quoteCollapsed, setQuoteCollapsed] = useState(false);
  const [selectedWall, setSelectedWall] = useState<WallSide | null>(null);

  const handlePartClick = useCallback((part: string) => {
    const step = PART_TO_STEP[part];
    if (step !== undefined) {
      setWizardStep(step);
      setPanelCollapsed(false);
    }
  }, []);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isEmbed = searchParams.get('embed') === '1';

  const { min, max } = calculateEstimate(config);

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Header (hidden in embed) */}
      {!isEmbed && (
        <header className="shrink-0 h-12 border-b border-border/50 px-4 flex items-center justify-between bg-background/80 backdrop-blur-xl z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-sm font-bold text-primary tracking-wide">H2 PATIOS</h1>
              <span className="text-border">|</span>
              <span className="text-[11px] text-muted-foreground font-medium">Configurator</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[11px] text-muted-foreground hidden md:block">
              {config.width}m × {config.depth}m · {(config.width * config.depth).toFixed(0)} m²
            </span>
            <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-muted-foreground/60">
              <span className={wizardStep >= 0 ? 'text-primary' : ''}>Design</span>
              <ChevronRight className="w-3 h-3" />
              <span className={wizardStep >= 2 ? 'text-primary' : ''}>Configure</span>
              <ChevronRight className="w-3 h-3" />
              <span>Quote</span>
            </div>
          </div>
        </header>
      )}

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* 3D Viewport — full width, behind panels */}
        <div className="absolute inset-0">
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

        {/* Left panel — Config Wizard (glass overlay) */}
        <div
          className={`relative z-10 shrink-0 transition-all duration-300 ease-in-out ${
            panelCollapsed
              ? 'w-0 opacity-0 pointer-events-none'
              : 'w-[85%] sm:w-[340px] lg:w-[360px]'
          }`}
        >
          <div className="h-full bg-background/85 backdrop-blur-xl border-r border-border/30 flex flex-col shadow-2xl shadow-background/50">
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
          </div>
        </div>

        {/* Collapse/Expand toggle */}
        <button
          onClick={() => setPanelCollapsed(!panelCollapsed)}
          className={`absolute z-20 top-1/2 -translate-y-1/2 transition-all duration-300 ${
            panelCollapsed
              ? 'left-2'
              : 'left-[340px] lg:left-[360px] hidden sm:block'
          } w-6 h-12 bg-background/80 backdrop-blur border border-border/50 rounded-r-md flex items-center justify-center text-muted-foreground hover:text-foreground`}
        >
          <ChevronRight className={`w-3 h-3 transition-transform duration-300 ${panelCollapsed ? '' : 'rotate-180'}`} />
        </button>

        {/* Right panel — Floating quote summary */}
        <div className="absolute top-4 right-4 z-10 hidden sm:block w-[280px]">
          <div className="bg-background/85 backdrop-blur-xl border border-border/30 rounded-xl shadow-2xl shadow-background/50 overflow-hidden">
            <button
              onClick={() => setQuoteCollapsed(!quoteCollapsed)}
              className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted/30 transition-colors duration-200"
            >
              <span className="font-display text-xs tracking-wide">Estimated Quote</span>
              <ChevronRight className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${quoteCollapsed ? '' : 'rotate-90'}`} />
            </button>
            {!quoteCollapsed && (
              <>
                <div className="px-4 pb-2">
                  <QuotePanel config={config} />
                </div>
                <div className="px-4 pb-4">
                  <button
                    onClick={() => setQuoteOpen(true)}
                    className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors duration-200"
                  >
                    Get Free Quote
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Mobile bottom bar */}
        <div className="absolute bottom-0 left-0 right-0 z-10 sm:hidden bg-background/90 backdrop-blur-xl border-t border-border/30 px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] text-muted-foreground">Estimate</span>
              <p className="font-display text-base font-bold text-primary">
                ${min.toLocaleString()} – ${max.toLocaleString()}
              </p>
            </div>
            <button
              onClick={() => setQuoteOpen(true)}
              className="px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold"
            >
              Get Quote
            </button>
          </div>
        </div>
      </div>

      <LeadCaptureDialog open={quoteOpen} onOpenChange={setQuoteOpen} config={config} />
    </div>
  );
}
