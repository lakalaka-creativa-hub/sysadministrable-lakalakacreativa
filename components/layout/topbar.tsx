"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Menu, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBranding } from "@/components/branding-provider";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/useAuth";

export function Topbar({ onToggle }: { onToggle: () => void }) {
  const [time, setTime] = useState(new Date());
  const router = useRouter();
  const { branding } = useBranding();
  const { permissions } = useAuth();

  const accessButtons = [
    { label: branding.access1Label, url: branding.access1Url },
    { label: branding.access2Label, url: branding.access2Url },
    { label: branding.access3Label, url: branding.access3Url },
    { label: branding.access4Label, url: branding.access4Url },
    { label: branding.access5Label, url: branding.access5Url },
  ].filter((item) => item.label?.trim() && item.url?.trim());


  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const dateString = time.toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const shortDateString = time.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });

  const timeString = time.toLocaleTimeString("es-MX");

  return (
    <header className="flex h-14 items-center justify-between border-b bg-[var(--boho-card)] px-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>
        {accessButtons.length > 0 ? (
          <div className="hidden items-center gap-2 md:flex">
            {accessButtons.map((item) => {
              const url = item.url.trim();
              const isExternal = /^https?:\/\//i.test(url);
              return (
                <Button
                  key={`${item.label}-${item.url}`}
                  variant="ghost"
                  asChild
                  className="h-8 rounded-md border border-[var(--boho-secondary)] bg-white px-3 text-xs font-semibold text-[var(--boho-secondary)] shadow-sm hover:bg-[var(--boho-secondary)] hover:text-white"
                >
                  <a
                    href={url}
                    title={item.label}
                    target={isExternal ? "_blank" : undefined}
                    rel={isExternal ? "noreferrer" : undefined}
                  >
                    <span className="max-w-[140px] truncate">{item.label}</span>
                  </a>
                </Button>
              );
            })}
          </div>
        ) : null}
      </div>

      <div className="flex items-center gap-6 text-sm text-[var(--boho-text)]">
        <span className="capitalize hidden md:inline">{dateString}</span>
        <span className="capitalize md:hidden">{shortDateString}</span>
        <span className="font-mono">{timeString}</span>

        {permissions?.configuracion?.view ? (
          <Button
            variant="ghost"
            size="icon"
            asChild
          >
            <Link href="/dashboard/configuracion" title="Configuración" aria-label="Configuración">
              <Settings className="h-5 w-5" />
            </Link>
          </Button>
        ) : null}

        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          title="Cerrar sesión"
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
