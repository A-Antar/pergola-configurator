import type { PatioConfig } from "@/types/configurator";
import { PATIO_PRICING } from "@/types/configurator";
import { Separator } from "@/components/ui/separator";

interface QuotePanelProps {
  config: PatioConfig;
}

export function calculateEstimate(config: PatioConfig): { min: number; max: number; breakdown: { label: string; amount: number }[] } {
  const profileKey = config.material === 'insulated'
    ? 'insulated'
    : `colorbond_${config.colorbondType}`;
  const profile = PATIO_PRICING[profileKey] || PATIO_PRICING.insulated;

  const area = config.width * config.depth;
  const effectiveArea = Math.max(area, profile.minSize);
  const basePrice = Math.max(effectiveArea * profile.ratePerM2, profile.minCharge);

  const breakdown: { label: string; amount: number }[] = [
    { label: `${profile.profileName} (${effectiveArea.toFixed(1)} m²)`, amount: Math.round(basePrice) },
  ];

  if (config.shape === 'gable' && profile.optionAdders.gable) {
    breakdown.push({ label: 'Gable roof upgrade', amount: profile.optionAdders.gable });
  }

  Object.entries(config.accessories).forEach(([key, enabled]) => {
    if (enabled && profile.optionAdders[key]) {
      breakdown.push({
        label: key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()),
        amount: profile.optionAdders[key],
      });
    }
  });

  const total = breakdown.reduce((s, b) => s + b.amount, 0);

  return {
    min: Math.round(total * 0.85),
    max: Math.round(total * 1.15),
    breakdown,
  };
}

export default function QuotePanel({ config }: QuotePanelProps) {
  const { min, max, breakdown } = calculateEstimate(config);

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-3">
      <h4 className="font-display text-sm font-semibold text-foreground">Estimated Quote</h4>

      <div className="space-y-1.5">
        {breakdown.map((item, i) => (
          <div key={i} className="flex justify-between text-xs">
            <span className="text-muted-foreground">{item.label}</span>
            <span className="text-foreground">${item.amount.toLocaleString()}</span>
          </div>
        ))}
      </div>

      <Separator />

      <div className="flex justify-between items-end">
        <div>
          <span className="text-xs text-muted-foreground">Estimate range</span>
          <p className="font-display text-xl font-bold text-primary">
            ${min.toLocaleString()} – ${max.toLocaleString()}
          </p>
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground leading-relaxed">
        Estimated price excludes GST. Final quote confirmed after a free on-site measure.
      </p>
    </div>
  );
}
