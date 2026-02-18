import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, FolderKanban } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Project {
  id: string;
  status: string;
  customer: any;
  created_at: string;
  updated_at: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchProjects = async () => {
    const { data, error } = await supabase.from("projects").select("*").order("updated_at", { ascending: false });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
    else setProjects(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchProjects(); }, []);

  const createProject = async () => {
    // Get user's company_id
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: appUser } = await supabase.from("app_users").select("company_id").eq("auth_user_id", user.id).single();
    if (!appUser) {
      toast({ title: "Setup needed", description: "Your account isn't linked to a company yet. Contact your admin.", variant: "destructive" });
      return;
    }
    const { data, error } = await supabase.from("projects").insert({ company_id: appUser.company_id, customer: { name: "New Customer" } }).select().single();
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else navigate(`/app/projects/${data.id}`);
  };

  const statusColors: Record<string, string> = {
    draft: "bg-muted text-muted-foreground",
    quoted: "bg-primary/20 text-primary",
    sent: "bg-blue-500/20 text-blue-400",
    approved: "bg-green-500/20 text-green-400",
    won: "bg-green-600/20 text-green-500",
    lost: "bg-destructive/20 text-destructive",
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">Projects</h2>
          <p className="text-sm text-muted-foreground">Manage patio quotes and designs</p>
        </div>
        <Button onClick={createProject}><Plus className="w-4 h-4 mr-1" /> New Project</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : projects.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <FolderKanban className="w-12 h-12 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">No projects yet</p>
          <Button onClick={createProject}><Plus className="w-4 h-4 mr-1" /> Create First Project</Button>
        </div>
      ) : (
        <div className="grid gap-3">
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => navigate(`/app/projects/${p.id}`)}
              className="bg-card border border-border rounded-lg p-4 text-left hover:border-primary/40 transition-colors flex items-center justify-between"
            >
              <div>
                <p className="font-medium text-foreground">{(p.customer as any)?.name || "Untitled"}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(p.updated_at).toLocaleDateString()} · {p.id.slice(0, 8)}
                </p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[p.status] || statusColors.draft}`}>
                {p.status}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
