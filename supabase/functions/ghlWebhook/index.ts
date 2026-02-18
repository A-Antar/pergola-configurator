import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { event, revision_id, company_id, project_id, customer, estimate, live_link, pdf_url } = body;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Resolve company from revision if not provided
    let resolvedCompanyId = company_id;
    let resolvedProjectId = project_id;
    let resolvedCustomer = customer;
    let webhookUrl = "";

    if (revision_id) {
      const { data: rev } = await supabase
        .from("revisions")
        .select("*, projects(*, companies(*))")
        .eq("id", revision_id)
        .single();
      if (rev) {
        resolvedProjectId = resolvedProjectId || rev.projects?.id;
        resolvedCompanyId = resolvedCompanyId || rev.projects?.company_id;
        resolvedCustomer = resolvedCustomer || rev.projects?.customer;
        webhookUrl = rev.projects?.companies?.ghl_webhook_url || "";
      }
    }

    // Log event
    if (resolvedCompanyId) {
      await supabase.from("events").insert({
        company_id: resolvedCompanyId,
        project_id: resolvedProjectId || null,
        revision_id: revision_id || null,
        type: event,
        meta: { customer: resolvedCustomer, estimate, live_link, pdf_url },
      });
    }

    // Fire webhook if configured
    if (webhookUrl) {
      const payload = {
        event,
        company_id: resolvedCompanyId,
        project_id: resolvedProjectId,
        revision_id,
        customer: resolvedCustomer,
        estimate,
        live_link,
        pdf_url,
        ts: new Date().toISOString(),
      };
      try {
        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch (e) {
        console.error("Webhook delivery failed:", e);
      }
    }

    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
