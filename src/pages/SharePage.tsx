import { useEffect, useState, Suspense } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import PatioScene from "@/components/configurator/PatioScene";
import QuotePanel from "@/components/configurator/QuotePanel";
import type { PatioConfig } from "@/types/configurator";
import { DEFAULT_PATIO_CONFIG } from "@/types/configurator";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function SharePage() {
  const { token } = useParams<{ token: string }>();
  const [config, setConfig] = useState<PatioConfig | null>(null);
  const [revision, setRevision] = useState<any>(null);
  const [project, setProject] = useState<any>(null);
  const [error, setError] = useState("");
  const [approved, setApproved] = useState(false);
  const [chatEmbed, setChatEmbed] = useState("");

  useEffect(() => {
    if (!token) return;
    (async () => {
      // Validate token via edge function
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/validateToken?token=${token}`
      );
      if (!res.ok) { setError("Invalid or expired link"); return; }
      const data = await res.json();
      setRevision(data.revision);
      setProject(data.project);
      setConfig(data.revision?.config || DEFAULT_PATIO_CONFIG);
      setChatEmbed(data.chatEmbed || "");

      // Track view event
      if (data.revision?.id) {
        await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ghlWebhook`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ event: "quote_viewed", revision_id: data.revision.id }),
        });
      }
    })();
  }, [token]);

  const handleApprove = async () => {
    if (!revision) return;
    await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ghlWebhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "quote_approved", revision_id: revision.id }),
    });
    setApproved(true);
    toast({ title: "Design approved! The team will be in touch." });
  };

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-2">
        <p className="text-destructive font-medium">{error}</p>
        <p className="text-sm text-muted-foreground">This link may have expired.</p>
      </div>
    </div>
  );

  if (!config) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="shrink-0 border-b border-border px-4 py-3 flex items-center justify-between bg-background/80 backdrop-blur">
        <div>
          <h1 className="font-display text-lg font-bold text-primary">H2 Patios</h1>
          <p className="text-[10px] text-muted-foreground">Your Patio Design</p>
        </div>
        {!approved ? (
          <Button onClick={handleApprove} size="sm"><Check className="w-4 h-4 mr-1" /> Approve Design</Button>
        ) : (
          <span className="text-sm text-primary font-medium flex items-center gap-1"><Check className="w-4 h-4" /> Approved</span>
        )}
      </header>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        <div className="flex-1 relative min-h-[40vh] lg:min-h-0">
          <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
            <PatioScene config={config} onPartClick={() => {}} />
          </Suspense>
        </div>
        <div className="w-full lg:w-[340px] shrink-0 border-t lg:border-t-0 lg:border-l border-border bg-background p-5 space-y-4 overflow-auto">
          <div className="space-y-2">
            <h3 className="font-display text-sm font-semibold text-foreground">Design Summary</h3>
            <div className="text-xs space-y-1 text-muted-foreground">
              <p>Material: <span className="text-foreground">{config.material === 'insulated' ? 'Insulated Panel' : `Colorbond ${config.colorbondType}`}</span></p>
              <p>Shape: <span className="text-foreground">{config.shape} · {config.style.replace('-', ' ')}</span></p>
              <p>Size: <span className="text-foreground">{config.width}m × {config.depth}m ({(config.width * config.depth).toFixed(1)} m²)</span></p>
              <p>Height: <span className="text-foreground">{config.height}m</span></p>
            </div>
          </div>
          <QuotePanel config={config} />
        </div>
      </div>

      {chatEmbed && <div dangerouslySetInnerHTML={{ __html: chatEmbed }} />}
    </div>
  );
}
