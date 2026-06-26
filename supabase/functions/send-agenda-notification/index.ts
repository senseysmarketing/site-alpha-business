// Edge Function: send-agenda-notification
// Envia notificação por e-mail ao responsável de um evento da agenda
// (visitas, eventos e tarefas em public.visits_scheduling).

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SETTINGS_KEY = "agenda_email_notifications";

interface NotifyConfig {
  enabled: boolean;
  subjectTemplate?: string;
  notifyTypes?: string[]; // ['visita','evento','tarefa']
  notifyEvents?: string[]; // ['created','reassigned']
  includeLead?: boolean;
  includeProperty?: boolean;
  includeNotes?: boolean;
}

interface RequestBody {
  mode: "auto" | "test";
  event_id?: string;
  event?: "created" | "reassigned";
  test_recipient?: string;
}

const TYPE_LABELS: Record<string, string> = {
  visita: "Visita",
  evento: "Evento",
  tarefa: "Tarefa",
};

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function formatDateBR(d: string | null | undefined): string {
  if (!d) return "—";
  try {
    return new Date(d + "T00:00:00").toLocaleDateString("pt-BR");
  } catch {
    return d;
  }
}

function buildHtml(opts: {
  ev: Record<string, any>;
  property: Record<string, any> | null;
  config: NotifyConfig;
  assigneeName?: string | null;
  headline: string;
}): string {
  const { ev, property, config, assigneeName, headline } = opts;
  const typeLabel = TYPE_LABELS[ev.event_type] ?? ev.event_type ?? "—";
  const displayTitle = ev.title || ev.lead_name || "Sem título";

  const greeting = assigneeName
    ? `<p style="margin:0 0 16px;font-family:Inter,Arial,sans-serif;font-size:14px;color:#222;">Olá, <strong>${escapeHtml(assigneeName)}</strong>. Um item da sua agenda precisa de atenção.</p>`
    : "";

  const leadBlock =
    config.includeLead !== false && (ev.lead_name || ev.lead_email || ev.lead_phone)
      ? `
        <h3 style="font-family:Raleway,Arial,sans-serif;font-size:14px;color:#2A070C;margin:24px 0 8px;text-transform:uppercase;letter-spacing:1px;">Cliente</h3>
        <table style="width:100%;border-collapse:collapse;font-family:Inter,Arial,sans-serif;font-size:14px;color:#222;">
          <tr><td style="padding:6px 0;color:#6b6b6b;width:140px;">Nome</td><td style="padding:6px 0;">${escapeHtml(ev.lead_name) || "—"}</td></tr>
          <tr><td style="padding:6px 0;color:#6b6b6b;">E-mail</td><td style="padding:6px 0;">${escapeHtml(ev.lead_email) || "—"}</td></tr>
          <tr><td style="padding:6px 0;color:#6b6b6b;">Telefone</td><td style="padding:6px 0;">${escapeHtml(ev.lead_phone) || "—"}</td></tr>
        </table>
      `
      : "";

  const propertyBlock =
    config.includeProperty !== false && (property || ev.property_code)
      ? `
        <h3 style="font-family:Raleway,Arial,sans-serif;font-size:14px;color:#2A070C;margin:24px 0 8px;text-transform:uppercase;letter-spacing:1px;">Imóvel</h3>
        <table style="width:100%;border-collapse:collapse;font-family:Inter,Arial,sans-serif;font-size:14px;color:#222;">
          <tr><td style="padding:6px 0;color:#6b6b6b;width:140px;">Código</td><td style="padding:6px 0;">${escapeHtml(property?.code || ev.property_code) || "—"}</td></tr>
          ${property?.title ? `<tr><td style="padding:6px 0;color:#6b6b6b;">Título</td><td style="padding:6px 0;">${escapeHtml(property.title)}</td></tr>` : ""}
        </table>
      `
      : "";

  const notesBlock =
    config.includeNotes !== false && ev.notes
      ? `
        <h3 style="font-family:Raleway,Arial,sans-serif;font-size:14px;color:#2A070C;margin:24px 0 8px;text-transform:uppercase;letter-spacing:1px;">Notas</h3>
        <p style="font-family:Inter,Arial,sans-serif;font-size:14px;color:#222;line-height:1.6;margin:0;">${escapeHtml(ev.notes)}</p>
      `
      : "";

  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F8F8F8;font-family:Inter,Arial,sans-serif;color:#222;">
  <div style="max-width:600px;margin:0 auto;padding:32px 24px;background:#ffffff;">
    <div style="border-bottom:1px solid #ececec;padding-bottom:16px;margin-bottom:24px;">
      <p style="margin:0;font-family:Raleway,Arial,sans-serif;font-size:12px;letter-spacing:2px;color:#2A070C;text-transform:uppercase;">AlphaBusiness · Agenda</p>
      <h1 style="margin:8px 0 0;font-family:Raleway,Arial,sans-serif;font-size:22px;color:#111;">${escapeHtml(headline)}</h1>
    </div>

    ${greeting}

    <h3 style="font-family:Raleway,Arial,sans-serif;font-size:14px;color:#2A070C;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px;">Resumo</h3>
    <table style="width:100%;border-collapse:collapse;font-family:Inter,Arial,sans-serif;font-size:14px;color:#222;">
      <tr><td style="padding:6px 0;color:#6b6b6b;width:140px;">Tipo</td><td style="padding:6px 0;">${escapeHtml(typeLabel)}</td></tr>
      <tr><td style="padding:6px 0;color:#6b6b6b;">Título</td><td style="padding:6px 0;">${escapeHtml(displayTitle)}</td></tr>
      <tr><td style="padding:6px 0;color:#6b6b6b;">Data</td><td style="padding:6px 0;">${formatDateBR(ev.visit_date)}</td></tr>
      <tr><td style="padding:6px 0;color:#6b6b6b;">Horário</td><td style="padding:6px 0;">${escapeHtml(ev.visit_time) || "—"}</td></tr>
      <tr><td style="padding:6px 0;color:#6b6b6b;">Status</td><td style="padding:6px 0;">${escapeHtml(ev.status) || "pendente"}</td></tr>
    </table>

    ${leadBlock}
    ${propertyBlock}
    ${notesBlock}

    <p style="margin-top:32px;font-family:Inter,Arial,sans-serif;font-size:12px;color:#999;">Esta é uma notificação automática enviada pela Agenda AlphaBusiness.</p>
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
      return new Response(
        JSON.stringify({ status: "failed", error: "RESEND_API_KEY not set" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const admin = createClient(supabaseUrl, serviceKey);

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
    let ev: Record<string, any> | null = null;
    let property: Record<string, any> | null = null;
    let headline = "Novo item na agenda";

    if (body.mode === "test") {
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

      ev = {
        event_type: "visita",
        title: "Visita de Teste",
        lead_name: "Cliente Exemplo",
        lead_email: "cliente@exemplo.com",
        lead_phone: "(11) 99999-9999",
        property_code: "EX-001",
        visit_date: new Date().toISOString().slice(0, 10),
        visit_time: "10:00",
        status: "pendente",
        notes: "Este é apenas um envio de teste para validar a configuração.",
      };
      headline = "Teste de notificação — Agenda";
    } else {
      if (!body.event_id) {
        return new Response(JSON.stringify({ error: "Missing event_id" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Filtro por evento (created/reassigned)
      if (
        config.notifyEvents?.length &&
        body.event &&
        !config.notifyEvents.includes(body.event)
      ) {
        return new Response(JSON.stringify({ status: "skipped_event" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: row, error: rowErr } = await admin
        .from("visits_scheduling")
        .select("*")
        .eq("id", body.event_id)
        .maybeSingle();
      if (rowErr || !row) {
        return new Response(
          JSON.stringify({ status: "failed", error: rowErr?.message ?? "Event not found" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      ev = row;

      if (
        config.notifyTypes?.length &&
        ev.event_type &&
        !config.notifyTypes.includes(ev.event_type)
      ) {
        return new Response(JSON.stringify({ status: "skipped_type" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!ev.assigned_user_id) {
        return new Response(JSON.stringify({ status: "skipped_no_assignee" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: profile } = await admin
        .from("team_profiles")
        .select("full_name, is_active")
        .eq("user_id", ev.assigned_user_id)
        .maybeSingle();

      if (profile && profile.is_active === false) {
        return new Response(JSON.stringify({ status: "skipped_inactive_user" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      assigneeName = profile?.full_name ?? null;

      const { data: userData, error: userErr } =
        await admin.auth.admin.getUserById(ev.assigned_user_id);
      if (userErr || !userData?.user?.email || !isValidEmail(userData.user.email)) {
        return new Response(
          JSON.stringify({ status: "skipped_no_recipient" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      recipientEmail = userData.user.email;

      headline = body.event === "reassigned"
        ? "Item da agenda reatribuído a você"
        : `Novo ${TYPE_LABELS[ev.event_type] ?? "item"} atribuído a você`;

      if (ev.property_id) {
        const { data: propRow } = await admin
          .from("properties")
          .select("id, title, code")
          .eq("id", ev.property_id)
          .maybeSingle();
        property = propRow ?? null;
      }
    }

    const subjectBase = (config?.subjectTemplate?.trim() ||
      "Agenda — {{title}}")
      .replace("{{title}}", ev?.title || ev?.lead_name || "Novo item")
      .replace("{{type}}", TYPE_LABELS[ev?.event_type as string] ?? "");

    const subject = body.mode === "auto" && body.event === "reassigned"
      ? `[Reatribuído] ${subjectBase}`
      : subjectBase;

    const html = buildHtml({ ev: ev!, property, config, assigneeName, headline });

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
    return new Response(
      JSON.stringify({ status: "failed", error: (e as Error).message }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
