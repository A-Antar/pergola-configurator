import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Check, Download, Loader2 } from "lucide-react";
import type { PatioConfig } from "@/types/configurator";
import { calculateEstimate } from "./QuotePanel";
import { generateQuotePdf } from "@/lib/generate-quote-pdf";

interface LeadCaptureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: PatioConfig;
  canvasRef?: React.RefObject<HTMLCanvasElement>;
}

export default function LeadCaptureDialog({ open, onOpenChange, config, canvasRef }: LeadCaptureDialogProps) {
  const [submitted, setSubmitted] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    suburb: '',
    jobRequirements: '',
  });

  const { min, max } = calculateEstimate(config);
  const area = config.width * config.depth;

  const getCanvasScreenshot = (): string | undefined => {
    try {
      return canvasRef?.current?.toDataURL('image/png');
    } catch {
      return undefined;
    }
  };

  const handleDownloadPdf = () => {
    setGenerating(true);
    // Slight delay to let the spinner render
    setTimeout(() => {
      try {
        const pdf = generateQuotePdf({
          config,
          customerName: `${form.firstName} ${form.lastName}`.trim(),
          customerEmail: form.email,
          customerPhone: form.phone,
          suburb: form.suburb,
          canvasDataUrl: getCanvasScreenshot(),
        });
        pdf.save(`Patio-Quote-${Date.now().toString(36).toUpperCase()}.pdf`);
      } catch (err) {
        console.error('PDF generation failed:', err);
      } finally {
        setGenerating(false);
      }
    }, 100);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const lead = {
      ...form,
      serviceType: 'patios',
      configJson: config,
      estimateMin: min,
      estimateMax: max,
      estimatedSize: area,
      submittedAt: new Date().toISOString(),
    };
    console.log('Lead submitted:', lead);
    setSubmitted(true);
  };

  const updateField = (key: string, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  if (submitted) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-card border-border max-w-md">
          <div className="text-center py-6 space-y-4">
            <div className="w-14 h-14 rounded-full bg-primary/15 flex items-center justify-center mx-auto">
              <Check className="w-7 h-7 text-primary" />
            </div>
            <h3 className="font-display text-xl font-bold text-foreground">Quote Request Sent!</h3>
            <p className="text-sm text-muted-foreground">
              The H2 Patios team will be in touch within 24 hours to arrange your free on-site measure.
            </p>
            <div className="bg-secondary rounded-lg p-3 text-xs text-muted-foreground">
              <p>Estimate: <span className="text-primary font-semibold">${min.toLocaleString()} – ${max.toLocaleString()}</span> ex GST</p>
              <p>Area: {area.toFixed(1)} m² · {config.material} · {config.shape} · {config.style.replace('-', ' ')}</p>
            </div>

            {/* PDF Download CTA */}
            <Button
              onClick={handleDownloadPdf}
              disabled={generating}
              variant="outline"
              className="w-full gap-2 border-primary/30 text-primary hover:bg-primary/5"
            >
              {generating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Download PDF Quote
            </Button>

            <Button onClick={() => { setSubmitted(false); onOpenChange(false); }} variant="ghost" size="sm" className="text-muted-foreground">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-foreground">Book Your Free Quote</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            We'll arrange a free on-site measure to confirm your design & final price.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="bg-secondary/50 rounded-lg p-3 text-xs space-y-1">
            <p className="text-muted-foreground">
              Service: <span className="text-foreground font-medium">Patios — {config.material}, {config.shape}, {config.style.replace('-', ' ')}</span>
            </p>
            <p className="text-muted-foreground">
              Size: <span className="text-foreground font-medium">{config.width}m × {config.depth}m ({area.toFixed(1)} m²)</span>
            </p>
            <p className="text-muted-foreground">
              Estimate: <span className="text-primary font-semibold">${min.toLocaleString()} – ${max.toLocaleString()}</span> ex GST
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">First Name *</Label>
              <Input required maxLength={50} value={form.firstName} onChange={(e) => updateField('firstName', e.target.value)} className="bg-secondary border-border" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Last Name *</Label>
              <Input required maxLength={50} value={form.lastName} onChange={(e) => updateField('lastName', e.target.value)} className="bg-secondary border-border" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Email *</Label>
            <Input type="email" required maxLength={100} value={form.email} onChange={(e) => updateField('email', e.target.value)} className="bg-secondary border-border" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Phone *</Label>
            <Input type="tel" required maxLength={20} value={form.phone} onChange={(e) => updateField('phone', e.target.value)} className="bg-secondary border-border" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Suburb *</Label>
            <Input required maxLength={50} value={form.suburb} onChange={(e) => updateField('suburb', e.target.value)} className="bg-secondary border-border" placeholder="e.g. Parramatta" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Brief Job Requirements</Label>
            <Textarea maxLength={180} value={form.jobRequirements} onChange={(e) => updateField('jobRequirements', e.target.value)} className="bg-secondary border-border resize-none" rows={2} placeholder="e.g. Replacing old timber pergola, need council approval..." />
            <span className="text-[10px] text-muted-foreground">{form.jobRequirements.length}/180</span>
          </div>

          <Button type="submit" className="w-full" size="lg">
            Submit Quote Request
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
