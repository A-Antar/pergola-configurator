import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Home, Columns3, DollarSign, Ruler } from "lucide-react";

interface PergolaConfig {
  width: number;
  depth: number;
  height: number;
  postCount: number;
  mountType: "freestanding" | "wall-mounted";
  rafterCount: number;
}

interface ConfigPanelProps {
  config: PergolaConfig;
  onChange: (config: PergolaConfig) => void;
}

export default function ConfigPanel({ config, onChange }: ConfigPanelProps) {
  const update = (partial: Partial<PergolaConfig>) =>
    onChange({ ...config, ...partial });

  // Simple pricing model
  const basePrice = config.mountType === "wall-mounted" ? 2800 : 3500;
  const areaPrice = config.width * config.depth * 180;
  const postPrice = config.postCount * 120;
  const heightPrice = (config.height - 2.4) * 400;
  const totalPrice = Math.round(basePrice + areaPrice + postPrice + heightPrice);

  return (
    <div className="flex flex-col gap-6 p-6 h-full overflow-y-auto">
      <div>
        <h2 className="font-serif text-2xl font-semibold text-foreground">
          Configure Your Pergola
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Customize dimensions, posts, and mounting style
        </p>
      </div>

      <Separator />

      {/* Mount Type */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2 text-sm font-medium">
          <Home className="w-4 h-4 text-primary" />
          Mounting Type
        </Label>
        <div className="grid grid-cols-2 gap-2">
          {(["freestanding", "wall-mounted"] as const).map((type) => (
            <button
              key={type}
              onClick={() => update({ mountType: type })}
              className={`px-4 py-3 rounded-lg border text-sm font-medium transition-all ${
                config.mountType === type
                  ? "border-primary bg-primary text-primary-foreground shadow-md"
                  : "border-border bg-card text-card-foreground hover:border-primary/50"
              }`}
            >
              {type === "freestanding" ? "Freestanding" : "Wall Mounted"}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          {config.mountType === "wall-mounted"
            ? "Attaches to existing wall with mounting brackets"
            : "Stands independently with posts on all sides"}
        </p>
      </div>

      <Separator />

      {/* Dimensions */}
      <div className="space-y-4">
        <Label className="flex items-center gap-2 text-sm font-medium">
          <Ruler className="w-4 h-4 text-primary" />
          Dimensions
        </Label>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm text-muted-foreground">Width</span>
              <Badge variant="secondary">{config.width.toFixed(1)}m</Badge>
            </div>
            <Slider
              value={[config.width]}
              onValueChange={([v]) => update({ width: v })}
              min={2}
              max={8}
              step={0.5}
            />
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm text-muted-foreground">Depth</span>
              <Badge variant="secondary">{config.depth.toFixed(1)}m</Badge>
            </div>
            <Slider
              value={[config.depth]}
              onValueChange={([v]) => update({ depth: v })}
              min={2}
              max={6}
              step={0.5}
            />
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm text-muted-foreground">Height</span>
              <Badge variant="secondary">{config.height.toFixed(1)}m</Badge>
            </div>
            <Slider
              value={[config.height]}
              onValueChange={([v]) => update({ height: v })}
              min={2.4}
              max={4}
              step={0.1}
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Posts */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2 text-sm font-medium">
          <Columns3 className="w-4 h-4 text-primary" />
          Posts
        </Label>
        <div className="flex justify-between mb-2">
          <span className="text-sm text-muted-foreground">Number of Posts</span>
          <Badge variant="secondary">{config.postCount}</Badge>
        </div>
        <Slider
          value={[config.postCount]}
          onValueChange={([v]) => update({ postCount: v })}
          min={config.mountType === "wall-mounted" ? 2 : 4}
          max={config.mountType === "wall-mounted" ? 6 : 8}
          step={1}
        />

        <div className="flex justify-between mb-2">
          <span className="text-sm text-muted-foreground">Rafters</span>
          <Badge variant="secondary">{config.rafterCount}</Badge>
        </div>
        <Slider
          value={[config.rafterCount]}
          onValueChange={([v]) => update({ rafterCount: v })}
          min={3}
          max={12}
          step={1}
        />
      </div>

      <Separator />

      {/* Quote */}
      <div className="space-y-3 bg-card rounded-xl p-4 border border-border">
        <Label className="flex items-center gap-2 text-sm font-medium">
          <DollarSign className="w-4 h-4 text-primary" />
          Estimated Quote
        </Label>
        <div className="space-y-1 text-sm text-muted-foreground">
          <div className="flex justify-between">
            <span>Base ({config.mountType})</span>
            <span>${basePrice.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>
              Area ({config.width}m × {config.depth}m)
            </span>
            <span>${Math.round(areaPrice).toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Posts (×{config.postCount})</span>
            <span>${postPrice.toLocaleString()}</span>
          </div>
          {heightPrice > 0 && (
            <div className="flex justify-between">
              <span>Extra height</span>
              <span>${Math.round(heightPrice).toLocaleString()}</span>
            </div>
          )}
        </div>
        <Separator />
        <div className="flex justify-between items-center">
          <span className="font-serif text-lg font-semibold text-foreground">
            Total
          </span>
          <span className="font-serif text-2xl font-bold text-primary">
            ${totalPrice.toLocaleString()}
          </span>
        </div>
      </div>

      <Button size="lg" className="w-full mt-2">
        Request Full Quote
      </Button>
    </div>
  );
}
