import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

export default function AdminPage() {
  const [company, setCompany] = useState<any>(null);
  const [name, setName] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [chatEmbed, setChatEmbed] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("companies").select("*").limit(1).single();
      if (data) {
        setCompany(data);
        setName(data.name || "");
        setWebhookUrl(data.ghl_webhook_url || "");
        setChatEmbed(data.ghl_chat_embed || "");
      }
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    if (!company) return;
    const { error } = await supabase.from("companies").update({
      name,
      ghl_webhook_url: webhookUrl || null,
      ghl_chat_embed: chatEmbed || null,
    }).eq("id", company.id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else toast({ title: "Settings saved" });
  };

  if (loading) return <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 space-y-6 max-w-xl">
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground">Admin Settings</h2>
        <p className="text-sm text-muted-foreground">Company branding and integrations</p>
      </div>

      {!company ? (
        <p className="text-muted-foreground">No company found. Contact support.</p>
      ) : (
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-lg p-4 space-y-4">
            <h3 className="font-display text-sm font-semibold text-foreground">Company</h3>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Company Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-secondary border-border" />
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-4 space-y-4">
            <h3 className="font-display text-sm font-semibold text-foreground">GoHighLevel Integration</h3>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Webhook URL</Label>
              <Input value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} placeholder="https://services.leadconnectorhq.com/hooks/..." className="bg-secondary border-border" />
              <p className="text-[10px] text-muted-foreground">Events: lead_created, quote_sent, quote_viewed, quote_approved</p>
            </div>
            <Separator />
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Chat Widget Embed Code</Label>
              <Input value={chatEmbed} onChange={(e) => setChatEmbed(e.target.value)} placeholder="<script src='...'></script>" className="bg-secondary border-border" />
              <p className="text-[10px] text-muted-foreground">Injected into shared quote pages for customer chat</p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-4 space-y-3">
            <h3 className="font-display text-sm font-semibold text-foreground">AI Add-ons</h3>
            <p className="text-xs text-muted-foreground">Coming soon — AI-powered sales tools</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="border border-border rounded p-3 opacity-60">
                <p className="text-xs font-medium text-foreground">AI Website Chat</p>
                <p className="text-[10px] text-muted-foreground">Qualify leads & book appointments</p>
              </div>
              <div className="border border-border rounded p-3 opacity-60">
                <p className="text-xs font-medium text-foreground">AI Receptionist</p>
                <p className="text-[10px] text-muted-foreground">Missed call capture & follow-up</p>
              </div>
            </div>
          </div>

          <Button onClick={save}>Save Settings</Button>
        </div>
      )}
    </div>
  );
}
