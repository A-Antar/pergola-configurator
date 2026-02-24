import jsPDF from "jspdf";
import type { PatioConfig } from "@/types/configurator";
import { FRAME_COLORS } from "@/types/configurator";
import { calculateEstimate } from "@/components/configurator/QuotePanel";

interface QuotePdfOptions {
  config: PatioConfig;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  suburb: string;
  canvasDataUrl?: string;
  quoteRef?: string;
}

function getColorName(hex: string): string {
  return FRAME_COLORS.find((c) => c.hex === hex)?.name ?? hex;
}

export function generateQuotePdf(opts: QuotePdfOptions): jsPDF {
  const { config, customerName, customerEmail, customerPhone, suburb, canvasDataUrl, quoteRef } = opts;
  const { min, max, breakdown } = calculateEstimate(config);
  const area = config.width * config.depth;
  const ref = quoteRef ?? `Q-${Date.now().toString(36).toUpperCase()}`;
  const now = new Date();

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const mx = 18;
  let y = 0;

  // ── Brand header bar
  doc.setFillColor(35, 120, 65);
  doc.rect(0, 0, pw, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("PATIO DESIGN QUOTE", mx, 13);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Ref: ${ref}  ·  ${now.toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })}`, mx, 22);
  doc.text("Prepared for you by H2 Patios", pw - mx, 22, { align: "right" });
  y = 36;

  // ── 3D Render Image
  if (canvasDataUrl) {
    const imgW = pw - mx * 2;
    const imgH = imgW * 0.5;
    doc.addImage(canvasDataUrl, "PNG", mx, y, imgW, imgH);
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.roundedRect(mx, y, imgW, imgH, 2, 2);
    y += imgH + 8;
  }

  // ── Customer Details
  doc.setFillColor(245, 245, 243);
  doc.roundedRect(mx, y, pw - mx * 2, 22, 2, 2, "F");
  doc.setTextColor(60, 60, 60);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("CUSTOMER", mx + 4, y + 5);
  doc.setFont("helvetica", "normal");
  doc.text(customerName, mx + 4, y + 11);
  doc.text(`${customerEmail}  ·  ${customerPhone}`, mx + 4, y + 16);
  doc.text(suburb, mx + 4, y + 21);
  y += 30;

  // ── Design Summary
  const sectionTitle = (title: string) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(35, 120, 65);
    doc.text(title, mx, y);
    y += 2;
    doc.setDrawColor(35, 120, 65);
    doc.setLineWidth(0.5);
    doc.line(mx, y, pw - mx, y);
    y += 6;
    doc.setTextColor(50, 50, 50);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
  };

  const row = (label: string, value: string) => {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 120, 120);
    doc.text(label, mx + 2, y);
    doc.setTextColor(40, 40, 40);
    doc.setFont("helvetica", "bold");
    doc.text(value, pw / 2, y);
    y += 5.5;
  };

  sectionTitle("DESIGN SPECIFICATION");
  row("Roof Material", config.material === "insulated" ? "Insulated Panel" : `Colorbond ${config.colorbondType}`);
  row("Roof Shape", config.shape === "flat" ? "Flat / Skillion" : "Gable");
  row("Style", config.style.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()));
  row("Width × Depth", `${config.width.toFixed(1)}m × ${config.depth.toFixed(1)}m (${area.toFixed(1)} m²)`);
  row("Height", `${config.height.toFixed(1)}m`);
  row("Frame Colour", getColorName(config.frameColor));
  row("Finish", config.frameFinish.charAt(0).toUpperCase() + config.frameFinish.slice(1));

  const activeAccessories = Object.entries(config.accessories)
    .filter(([, v]) => v)
    .map(([k]) => k.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()));
  if (activeAccessories.length > 0) {
    row("Accessories", activeAccessories.join(", "));
  }
  y += 4;

  // ── Price Breakdown
  sectionTitle("PRICE BREAKDOWN");

  breakdown.forEach((item) => {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    const lines = doc.splitTextToSize(item.label, pw / 2 - mx - 4);
    doc.text(lines, mx + 2, y);
    doc.setTextColor(40, 40, 40);
    doc.setFont("helvetica", "bold");
    doc.text(`$${item.amount.toLocaleString()}`, pw - mx, y, { align: "right" });
    y += Math.max(lines.length * 4.5, 5.5);
  });

  y += 2;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(mx, y, pw - mx, y);
  y += 6;

  // Total estimate
  doc.setFillColor(35, 120, 65);
  doc.roundedRect(mx, y, pw - mx * 2, 16, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("ESTIMATED PRICE (EXCL. GST)", mx + 6, y + 6);
  doc.setFontSize(14);
  doc.text(`$${min.toLocaleString()} – $${max.toLocaleString()}`, pw - mx - 6, y + 12, { align: "right" });
  y += 24;

  // ── Terms & Conditions
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(140, 140, 140);
  const terms = [
    "• This is an indicative estimate only. Final pricing will be confirmed after a free on-site measure and assessment.",
    "• Prices exclude GST, council fees, engineering, and any site-specific requirements.",
    "• Estimate valid for 30 days from the date of issue.",
    "• All work compliant with Australian Standards and local council regulations.",
  ];
  terms.forEach((t) => {
    doc.text(t, mx, y);
    y += 4;
  });

  // ── Footer
  doc.setFillColor(245, 245, 243);
  doc.rect(0, ph - 14, pw, 14, "F");
  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  doc.text(`Generated ${now.toLocaleString("en-AU")}  ·  Ref: ${ref}`, mx, ph - 6);
  doc.text("Powered by H2 Patios CPQ", pw - mx, ph - 6, { align: "right" });

  return doc;
}