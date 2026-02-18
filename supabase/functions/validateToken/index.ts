import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!token) return new Response(JSON.stringify({ error: "Missing token" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Look up token
  const { data: shareToken, error } = await supabase
    .from("share_tokens")
    .select("*, revisions(*, projects(*, companies(*)))")
    .eq("token_hash", token)
    .single();

  if (error || !shareToken) {
    return new Response(JSON.stringify({ error: "Invalid token" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  if (new Date(shareToken.expires_at) < new Date()) {
    return new Response(JSON.stringify({ error: "Token expired" }), { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const revision = shareToken.revisions;
  const project = revision?.projects;
  const company = project?.companies;

  return new Response(JSON.stringify({
    revision: { id: revision.id, config: revision.config, pricing: revision.pricing, created_at: revision.created_at },
    project: { id: project?.id, customer: project?.customer, status: project?.status },
    chatEmbed: company?.ghl_chat_embed || "",
  }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
