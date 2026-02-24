import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import {
  Plus, Trash2, Save, Package, Layers, Palette, BookOpen, Loader2,
} from "lucide-react";

type CatalogVersion = {
  id: string;
  version: string;
  status: string;
  created_at: string;
};

type CatalogProfile = {
  id: string;
  catalog_version_id: string;
  kind: string;
  meta: Record<string, any> | null;
  polyline_mm: any;
};

type Sku = {
  id: string;
  catalog_version_id: string;
  sku_code: string;
  category: string;
  meta: Record<string, any> | null;
};

type Rule = {
  id: string;
  catalog_version_id: string;
  rule_type: string;
  severity: string;
  json: Record<string, any>;
};

export default function CatalogPage() {
  const [versions, setVersions] = useState<CatalogVersion[]>([]);
  const [activeVersionId, setActiveVersionId] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<CatalogProfile[]>([]);
  const [skus, setSkus] = useState<Sku[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newVersionName, setNewVersionName] = useState("");

  // Load versions
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("catalog_versions")
        .select("*")
        .order("created_at", { ascending: false });
      if (data) {
        setVersions(data);
        if (data.length > 0 && !activeVersionId) {
          setActiveVersionId(data[0].id);
        }
      }
      setLoading(false);
    })();
  }, []);

  // Load version data when active version changes
  useEffect(() => {
    if (!activeVersionId) return;
    (async () => {
      const [profilesRes, skusRes, rulesRes] = await Promise.all([
        supabase.from("catalog_profiles").select("*").eq("catalog_version_id", activeVersionId),
        supabase.from("skus").select("*").eq("catalog_version_id", activeVersionId),
        supabase.from("rules").select("*").eq("catalog_version_id", activeVersionId),
      ]);
      setProfiles((profilesRes.data ?? []) as CatalogProfile[]);
      setSkus((skusRes.data ?? []) as Sku[]);
      setRules((rulesRes.data ?? []) as Rule[]);
    })();
  }, [activeVersionId]);

  const createVersion = async () => {
    if (!newVersionName.trim()) return;
    const { data: companyData } = await supabase.from("companies").select("id").limit(1).single();
    if (!companyData) return;
    const { data, error } = await supabase
      .from("catalog_versions")
      .insert({ version: newVersionName.trim(), company_id: companyData.id })
      .select()
      .single();
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else if (data) {
      setVersions((prev) => [data, ...prev]);
      setActiveVersionId(data.id);
      setNewVersionName("");
      toast({ title: `Version "${data.version}" created` });
    }
  };

  const activeVersion = versions.find((v) => v.id === activeVersionId);

  // ── Profile CRUD ─────────────────────────────────────
  const addProfile = async () => {
    if (!activeVersionId) return;
    const { data, error } = await supabase
      .from("catalog_profiles")
      .insert({ catalog_version_id: activeVersionId, kind: "beam", polyline_mm: [], meta: {} })
      .select()
      .single();
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else if (data) setProfiles((p) => [...p, data as CatalogProfile]);
  };

  const updateProfile = (id: string, patch: Partial<CatalogProfile>) => {
    setProfiles((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  };

  const deleteProfile = async (id: string) => {
    await supabase.from("catalog_profiles").delete().eq("id", id);
    setProfiles((p) => p.filter((x) => x.id !== id));
  };

  // ── SKU CRUD ─────────────────────────────────────────
  const addSku = async () => {
    if (!activeVersionId) return;
    const { data, error } = await supabase
      .from("skus")
      .insert({ catalog_version_id: activeVersionId, sku_code: "NEW-SKU", category: "roofing", meta: {} })
      .select()
      .single();
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else if (data) setSkus((s) => [...s, data as Sku]);
  };

  const updateSku = (id: string, patch: Partial<Sku>) => {
    setSkus((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  const deleteSku = async (id: string) => {
    await supabase.from("skus").delete().eq("id", id);
    setSkus((s) => s.filter((x) => x.id !== id));
  };

  // ── Rule CRUD ────────────────────────────────────────
  const addRule = async () => {
    if (!activeVersionId) return;
    const { data, error } = await supabase
      .from("rules")
      .insert({ catalog_version_id: activeVersionId, rule_type: "validation", severity: "error", json: {} })
      .select()
      .single();
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else if (data) setRules((r) => [...r, data as Rule]);
  };

  const updateRule = (id: string, patch: Partial<Rule>) => {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const deleteRule = async (id: string) => {
    await supabase.from("rules").delete().eq("id", id);
    setRules((r) => r.filter((x) => x.id !== id));
  };

  // ── Batch save ───────────────────────────────────────
  const saveAll = async () => {
    setSaving(true);
    try {
      // Upsert profiles
      for (const p of profiles) {
        await supabase.from("catalog_profiles").upsert({
          id: p.id,
          catalog_version_id: p.catalog_version_id,
          kind: p.kind,
          meta: p.meta ?? {},
          polyline_mm: p.polyline_mm ?? [],
        });
      }
      // Upsert skus
      for (const s of skus) {
        await supabase.from("skus").upsert({
          id: s.id,
          catalog_version_id: s.catalog_version_id,
          sku_code: s.sku_code,
          category: s.category,
          meta: s.meta ?? {},
        });
      }
      // Upsert rules
      for (const r of rules) {
        await supabase.from("rules").upsert({
          id: r.id,
          catalog_version_id: r.catalog_version_id,
          rule_type: r.rule_type,
          severity: r.severity,
          json: r.json ?? {},
        });
      }
      toast({ title: "Catalog saved successfully" });
    } catch (err: any) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // ── Publish version ──────────────────────────────────
  const publishVersion = async () => {
    if (!activeVersionId) return;
    // Set this version to active, set others to draft
    const { data: companyData } = await supabase.from("companies").select("id").limit(1).single();
    if (!companyData) return;
    await supabase.from("catalog_versions").update({ status: "active" }).eq("id", activeVersionId);
    await supabase.from("catalog_versions").update({ status: "draft" }).neq("id", activeVersionId).eq("company_id", companyData.id);
    await supabase.from("companies").update({ active_catalog_version_id: activeVersionId }).eq("id", companyData.id);
    setVersions((prev) => prev.map((v) => ({ ...v, status: v.id === activeVersionId ? "active" : "draft" })));
    toast({ title: `Version "${activeVersion?.version}" published` });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">Product Catalog</h2>
          <p className="text-sm text-muted-foreground">Manage profiles, SKUs, colours, and pricing rules</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={saveAll} disabled={saving} size="sm" className="gap-1.5">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save All
          </Button>
        </div>
      </div>

      {/* Version selector */}
      <div className="bg-card border border-border rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-sm font-semibold text-foreground">Catalog Version</h3>
          {activeVersion && (
            <Badge variant={activeVersion.status === "active" ? "default" : "secondary"} className="text-[10px]">
              {activeVersion.status}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Select value={activeVersionId ?? ""} onValueChange={setActiveVersionId}>
            <SelectTrigger className="flex-1 bg-secondary border-border">
              <SelectValue placeholder="Select version…" />
            </SelectTrigger>
            <SelectContent>
              {versions.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  {v.version} {v.status === "active" && "✓"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {activeVersion && activeVersion.status !== "active" && (
            <Button onClick={publishVersion} variant="outline" size="sm" className="text-xs">
              Publish
            </Button>
          )}
        </div>

        <Separator />

        <div className="flex items-center gap-2">
          <Input
            value={newVersionName}
            onChange={(e) => setNewVersionName(e.target.value)}
            placeholder="New version name…"
            className="bg-secondary border-border text-sm"
          />
          <Button onClick={createVersion} variant="outline" size="sm" className="gap-1 shrink-0">
            <Plus className="w-3.5 h-3.5" /> Create
          </Button>
        </div>
      </div>

      {/* Tabs */}
      {activeVersionId && (
        <Tabs defaultValue="profiles" className="space-y-4">
          <TabsList className="bg-secondary">
            <TabsTrigger value="profiles" className="gap-1.5 text-xs"><Layers className="w-3.5 h-3.5" /> Profiles</TabsTrigger>
            <TabsTrigger value="skus" className="gap-1.5 text-xs"><Package className="w-3.5 h-3.5" /> SKUs</TabsTrigger>
            <TabsTrigger value="rules" className="gap-1.5 text-xs"><BookOpen className="w-3.5 h-3.5" /> Rules</TabsTrigger>
          </TabsList>

          {/* ── Profiles Tab ── */}
          <TabsContent value="profiles" className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{profiles.length} profile(s)</p>
              <Button onClick={addProfile} variant="outline" size="sm" className="gap-1 text-xs">
                <Plus className="w-3 h-3" /> Add Profile
              </Button>
            </div>
            {profiles.map((p) => (
              <div key={p.id} className="bg-card border border-border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="space-y-1 flex-1">
                      <Label className="text-[10px] text-muted-foreground">Kind</Label>
                      <Select value={p.kind} onValueChange={(v) => updateProfile(p.id, { kind: v })}>
                        <SelectTrigger className="bg-secondary border-border h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {["beam", "column", "rafter", "purlin", "fascia", "gutter", "bracket"].map((k) => (
                            <SelectItem key={k} value={k}>{k}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1 flex-1">
                      <Label className="text-[10px] text-muted-foreground">Display Name</Label>
                      <Input
                        value={(p.meta as any)?.displayName ?? ""}
                        onChange={(e) => updateProfile(p.id, { meta: { ...p.meta, displayName: e.target.value } })}
                        className="bg-secondary border-border h-8 text-sm"
                        placeholder="e.g. 150×50 Beam"
                      />
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => deleteProfile(p.id)} className="text-destructive hover:text-destructive ml-2">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Width (mm)</Label>
                    <Input
                      type="number"
                      value={(p.meta as any)?.widthMm ?? ""}
                      onChange={(e) => updateProfile(p.id, { meta: { ...p.meta, widthMm: Number(e.target.value) } })}
                      className="bg-secondary border-border h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Height (mm)</Label>
                    <Input
                      type="number"
                      value={(p.meta as any)?.heightMm ?? ""}
                      onChange={(e) => updateProfile(p.id, { meta: { ...p.meta, heightMm: Number(e.target.value) } })}
                      className="bg-secondary border-border h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Cost $/m</Label>
                    <Input
                      type="number"
                      value={(p.meta as any)?.costPerM ?? ""}
                      onChange={(e) => updateProfile(p.id, { meta: { ...p.meta, costPerM: Number(e.target.value) } })}
                      className="bg-secondary border-border h-8 text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
          </TabsContent>

          {/* ── SKUs Tab ── */}
          <TabsContent value="skus" className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{skus.length} SKU(s)</p>
              <Button onClick={addSku} variant="outline" size="sm" className="gap-1 text-xs">
                <Plus className="w-3 h-3" /> Add SKU
              </Button>
            </div>
            {skus.map((s) => (
              <div key={s.id} className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="space-y-1 flex-1">
                    <Label className="text-[10px] text-muted-foreground">SKU Code</Label>
                    <Input
                      value={s.sku_code}
                      onChange={(e) => updateSku(s.id, { sku_code: e.target.value })}
                      className="bg-secondary border-border h-8 text-sm font-mono"
                    />
                  </div>
                  <div className="space-y-1 flex-1">
                    <Label className="text-[10px] text-muted-foreground">Category</Label>
                    <Select value={s.category} onValueChange={(v) => updateSku(s.id, { category: v })}>
                      <SelectTrigger className="bg-secondary border-border h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["roofing", "framing", "accessory", "fastener", "flashing", "gutter"].map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1 flex-1">
                    <Label className="text-[10px] text-muted-foreground">Description</Label>
                    <Input
                      value={(s.meta as any)?.description ?? ""}
                      onChange={(e) => updateSku(s.id, { meta: { ...s.meta, description: e.target.value } })}
                      className="bg-secondary border-border h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1 w-24">
                    <Label className="text-[10px] text-muted-foreground">Unit Price</Label>
                    <Input
                      type="number"
                      value={(s.meta as any)?.unitPrice ?? ""}
                      onChange={(e) => updateSku(s.id, { meta: { ...s.meta, unitPrice: Number(e.target.value) } })}
                      className="bg-secondary border-border h-8 text-sm"
                    />
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => deleteSku(s.id)} className="text-destructive hover:text-destructive mt-4">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </TabsContent>

          {/* ── Rules Tab ── */}
          <TabsContent value="rules" className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{rules.length} rule(s)</p>
              <Button onClick={addRule} variant="outline" size="sm" className="gap-1 text-xs">
                <Plus className="w-3 h-3" /> Add Rule
              </Button>
            </div>
            {rules.map((r) => (
              <div key={r.id} className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="space-y-1 flex-1">
                    <Label className="text-[10px] text-muted-foreground">Rule Type</Label>
                    <Select value={r.rule_type} onValueChange={(v) => updateRule(r.id, { rule_type: v })}>
                      <SelectTrigger className="bg-secondary border-border h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["validation", "constraint", "pricing", "compatibility", "engineering"].map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1 w-28">
                    <Label className="text-[10px] text-muted-foreground">Severity</Label>
                    <Select value={r.severity} onValueChange={(v) => updateRule(r.id, { severity: v })}>
                      <SelectTrigger className="bg-secondary border-border h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="error">Error</SelectItem>
                        <SelectItem value="warning">Warning</SelectItem>
                        <SelectItem value="info">Info</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1 flex-[2]">
                    <Label className="text-[10px] text-muted-foreground">Description</Label>
                    <Input
                      value={(r.json as any)?.description ?? ""}
                      onChange={(e) => updateRule(r.id, { json: { ...r.json, description: e.target.value } })}
                      className="bg-secondary border-border h-8 text-sm"
                      placeholder="e.g. Min pitch 2° for flat roof"
                    />
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => deleteRule(r.id)} className="text-destructive hover:text-destructive mt-4">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
