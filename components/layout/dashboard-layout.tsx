"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/useAuth";
import { BrandingProvider } from "@/components/branding-provider";
import { usePathname, useRouter } from "next/navigation";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { loading, permissions } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (loading || !permissions) return;

    const required: Record<string, string> = {
      "/dashboard/agenda": "dashboard",
      "/dashboard/configuracion": "configuracion",
      "/dashboard/analisis": "analisis",
      "/dashboard/reportes": "reportes",
      "/dashboard/inventario": "inventario",
      "/dashboard/productos": "inventario",
      "/dashboard/proveedores": "inventario",
      "/dashboard/gastos": "gastos",
      "/dashboard/clientes": "clientes",
      "/dashboard/cotizaciones": "cotizaciones",
      "/dashboard/remisiones": "remisiones",
      "/dashboard": "dashboard",
    };

    const entry = Object.entries(required).find(([route]) => pathname.startsWith(route));
    if (!entry) return;
    const [, key] = entry;
    if (!permissions[key]?.view) {
      router.replace("/dashboard");
    }
  }, [loading, permissions, pathname, router]);

  if (loading) return null;

  return (
    <BrandingProvider>
      <div>
        <Sidebar
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
        />

        <div
          className={cn(
            "min-h-screen transition-all duration-300",
            collapsed ? "lg:ml-16" : "lg:ml-64"
          )}
        >
          <Topbar onToggle={() => setMobileOpen((open) => !open)} />
          <main className="bg-[var(--boho-bg)] min-h-screen p-6">
            {children}
          </main>
        </div>
      </div>
    </BrandingProvider>
  );
}
