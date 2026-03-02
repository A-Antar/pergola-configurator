/**
 * White-Label Brand Configuration
 * ================================
 * All brand-specific values are sourced from environment variables,
 * making it trivial to deploy the same app for different clients.
 *
 * Set these in your .env file:
 *   VITE_BRAND_NAME="H2 Patios"
 *   VITE_BRAND_TAGLINE="3D Configurator"
 *   VITE_BRAND_PHONE="1300 000 000"
 *   VITE_BRAND_EMAIL="info@h2patios.com.au"
 *   VITE_BRAND_WEBSITE="https://h2patios.com.au"
 *   VITE_BRAND_PRIMARY_COLOR="#237841"
 *   VITE_GHL_WEBHOOK_URL="https://services.leadconnectorhq.com/hooks/..."
 */

export interface BrandConfig {
  name: string;
  tagline: string;
  phone: string;
  email: string;
  website: string;
  primaryColor: string;
  ghlWebhookUrl: string;
}

export const BRAND: BrandConfig = {
  name: import.meta.env.VITE_BRAND_NAME || 'H2 Patios',
  tagline: import.meta.env.VITE_BRAND_TAGLINE || '3D Configurator',
  phone: import.meta.env.VITE_BRAND_PHONE || '1300 000 000',
  email: import.meta.env.VITE_BRAND_EMAIL || 'info@h2patios.com.au',
  website: import.meta.env.VITE_BRAND_WEBSITE || 'https://h2patios.com.au',
  primaryColor: import.meta.env.VITE_BRAND_PRIMARY_COLOR || '#237841',
  ghlWebhookUrl: import.meta.env.VITE_GHL_WEBHOOK_URL || '',
};
