import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Plus, Share2, FileText, Clock } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { DEFAULT_PATIO_CONFIG } from "@/types/configurator";

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<any>(null);
  const [revisions, setRevisions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [suburb, setSuburb] = useState("");

  const fetchData = useCallback(async () => {
    if (!id) return;
    const [projRes, revRes] = await Promise.all([
      supabase.from("projects").select("*").eq("id", id).single(),
      supabase.from("revisions").select("*").eq("project_id", id).order("created_at", { ascending: false }),
    ]);
    if (projRes.data) {
      setProject(projRes.data);
      const c = projRes.data.customer as any;
      setCustomerName(c?.name || "");
      setCustomerEmail(c?.email || "");
      setCustomerPhone(c?.phone || "");
      setSuburb(c?.suburb || "");
    }
    setRevisions(revRes.data || []);
    setLoading(false);
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const saveCustomer = async () => {
    if (!id) return;
    const { error } = await supabase.from("projects").update({
      customer: { name: customerName, email: customerEmail, phone: customerPhone, suburb },
    }).eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else toast({ title: "Saved" });
  };

  const createRevision = async () => {
    if (!id) return;
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase.from("revisions").insert([{
      project_id: id,
      created_by: user?.id,
      config: DEFAULT_PATIO_CONFIG as any,
      pricing: {},
    }]).select().single();
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Revision created" });
      setRevisions((prev) => [data, ...prev]);
    }
  };

  const generateShareLink = async (revisionId: string) => {
    const token = crypto.randomUUID();
    const tokenHash = token; // In production, hash this
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const { error } = await supabase.from("share_tokens").insert({
      revision_id: revisionId,
      token_hash: tokenHash,
      expires_at: expiresAt,
    });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    const url = `${window.location.origin}/share/${token}`;
    await navigator.clipboard.writeText(url);
    toast({ title: "Link copied!", description: url });
  };

  if (loading) return <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!project) return <div className="p-6 text-muted-foreground">Project not found</div>;

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/app/projects")} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="font-display text-xl font-bold text-foreground">{customerName || "Untitled Project"}</h2>
          <p className="text-xs text-muted-foreground">{id?.slice(0, 8)} · {project.status}</p>
        </div>
      </div>

      {/* Customer details */}
      <div className="bg-card border border-border rounded-lg p-4 space-y-3">
        <h3 className="font-display text-sm font-semibold text-foreground">Customer</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1"><Label className="text-xs text-muted-foreground">Name</Label><Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="bg-secondary border-border" /></div>
          <div className="space-y-1"><Label className="text-xs text-muted-foreground">Email</Label><Input value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} className="bg-secondary border-border" /></div>
          <div className="space-y-1"><Label className="text-xs text-muted-foreground">Phone</Label><Input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="bg-secondary border-border" /></div>
          <div className="space-y-1"><Label className="text-xs text-muted-foreground">Suburb</Label><Input value={suburb} onChange={(e) => setSuburb(e.target.value)} className="bg-secondary border-border" /></div>
        </div>
        <Button variant="outline" size="sm" onClick={saveCustomer}>Save Customer</Button>
      </div>

      {/* Revisions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-sm font-semibold text-foreground">Revisions</h3>
          <Button size="sm" onClick={createRevision}><Plus className="w-3 h-3 mr-1" /> New Revision</Button>
        </div>
        {revisions.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No revisions. Create one to start configuring.</p>
        ) : (
          <div className="space-y-2">
            {revisions.map((rev, i) => (
              <div key={rev.id} className="bg-card border border-border rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Rev {revisions.length - i}</p>
                    <p className="text-xs text-muted-foreground">{new Date(rev.created_at).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" title="Export PDF"><FileText className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => generateShareLink(rev.id)} title="Share Link"><Share2 className="w-4 h-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
