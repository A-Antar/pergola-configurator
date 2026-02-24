import type { DeckingConfig } from "@/types/decking";
import { DECKING_PRICING } from "@/types/decking";
import { Separator } from "@/components/ui/separator";

interface DeckingQuotePanelProps {
  config: DeckingConfig;
}

export function calculateDeckEstimate(config: DeckingConfig) {
  const p = DECKING_PRICING[config.material];
  const area = config.length * config.width;

  const boardSpacing = 0.143;
  const boardCount = Math.ceil(
    (config.boardDirection === 'lengthwise' ? config.width : config.length) / boardSpacing
  );
  const boardLength = config.boardDirection === 'lengthwise' ? config.length : config.width;
  const boardsCost = boardCount * boardLength * p.boardRatePerLm;

  const joistDir = config.boardDirection === 'lengthwise' ? config.width : config.length;
  const joistSpan = config.boardDirection === 'lengthwise' ? config.length : config.width;
  const joistCount = Math.ceil(joistSpan / 0.45) + 1;
  const joistsCost = joistCount * joistDir * p.joistRatePerLm;

  const bearerDir = config.boardDirection === 'lengthwise' ? config.length : config.width;
  const bearerSpan = config.boardDirection === 'lengthwise' ? config.width : config.length;
  const bearerCount = Math.ceil(bearerSpan / 1.8) + 1;
  const bearersCost = bearerCount * bearerDir * p.bearerRatePerLm;

  const postCount = bearerCount * (Math.ceil(bearerDir / 1.8) + 1);
  const postsCost = postCount * p.postCostEach;

  const fixingsCost = area * p.fixingsPerM2;
  const labourCost = area * p.labourPerM2;

  const breakdown: { label: string; amount: number }[] = [
    { label: `${p.label} boards`, amount: Math.round(boardsCost) },
    { label: 'Joists', amount: Math.round(joistsCost) },
    { label: 'Bearers', amount: Math.round(bearersCost) },
    { label: `Posts (×${postCount})`, amount: Math.round(postsCost) },
    { label: 'Fixings', amount: Math.round(fixingsCost) },
    { label: 'Labour', amount: Math.round(labourCost) },
  ];

  // Railings
  if (config.railingStyle !== 'none' && config.railingPositions.length > 0) {
    let railLength = 0;
    config.railingPositions.forEach((pos) => {
      railLength += pos === 'front' || pos === 'back' ? config.length : config.width;
    });
    const railRate = p.adders[config.railingStyle] ?? 0;
    breakdown.push({ label: `${config.railingStyle.charAt(0).toUpperCase() + config.railingStyle.slice(1)} railing (${railLength.toFixed(1)}m)`, amount: Math.round(railRate * railLength) });
  }

  if (config.stairs.enabled) {
    breakdown.push({ label: 'Stairs', amount: p.adders.stairs });
  }
  if (config.accessories.lighting) {
    breakdown.push({ label: 'LED Lighting', amount: p.adders.lighting });
  }
  if (config.accessories.seating) {
    breakdown.push({ label: 'Built-in Seating', amount: p.adders.seating });
  }

  const total = breakdown.reduce((s, b) => s + b.amount, 0);
  return { min: Math.round(total * 0.85), max: Math.round(total * 1.15), breakdown };
}

export default function DeckingQuotePanel({ config }: DeckingQuotePanelProps) {
  const { min, max, breakdown } = calculateDeckEstimate(config);

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