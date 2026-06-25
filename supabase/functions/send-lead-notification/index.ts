// Edge Function: send-lead-notification
// Envia notificação por e-mail para o corretor atribuído ao lead.
// Disparado por triggers AFTER INSERT e AFTER UPDATE OF assigned_user_id em public.leads (mode="auto")
// ou manualmente para teste (mode="test") — neste caso enviado ao usuário autenticado que solicitou.

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SETTINGS_KEY = "lead_email_notifications";

interface NotifyConfig {
  enabled: boolean;
  subjectTemplate?: string;
  notifyOrigins?: string[];
  notifyStages?: string[];
  includeLeadContact?: boolean;
  includeProperty?: boolean;
  includeInsights?: boolean;
}

interface RequestBody {
  mode: "auto" | "test";
  lead_id?: string;
  event?: "created" | "reassigned";
  test_recipient?: string;
}

const ORIGIN_LABELS: Record<string, string> = {
  formulario_contato: "Formulário de contato",
  agendamento_visita: "Agendamento de visita",
  anunciar_imovel: "Anunciar imóvel",
  rafa_ia: "Rafa IA",
  manual: "Cadastro manual",
};

const STAGE_LABELS: Record<string, string> = {
  novos: "Novos",
  visita_agendada: "Visita agendada",
  proposta: "Proposta",
  contrato: "Contrato",
  fechado: "Fechado",
};

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatCurrency(value: number | null | undefined): string {
  if (!value && value !== 0) return "—";
  try {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return String(value);
  }
}

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function buildHtml(opts: {
  lead: Record<string, any>;
  property: Record<string, any> | null;
  config: NotifyConfig;
  assigneeName?: string | null;
  headline: string;
}): string {
  const { lead, property, config, assigneeName, headline } = opts;
  const originLabel = ORIGIN_LABELS[lead.origin as string] ?? (lead.origin || "—");
  const stageLabel =
    STAGE_LABELS[lead.pipeline_stage as string] ?? (lead.pipeline_stage || "—");

  const greeting = assigneeName
    ? `<p style="margin:0 0 16px;font-family:Inter,Arial,sans-serif;font-size:14px;color:#222;">Olá, <strong>${escapeHtml(assigneeName)}</strong>. Um lead foi atribuído a você no CRM.</p>`
    : "";

  const contactRows = config.includeLeadContact !== false
    ? `
      <tr><td style="padding:6px 0;color:#6b6b6b;">E-mail</td><td style="padding:6px 0;">${escapeHtml(lead.email) || "—"}</td></tr>
      <tr><td style="padding:6px 0;color:#6b6b6b;">Telefone</td><td style="padding:6px 0;">${escapeHtml(lead.phone) || "—"}</td></tr>
    `
    : "";

  const propertyBlock =
    config.includeProperty !== false && property
      ? `
        <h3 style="font-family:Raleway,Arial,sans-serif;font-size:14px;color:#2A070C;margin:24px 0 8px;text-transform:uppercase;letter-spacing:1px;">Imóvel de interesse</h3>
        <table style="width:100%;border-collapse:collapse;font-family:Inter,Arial,sans-serif;font-size:14px;color:#222;">
          <tr><td style="padding:6px 0;color:#6b6b6b;width:140px;">Código</td><td style="padding:6px 0;">${escapeHtml(property.code) || "—"}</td></tr>
          <tr><td style="padding:6px 0;color:#6b6b6b;">Título</td><td style="padding:6px 0;">${escapeHtml(property.title) || "—"}</td></tr>
        </table>
      `
      : "";

  const insightsBlock =
    config.includeInsights !== false && lead.ai_insights
      ? `
        <h3 style="font-family:Raleway,Arial,sans-serif;font-size:14px;color:#2A070C;margin:24px 0 8px;text-transform:uppercase;letter-spacing:1px;">Insights</h3>
        <p style="font-family:Inter,Arial,sans-serif;font-size:14px;color:#222;line-height:1.6;margin:0;">${escapeHtml(lead.ai_insights)}</p>
      `
      : "";

  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F8F8F8;font-family:Inter,Arial,sans-serif;color:#222;">
  <div style="max-width:600px;margin:0 auto;padding:32px 24px;background:#ffffff;">
    <div style="border-bottom:1px solid #ececec;padding-bottom:16px;margin-bottom:24px;">
      <p style="margin:0;font-family:Raleway,Arial,sans-serif;font-size:12px;letter-spacing:2px;color:#2A070C;text-transform:uppercase;">AlphaBusiness · CRM</p>
      <h1 style="margin:8px 0 0;font-family:Raleway,Arial,sans-serif;font-size:22px;color:#111;">${escapeHtml(headline)}</h1>
    </div>

    ${greeting}

    <h3 style="font-family:Raleway,Arial,sans-serif;font-size:14px;color:#2A070C;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px;">Lead</h3>
    <table style="width:100%;border-collapse:collapse;font-family:Inter,Arial,sans-serif;font-size:14px;color:#222;">
      <tr><td style="padding:6px 0;color:#6b6b6b;width:140px;">Nome</td><td style="padding:6px 0;">${escapeHtml(lead.name) || "—"}</td></tr>
      ${contactRows}
      <tr><td style="padding:6px 0;color:#6b6b6b;">Origem</td><td style="padding:6px 0;">${escapeHtml(originLabel)}</td></tr>
      <tr><td style="padding:6px 0;color:#6b6b6b;">Estágio</td><td style="padding:6px 0;">${escapeHtml(stageLabel)}</td></tr>
      <tr><td style="padding:6px 0;color:#6b6b6b;">Valor do negócio</td><td style="padding:6px 0;">${formatCurrency(lead.deal_value)}</td></tr>
    </table>

    ${propertyBlock}
    ${insightsBlock}

    <p style="margin-top:32px;font-family:Inter,Arial,sans-serif;font-size:12px;color:#999;">Esta é uma notificação automática enviada pelo CRM AlphaBusiness.</p>
  </div>
</body></html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as RequestBody;
    if (!body || !["auto", "test"].includes(body.mode)) {
      return new Response(JSON.stringify({ error: "Invalid mode" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendKey = Deno.env.get("RESEND_API_KEY");

    if (!resendKey) {
      console.error("Missing RESEND_API_KEY");
      return new Response(
        JSON.stringify({ status: "failed", error: "RESEND_API_KEY not set" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const admin = createClient(supabaseUrl, serviceKey);

    // Carregar configurações
    const { data: settingsRow } = await admin
      .from("site_settings")
      .select("value")
      .eq("key", SETTINGS_KEY)
      .maybeSingle();

    const config = (settingsRow?.value ?? {}) as NotifyConfig;

    if (body.mode === "auto" && !config?.enabled) {
      return new Response(JSON.stringify({ status: "disabled" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let recipientEmail: string | null = null;
    let assigneeName: string | null = null;
    let lead: Record<string, any> | null = null;
    let property: Record<string, any> | null = null;
    let headline = "Novo lead recebido";

    if (body.mode === "test") {
      // Resolve recipient: explicitly provided OR authenticated user from JWT
      if (body.test_recipient && isValidEmail(body.test_recipient)) {
        recipientEmail = body.test_recipient.toLowerCase();
      } else {
        const authHeader = req.headers.get("Authorization") ?? "";
        const token = authHeader.replace(/^Bearer\s+/i, "");
        if (token) {
          const { data: userData } = await admin.auth.getUser(token);
          if (userData?.user?.email) recipientEmail = userData.user.email;
        }
      }

      if (!recipientEmail) {
        return new Response(
          JSON.stringify({
            status: "failed",
            error: "Sem destinatário para teste. Faça login para receber no seu e-mail.",
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      lead = {
        name: "Lead de Teste",
        email: "teste@exemplo.com",
        phone: "(11) 99999-9999",
        origin: "manual",
        pipeline_stage: "novos",
        deal_value: 0,
        ai_insights: "Este é apenas um envio de teste para validar a configuração.",
      };
      headline = "Teste de notificação — Novo lead";
    } else {
      if (!body.lead_id) {
        return new Response(JSON.stringify({ error: "Missing lead_id" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data: leadRow, error: leadErr } = await admin
        .from("leads")
        .select("*")
        .eq("id", body.lead_id)
        .maybeSingle();
      if (leadErr || !leadRow) {
        return new Response(
          JSON.stringify({ status: "failed", error: leadErr?.message ?? "Lead not found" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      lead = leadRow;

      // Filtros de origem / estágio
      if (
        config.notifyOrigins?.length &&
        lead.origin &&
        !config.notifyOrigins.includes(lead.origin)
      ) {
        return new Response(JSON.stringify({ status: "skipped_origin" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (
        config.notifyStages?.length &&
        lead.pipeline_stage &&
        !config.notifyStages.includes(lead.pipeline_stage)
      ) {
        return new Response(JSON.stringify({ status: "skipped_stage" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Resolver corretor atribuído
      if (!lead.assigned_user_id) {
        return new Response(JSON.stringify({ status: "skipped_no_assignee" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Garantir que o corretor está ativo
      const { data: profile } = await admin
        .from("team_profiles")
        .select("full_name, is_active")
        .eq("user_id", lead.assigned_user_id)
        .maybeSingle();

      if (profile && profile.is_active === false) {
        return new Response(JSON.stringify({ status: "skipped_inactive_user" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      assigneeName = profile?.full_name ?? null;

      // Buscar e-mail via auth admin
      const { data: userData, error: userErr } =
        await admin.auth.admin.getUserById(lead.assigned_user_id);
      if (userErr || !userData?.user?.email || !isValidEmail(userData.user.email)) {
        console.warn("No email for assigned user", lead.assigned_user_id, userErr?.message);
        return new Response(
          JSON.stringify({ status: "skipped_no_recipient" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      recipientEmail = userData.user.email;

      headline = body.event === "reassigned"
        ? "Lead reatribuído a você"
        : "Novo lead atribuído a você";

      if (lead.property_id) {
        const { data: propRow } = await admin
          .from("properties")
          .select("id, title, code")
          .eq("id", lead.property_id)
          .maybeSingle();
        property = propRow ?? null;
      }
    }

    const subjectBase = (config?.subjectTemplate?.trim() ||
      "Novo lead recebido — {{name}}")
      .replace("{{name}}", lead?.name ?? "Lead")
      .replace("{{origin}}", ORIGIN_LABELS[lead?.origin as string] ?? lead?.origin ?? "—");

    const subject = body.mode === "auto" && body.event === "reassigned"
      ? `[Reatribuído] ${subjectBase}`
      : subjectBase;

    const html = buildHtml({ lead: lead!, property, config, assigneeName, headline });

    const fromAddress =
      Deno.env.get("RESEND_FROM_EMAIL") ?? "AlphaBusiness <leads@rafaelalbuquerque.com.br>";

    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [recipientEmail],
        subject,
        html,
      }),
    });

    const respBody = await resp.text();
    if (!resp.ok) {
      console.error("Resend error", resp.status, respBody);
      return new Response(
        JSON.stringify({ status: "failed", error: respBody, http: resp.status }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ status: "sent", recipient: recipientEmail, response: respBody }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("send-lead-notification error", e);
    return new Response(
      JSON.stringify({ status: "failed", error: (e as Error).message }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
