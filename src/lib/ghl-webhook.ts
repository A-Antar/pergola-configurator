/**
 * GoHighLevel Webhook Integration
 * ================================
 * Sends lead data to GHL via webhook when a quote is requested.
 * Falls back gracefully if no webhook URL is configured.
 */

import { BRAND } from './brand-config';
import type { PatioConfig } from '@/types/configurator';

export interface GHLLeadPayload {
  // Contact fields (GHL standard)
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  // Custom fields
  suburb: string;
  jobRequirements: string;
  serviceType: string;
  estimateMin: number;
  estimateMax: number;
  estimatedSize: number;
  // Configuration snapshot
  roofMaterial: string;
  roofShape: string;
  style: string;
  width: number;
  depth: number;
  height: number;
  frameColor: string;
  accessories: string;
  // Metadata
  source: string;
  submittedAt: string;
  configJson: string;
}

export async function submitLeadToGHL(
  formData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    suburb: string;
    jobRequirements: string;
  },
  config: PatioConfig,
  estimateMin: number,
  estimateMax: number,
): Promise<{ success: boolean; error?: string }> {
  const webhookUrl = BRAND.ghlWebhookUrl;

  if (!webhookUrl) {
    console.warn('[GHL] No webhook URL configured. Set VITE_GHL_WEBHOOK_URL in .env');
    // Still return success so the UI flow continues
    return { success: true };
  }

  const area = config.width * config.depth;
  const activeAccessories = Object.entries(config.accessories)
    .filter(([, v]) => v)
    .map(([k]) => k)
    .join(', ');

  const payload: GHLLeadPayload = {
    firstName: formData.firstName,
    lastName: formData.lastName,
    email: formData.email,
    phone: formData.phone,
    suburb: formData.suburb,
    jobRequirements: formData.jobRequirements,
    serviceType: 'Patios',
    estimateMin,
    estimateMax,
    estimatedSize: parseFloat(area.toFixed(1)),
    roofMaterial: config.material === 'insulated' ? 'Insulated Panel' : `Colorbond ${config.colorbondType}`,
    roofShape: config.shape,
    style: config.style.replace(/-/g, ' '),
    width: config.width,
    depth: config.depth,
    height: config.height,
    frameColor: config.frameColor,
    accessories: activeAccessories || 'None',
    source: `${BRAND.name} 3D Configurator`,
    submittedAt: new Date().toISOString(),
    configJson: JSON.stringify(config),
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(`[GHL] Webhook returned ${response.status}`);
      return { success: false, error: `Server returned ${response.status}` };
    }

    console.log('[GHL] Lead submitted successfully');
    return { success: true };
  } catch (err) {
    console.error('[GHL] Webhook submission failed:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Network error' };
  }
}
