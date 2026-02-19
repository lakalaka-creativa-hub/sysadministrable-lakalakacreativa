"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [logoUrl, setLogoUrl] = useState("");
  const [businessName, setBusinessName] = useState("");
  const defaultSupport = {
    phone: "812 035 8808",
    facebook: "/lakalakacreativa",
  };
  const [supportPhone, setSupportPhone] = useState(defaultSupport.phone);
  const [supportFacebook, setSupportFacebook] = useState(defaultSupport.facebook);
  const [themeVars, setThemeVars] = useState(() => {
    if (typeof window === "undefined") {
      return {
        appBg: "#f7f7f8",
        appCard: "#ffffff",
        appPrimary: "#2563eb",
        appSecondary: "#64748b",
        appText: "#111827",
      };
    }
    try {
      const cached = window.localStorage.getItem("branding-theme");
      if (!cached) throw new Error("no-cache");
      return JSON.parse(cached);
    } catch {
      return {
        appBg: "#f7f7f8",
        appCard: "#ffffff",
        appPrimary: "#2563eb",
        appSecondary: "#64748b",
        appText: "#111827",
      };
    }
  });
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadBranding = async () => {
      const { data, error } = await supabase
        .from("branding_settings")
        .select(
          "logo_url, business_name, app_bg, app_card, app_primary, app_secondary, app_text, contact_phone"
        )
        .eq("id", "default")
        .maybeSingle();
      if (!error && data) {
        setLogoUrl(data.logo_url || "");
        setBusinessName(data.business_name || "");
        setSupportPhone(data.contact_phone || defaultSupport.phone);
        setSupportFacebook(defaultSupport.facebook);
        setThemeVars({
          appBg: data.app_bg || "#f7f7f8",
          appCard: data.app_card || "#ffffff",
          appPrimary: data.app_primary || "#2563eb",
          appSecondary: data.app_secondary || "#64748b",
          appText: data.app_text || "#111827",
        });
        if (typeof document !== "undefined") {
          const root = document.documentElement;
          root.style.setProperty("--boho-bg", data.app_bg || "#f7f7f8");
          root.style.setProperty("--boho-card", data.app_card || "#ffffff");
          root.style.setProperty("--boho-primary", data.app_primary || "#2563eb");
          root.style.setProperty("--boho-secondary", data.app_secondary || "#64748b");
          root.style.setProperty("--boho-text", data.app_text || "#111827");
          root.style.setProperty("--background", data.app_bg || "#f7f7f8");
          root.style.setProperty("--foreground", data.app_text || "#111827");
          root.style.setProperty("--card", data.app_card || "#ffffff");
          root.style.setProperty("--card-foreground", data.app_text || "#111827");
          root.style.setProperty("--primary", data.app_primary || "#2563eb");
          root.style.setProperty("--primary-foreground", "#ffffff");
          root.style.setProperty("--secondary", data.app_secondary || "#64748b");
          root.style.setProperty("--secondary-foreground", "#ffffff");
          root.style.setProperty(
            "--border",
            "color-mix(in srgb, var(--boho-text) 18%, transparent)"
          );
          root.style.setProperty("--ring", data.app_primary || "#2563eb");
          root.style.setProperty("--accent", data.app_secondary || "#64748b");
          root.style.setProperty("--accent-foreground", "#ffffff");
          root.style.setProperty("--muted", data.app_bg || "#f7f7f8");
          root.style.setProperty("--muted-foreground", data.app_text || "#111827");
          root.style.setProperty("--popover", data.app_card || "#ffffff");
          root.style.setProperty("--popover-foreground", data.app_text || "#111827");
          root.style.setProperty("--input", data.app_card || "#ffffff");
        }
      }
    };

    loadBranding();
  }, []);

  const toInternalEmail = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return "";
    if (trimmed.includes("@")) return trimmed.toLowerCase();
    const slug = trimmed
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ".")
      .replace(/^\.+|\.+$/g, "");
    return `${slug}@app.local`;
  };

  const handleLogin = async () => {
    setLoading(true);
    setError(null);

    const email = toInternalEmail(username);
    if (!email || !password.trim()) {
      setError("Completa usuario y contraseña.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: password.trim(),
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    const { data: me, error: meError } = await supabase
      .from("app_users")
      .select("is_active")
      .eq("auth_user_id", (await supabase.auth.getUser()).data.user?.id ?? "")
      .maybeSingle();

    if (meError || !me || !me.is_active) {
      await supabase.auth.signOut();
      setError("Usuario inactivo o no autorizado.");
      setLoading(false);
      return;
    }

    // 👉 LOGIN EXITOSO
    router.replace("/dashboard");
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-[var(--boho-bg)]"
      style={{
        "--boho-bg": themeVars.appBg,
        "--boho-card": themeVars.appCard,
        "--boho-primary": themeVars.appPrimary,
        "--boho-secondary": themeVars.appSecondary,
        "--boho-text": themeVars.appText,
      } as React.CSSProperties}
    >
      <div
        className="w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--boho-card)] p-6 shadow-sm"
        style={{
          "--border": "color-mix(in srgb, var(--boho-text) 18%, transparent)",
        } as React.CSSProperties}
      >
        {logoUrl ? (
          <div className="mb-4 flex items-center justify-center">
            <img
              src={logoUrl}
              alt={businessName || "Logo"}
              className="h-32 w-full max-w-[320px] rounded-xl object-contain"
            />
          </div>
        ) : null}
        <h1
          className="mb-4 text-center text-xl font-semibold text-[var(--boho-text)]"
          style={{
            maxWidth: "320px",
            marginLeft: "auto",
            marginRight: "auto",
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {businessName || "Tu negocio"}
        </h1>

        <input
          className="mb-3 w-full rounded-lg border p-2"
          type="text"
          placeholder="Usuario"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          className="mb-4 w-full rounded-lg border p-2"
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && (
          <p className="mb-3 text-sm text-red-600">{error}</p>
        )}

        <Button
          className="w-full bg-[var(--boho-primary)] text-white hover:opacity-90"
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? "Entrando..." : "Entrar"}
        </Button>

        <div className="mt-5 rounded-lg border border-[var(--border)] bg-[var(--boho-card)] px-3 py-2 text-xs text-[var(--boho-text)]">
          <div className="flex items-center gap-2 font-semibold">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--boho-primary)]/10 text-[var(--boho-primary)]">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <span>Soporte</span>
          </div>
          <div className="mt-2">
            <div className="font-medium">Sistemas Lakalaka Creativa</div>
            <div>Cambios o requisitos personales</div>
            <div className="mt-1">
              WhatsApp: <a className="underline" href={`https://wa.me/52${supportPhone.replace(/\s+/g, "")}`} target="_blank" rel="noreferrer">{supportPhone}</a>
            </div>
            <div>
              Facebook: <a className="underline" href={`https://facebook.com${supportFacebook}`} target="_blank" rel="noreferrer">{supportFacebook}</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
