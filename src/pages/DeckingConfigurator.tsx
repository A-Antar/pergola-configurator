import { useState, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronRight, ChevronUp } from "lucide-react";
import DeckScene from "@/components/decking/DeckScene";
import DeckingWizard from "@/components/decking/DeckingWizard";
import DeckingQuotePanel, { calculateDeckEstimate } from "@/components/decking/DeckingQuotePanel";
import { DEFAULT_DECKING_CONFIG } from "@/types/decking";
import type { DeckingConfig } from "@/types/decking";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

export default function DeckingConfigurator() {
  const [config, setConfig] = useState<DeckingConfig>(DEFAULT_DECKING_CONFIG);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [quoteCollapsed, setQuoteCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(true);
  const navigate = useNavigate();

  const { min, max } = calculateDeckEstimate(config);

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Header */}
      <header className="shrink-0 h-12 border-b border-border/50 px-4 flex items-center justify-between bg-background/80 backdrop-blur-xl z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="text-muted-foreground hover:text-foreground transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-sm font-bold text-primary tracking-wide">DECKING</h1>
            <span className="text-border">|</span>
            <span className="text-[11px] text-muted-foreground font-medium">Configurator</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[11px] text-muted-foreground hidden md:block">
            {config.length}m × {config.width}m · {(config.length * config.width).toFixed(0)} m²
          </span>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* 3D Viewport — full area */}
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
            <DeckScene config={config} />
          </Suspense>
        </div>

        {/* Desktop: Side panel */}
        <div className={`relative z-10 shrink-0 transition-all duration-300 ease-in-out hidden sm:block ${
          panelCollapsed ? 'w-0 opacity-0 pointer-events-none' : 'sm:w-[340px] lg:w-[360px]'
        }`}>
          <div className="h-full bg-background/85 backdrop-blur-xl border-r border-border/30 flex flex-col shadow-2xl shadow-background/50">
            <div className="flex-1 overflow-hidden">
              <DeckingWizard
                config={config}
                onChange={setConfig}
                onGetQuote={() => setQuoteOpen(true)}
              />
            </div>
          </div>
        </div>

        {/* Desktop: Panel toggle */}
        <button
          onClick={() => setPanelCollapsed(!panelCollapsed)}
          className={`absolute z-20 top-1/2 -translate-y-1/2 transition-all duration-300 hidden sm:flex ${
            panelCollapsed ? 'left-2' : 'left-[340px] lg:left-[360px]'
          } w-6 h-12 bg-background/80 backdrop-blur border border-border/50 rounded-r-md items-center justify-center text-muted-foreground hover:text-foreground`}
        >
          <ChevronRight className={`w-3 h-3 transition-transform duration-300 ${panelCollapsed ? '' : 'rotate-180'}`} />
        </button>

        {/* Desktop: Floating quote */}
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
                  <DeckingQuotePanel config={config} />
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

        {/* Mobile: Bottom bar trigger */}
        <div className="absolute bottom-0 left-0 right-0 z-10 sm:hidden bg-background/90 backdrop-blur-xl border-t border-border/30 px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] text-muted-foreground">Estimate</span>
              <p className="font-display text-base font-bold text-primary">
                ${min.toLocaleString()} – ${max.toLocaleString()}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setMobileDrawerOpen(true)}
                className="px-4 py-2 rounded-lg border border-border text-foreground text-sm font-medium flex items-center gap-1"
              >
                <ChevronUp className="w-4 h-4" />
                Configure
              </button>
              <button
                onClick={() => setQuoteOpen(true)}
                className="px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold"
              >
                Quote
              </button>
            </div>
          </div>
        </div>

        {/* Mobile: Bottom sheet drawer */}
        <Drawer open={mobileDrawerOpen} onOpenChange={setMobileDrawerOpen}>
          <DrawerContent className="sm:hidden max-h-[80vh]">
            <DrawerHeader className="py-2">
              <DrawerTitle className="text-sm font-display">Configure Your Deck</DrawerTitle>
            </DrawerHeader>
            <div className="overflow-y-auto flex-1">
              <DeckingWizard
                config={config}
                onChange={setConfig}
                onGetQuote={() => { setMobileDrawerOpen(false); setQuoteOpen(true); }}
              />
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </div>
  );
}
