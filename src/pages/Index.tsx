import { useNavigate } from "react-router-dom";
import { ArrowRight, Lock } from "lucide-react";

const PRODUCTS = [
  {
    id: 'patios',
    title: 'Patios',
    description: 'Insulated & Colorbond patios — Flat, Gable, Skillion, Fly-over & more',
    available: true,
  },
  {
    id: 'louvre',
    title: 'Louvre',
    description: 'Opening roof louvres for light & airflow control',
    available: false,
  },
  {
    id: 'carports',
    title: 'Carports',
    description: 'Free-standing, Fly-over, Skillion, Skyline & Gable carports',
    available: false,
  },
  {
    id: 'sunrooms',
    title: 'Sunrooms',
    description: 'Enclosed patios with glass, flooring & climate accessories',
    available: false,
  },
  {
    id: 'decking',
    title: 'Decking',
    description: 'Merbau & Composite (EkoDeck) timber decking',
    available: true,
  },
  {
    id: 'ezi-slat',
    title: 'Ezi-Slat & Blinds',
    description: 'Privacy screens & ambient blinds for any outdoor space',
    available: false,
  },
];

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-primary tracking-tight">
            H2 Patios
          </h1>
          <p className="text-xs text-muted-foreground">3D Configurator</p>
        </div>
        <a
          href="tel:1300000000"
          className="text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          Call for a free quote
        </a>
      </header>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        <div className="text-center max-w-2xl mb-12">
          <h2 className="font-display text-4xl md:text-5xl font-800 text-foreground mb-4 leading-tight">
            Design Your Outdoor
            <span className="text-primary"> Living Space</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Choose a product to start configuring in 3D. Get an instant estimate and book your free site measure.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-4xl">
          {PRODUCTS.map((product) => (
            <button
              key={product.id}
              onClick={() => product.available && navigate(`/configure/${product.id}`)}
              disabled={!product.available}
              className={`group relative text-left p-6 rounded-lg border transition-all duration-200 ${
                product.available
                  ? 'border-border bg-card hover:border-primary hover:shadow-lg hover:shadow-primary/5 cursor-pointer'
                  : 'border-border/50 bg-card/50 opacity-60 cursor-not-allowed'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-display text-lg font-semibold text-foreground">
                  {product.title}
                </h3>
                {product.available ? (
                  <ArrowRight className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                ) : (
                  <Lock className="w-3 h-3 text-muted-foreground" />
                )}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {product.description}
              </p>
              {!product.available && (
                <span className="inline-block mt-3 text-xs text-muted-foreground/70 border border-border/50 px-2 py-0.5 rounded">
                  Coming soon
                </span>
              )}
            </button>
          ))}
        </div>

        <p className="mt-12 text-xs text-muted-foreground text-center max-w-md">
          Estimated prices exclude GST. Final quote confirmed after a free on-site measure by the H2 Patios team.
        </p>
      </div>
    </div>
  );
};

export default Index;
