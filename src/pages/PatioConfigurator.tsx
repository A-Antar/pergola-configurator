import { useState, useCallback, Suspense } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import PatioScene from "@/components/configurator/PatioScene";
import ConfigWizard from "@/components/configurator/ConfigWizard";
import QuotePanel from "@/components/configurator/QuotePanel";
import LeadCaptureDialog from "@/components/configurator/LeadCaptureDialog";
import { DEFAULT_PATIO_CONFIG } from "@/types/configurator";
import type { PatioConfig } from "@/types/configurator";

const PART_TO_STEP: Record<string, number> = {
  columns: 2,   // Dimensions
  beams: 2,     // Dimensions
  roof: 0,      // Material
  accessories: 4, // Accessories
};

export default function PatioConfigurator() {
  const [config, setConfig] = useState<PatioConfig>(DEFAULT_PATIO_CONFIG);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(0);

  const handlePartClick = useCallback((part: string) => {
    const step = PART_TO_STEP[part];
    if (step !== undefined) setWizardStep(step);
  }, []);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isEmbed = searchParams.get('embed') === '1';

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Header (hidden in embed) */}
      {!isEmbed && (
        <header className="shrink-0 border-b border-border px-4 py-3 flex items-center justify-between bg-background/80 backdrop-blur z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-display text-lg font-bold text-primary">H2 Patios</h1>
              <p className="text-[10px] text-muted-foreground">Patio Configurator</p>
            </div>
          </div>
          <span className="text-xs text-muted-foreground hidden sm:block">
            Design → Configure → Get Quote
          </span>
        </header>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* 3D Viewer */}
        <div className="flex-1 relative min-h-[40vh] lg:min-h-0">
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-full bg-background">
                <div className="text-center space-y-2">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-sm text-muted-foreground">Loading 3D viewer…</p>
                </div>
              </div>
            }
          >
            <PatioScene config={config} onPartClick={handlePartClick} />
          </Suspense>
        </div>

        {/* Side panel */}
        <div className="w-full lg:w-[380px] shrink-0 border-t lg:border-t-0 lg:border-l border-border bg-background flex flex-col max-h-[60vh] lg:max-h-none overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <ConfigWizard config={config} onChange={setConfig} onGetQuote={() => setQuoteOpen(true)} activeStep={wizardStep} onStepChange={setWizardStep} />
          </div>
          <div className="shrink-0 px-5 pb-4">
            <QuotePanel config={config} />
          </div>
        </div>
      </div>

      <LeadCaptureDialog open={quoteOpen} onOpenChange={setQuoteOpen} config={config} />
    </div>
  );
}
