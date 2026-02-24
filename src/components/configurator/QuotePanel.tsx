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

  // ─── Foundation costs ──────────────────────────────
  if (config.foundation) {
    const f = config.foundation;
    const colsAcross = Math.floor(config.width / 1.8) + 1;
    const colsDeep = Math.floor(config.depth / 1.8) + 1;
    const columnCount = colsAcross * colsDeep;

    if (f.type === 'landscape') {
      if (columnCount <= 2) {
        breakdown.push({ label: `Hand Excavation - Labourer (${columnCount} holes, 6hrs @ $${f.labourRate}/hr)`, amount: Math.round(f.labourRate * 6) });
      } else {
        breakdown.push({ label: `1.5T Excavator (8hrs @ $${f.excavatorRate}/hr)`, amount: Math.round(f.excavatorRate * 8) });
        breakdown.push({ label: '2-Way Float Delivery', amount: Math.round(f.floatCharge) });
      }
    } else if (f.type === 'concrete-thick') {
      breakdown.push({ label: `Column Mounting Brackets (×${columnCount} @ $${f.bracketCostEach} ea)`, amount: Math.round(columnCount * f.bracketCostEach) });
      breakdown.push({ label: 'Chemset + Bolts', amount: Math.round(f.chemsetCost) });
      breakdown.push({ label: `Installation Labour (6hr min @ $${f.labourRate}/hr)`, amount: Math.round(f.labourRate * 6) });
    } else if (f.type === 'concrete-thin') {
      breakdown.push({ label: `Core Drilling 600mm⌀ × 600mm deep (×${columnCount} @ $${f.coreDrillCostEach} ea)`, amount: Math.round(columnCount * f.coreDrillCostEach) });
      const volumePerHole = Math.PI * 0.3 * 0.3 * 0.6;
      const totalVolume = volumePerHole * columnCount;
      breakdown.push({ label: `Concrete Fill (${totalVolume.toFixed(2)} m³ @ $${f.concreteCostPerM3}/m³)`, amount: Math.round(totalVolume * f.concreteCostPerM3) });
      breakdown.push({ label: `Extended Column Length (+600mm × ${columnCount} cols)`, amount: Math.round(columnCount * 0.6 * (profile.ratePerM2 / 10)) });
      breakdown.push({ label: `Installation Labour (6hr min @ $${f.labourRate}/hr)`, amount: Math.round(f.labourRate * 6) });
    }
  }

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
    <div className="space-y-3">

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
