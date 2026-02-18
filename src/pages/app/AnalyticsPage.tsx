import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface FunnelStep {
  label: string;
  type: string;
  count: number;
}

export default function AnalyticsPage() {
  const [funnel, setFunnel] = useState<FunnelStep[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const types = [
        { type: "configurator_opened", label: "Configurator Opened" },
        { type: "design_saved", label: "Design Saved" },
        { type: "lead_submitted", label: "Lead Submitted" },
        { type: "quote_sent", label: "Quote Sent" },
        { type: "quote_viewed", label: "Quote Viewed" },
        { type: "quote_approved", label: "Quote Approved" },
      ];

      const { data } = await supabase.from("events").select("type");
      const counts = new Map<string, number>();
      (data || []).forEach((e: any) => counts.set(e.type, (counts.get(e.type) || 0) + 1));
      setFunnel(types.map((t) => ({ ...t, count: counts.get(t.type) || 0 })));
      setLoading(false);
    })();
  }, []);

  const maxCount = Math.max(1, ...funnel.map((f) => f.count));

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground">Analytics</h2>
        <p className="text-sm text-muted-foreground">Conversion funnel & event tracking</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="space-y-3">
          {funnel.map((step) => (
            <div key={step.type} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-foreground">{step.label}</span>
                <span className="text-muted-foreground font-mono">{step.count}</span>
              </div>
              <div className="h-6 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary/60 rounded-full transition-all"
                  style={{ width: `${(step.count / maxCount) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
