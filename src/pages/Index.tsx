import { useState, Suspense } from "react";
import PergolaScene from "@/components/PergolaScene";
import ConfigPanel from "@/components/ConfigPanel";

interface PergolaConfig {
  width: number;
  depth: number;
  height: number;
  postCount: number;
  mountType: "freestanding" | "wall-mounted";
  rafterCount: number;
}

const defaultConfig: PergolaConfig = {
  width: 4,
  depth: 3,
  height: 2.8,
  postCount: 4,
  mountType: "freestanding",
  rafterCount: 6,
};

const Index = () => {
  const [config, setConfig] = useState(defaultConfig);

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-background">
      {/* 3D Viewer */}
      <div className="flex-1 relative min-h-[50vh] lg:min-h-screen bg-sky">
        <div className="absolute inset-0">
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground animate-pulse">Loading 3D viewer…</p>
              </div>
            }
          >
            <PergolaScene config={config} />
          </Suspense>
        </div>

        {/* Header overlay */}
        <div className="absolute top-0 left-0 right-0 p-6 pointer-events-none">
          <h1 className="font-serif text-3xl lg:text-4xl font-bold text-foreground">
            Pergola Studio
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Drag to rotate · Scroll to zoom · Shift+drag to pan
          </p>
        </div>

        {/* Mount type indicator */}
        <div className="absolute bottom-4 left-4 bg-card/80 backdrop-blur-sm rounded-lg px-3 py-2 border border-border text-xs text-muted-foreground">
          {config.mountType === "wall-mounted"
            ? "🔩 Wall-mounted — brackets shown on rear wall"
            : "🏗️ Freestanding — anchor plates at each post base"}
        </div>
      </div>

      {/* Config Panel */}
      <div className="w-full lg:w-[400px] lg:max-h-screen lg:overflow-y-auto border-l border-border bg-background">
        <ConfigPanel config={config} onChange={setConfig} />
      </div>
    </div>
  );
};

export default Index;
