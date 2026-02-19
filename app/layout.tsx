import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){
  try {
    var cached = localStorage.getItem("branding-theme");
    if (!cached) return;
    var t = JSON.parse(cached);
    var r = document.documentElement;
    r.style.setProperty("--boho-bg", t.appBg || "#f7f7f8");
    r.style.setProperty("--boho-card", t.appCard || "#ffffff");
    r.style.setProperty("--boho-primary", t.appPrimary || "#2563eb");
    r.style.setProperty("--boho-secondary", t.appSecondary || "#64748b");
    r.style.setProperty("--boho-text", t.appText || "#111827");
    r.style.setProperty("--background", t.appBg || "#f7f7f8");
    r.style.setProperty("--foreground", t.appText || "#111827");
    r.style.setProperty("--card", t.appCard || "#ffffff");
    r.style.setProperty("--card-foreground", t.appText || "#111827");
    r.style.setProperty("--primary", t.appPrimary || "#2563eb");
    r.style.setProperty("--primary-foreground", "#ffffff");
    r.style.setProperty("--secondary", t.appSecondary || "#64748b");
    r.style.setProperty("--secondary-foreground", "#ffffff");
    r.style.setProperty("--ring", t.appPrimary || "#2563eb");
    r.style.setProperty("--accent", t.appSecondary || "#64748b");
    r.style.setProperty("--accent-foreground", "#ffffff");
    r.style.setProperty("--muted", t.appBg || "#f7f7f8");
    r.style.setProperty("--muted-foreground", t.appText || "#111827");
    r.style.setProperty("--popover", t.appCard || "#ffffff");
    r.style.setProperty("--popover-foreground", t.appText || "#111827");
    r.style.setProperty("--input", t.appCard || "#ffffff");
    r.style.setProperty("--border", "color-mix(in srgb, var(--boho-text) 18%, transparent)");
  } catch (e) {}
})();`,
          }}
        />
      </head>
      <body className="bg-[var(--boho-bg)] text-[var(--boho-text)]">
        {children}
      </body>
    </html>
  );
}
