import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const SUPABASE_URL = Deno.env.get("SB_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SB_ANON_KEY") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SB_SERVICE_ROLE_KEY") ?? "";

const jsonResponse = (status: number, payload: Record<string, unknown>) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
    },
  });

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return jsonResponse(200, { ok: true });
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    return jsonResponse(500, { error: "Missing Supabase env vars" });
  }

  const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: req.headers.get("Authorization") ?? "",
      },
    },
  });

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const {
    data: { user },
    error: authError,
  } = await supabaseAuth.auth.getUser();

  if (authError || !user) {
    return jsonResponse(401, { error: "Unauthorized" });
  }

  const { data: adminRow, error: adminError } = await supabaseAdmin
    .from("app_users")
    .select("id, role_id, roles(name)")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (adminError || !adminRow || (adminRow as any).roles?.name !== "admin") {
    return jsonResponse(403, { error: "Forbidden" });
  }

  let body: { username?: string; password?: string; role?: string } = {};
  try {
    body = await req.json();
  } catch {
    return jsonResponse(400, { error: "Invalid JSON" });
  }

  const username = (body.username ?? "").trim();
  const password = (body.password ?? "").trim();
  const roleName = (body.role ?? "").trim().toLowerCase();

  if (!username || !password || !roleName) {
    return jsonResponse(400, { error: "username, password, role are required" });
  }

  const { data: roleRow, error: roleError } = await supabaseAdmin
    .from("roles")
    .select("id")
    .eq("name", roleName)
    .maybeSingle();

  if (roleError || !roleRow) {
    return jsonResponse(400, { error: "Invalid role" });
  }

  const slug = slugify(username) || "user";
  const emailInternal = `${slug}@app.local`;

  const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email: emailInternal,
    password,
    email_confirm: true,
  });

  if (createError || !created.user) {
    return jsonResponse(400, { error: createError?.message || "User not created" });
  }

  const { error: insertError } = await supabaseAdmin
    .from("app_users")
    .insert({
      username,
      password_hash: "",
      role_id: roleRow.id,
      auth_user_id: created.user.id,
      email_internal: emailInternal,
      is_active: true,
    });

  if (insertError) {
    return jsonResponse(400, { error: insertError.message });
  }

  return jsonResponse(200, {
    ok: true,
    username,
    role: roleName,
  });
});
