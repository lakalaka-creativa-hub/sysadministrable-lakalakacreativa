"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useBranding } from "@/components/branding-provider";
import { useAuth } from "@/lib/useAuth";

import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Package,
  BarChart3,
  ChevronLeft,
  User,
  Wallet,
  LineChart,
  ClipboardList,
  FileText,
  CalendarDays,
} from "lucide-react";

const menuItems = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard, permission: "dashboard" },
  { title: "Agenda", href: "/dashboard/agenda", icon: CalendarDays, permission: "dashboard" },
  { title: "Remisiones", href: "/dashboard/remisiones", icon: ShoppingCart, permission: "remisiones" },
  { title: "Cotizaciones", href: "/dashboard/cotizaciones", icon: FileText, permission: "cotizaciones" },
  { title: "Clientes", href: "/dashboard/clientes", icon: User, permission: "clientes" },
  { title: "Proveedores", href: "/dashboard/proveedores", icon: Users, permission: "inventario" },
  { title: "Productos", href: "/dashboard/productos", icon: Package, permission: "inventario" },
  { title: "Inventario", href: "/dashboard/inventario", icon: ClipboardList, permission: "inventario" },
  { title: "Gastos", href: "/dashboard/gastos", icon: Wallet, permission: "gastos" },
  { title: "Análisis", href: "/dashboard/analisis", icon: LineChart, permission: "analisis" },
  { title: "Reportes", href: "/dashboard/reportes", icon: BarChart3, permission: "reportes" },
];

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (value: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (value: boolean) => void;
}

export function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }: SidebarProps) {
  const pathname = usePathname();
  const { branding } = useBranding();
  const { permissions } = useAuth();
  const logoUrl = branding.logoUrl?.trim();
  const businessName = branding.businessName?.trim() || "";
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 1023px)");
    const update = () => {
      setIsMobile(media.matches);
      if (!media.matches && mobileOpen) {
        setMobileOpen(false);
      }
    };
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [mobileOpen, setMobileOpen]);

  const canView = (key: string) => {
    if (!permissions) return true;
    return Boolean(permissions[key]?.view);
  };

  return (
    <>
      {/* Overlay */}
      {mobileOpen && isMobile && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen overflow-hidden border-r transition-all duration-300",
          "bg-[var(--boho-bg)]",
          collapsed ? "w-16" : "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-center border-b px-4">
          {collapsed ? (
            logoUrl ? (
              <img
                src={logoUrl}
                alt={businessName}
                className="h-12 w-12 rounded-2xl object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black text-white">
                <User className="h-6 w-6" />
              </div>
            )
          ) : (
            <Link href="/" className="flex items-center gap-3">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={businessName}
                  className="h-14 w-14 rounded-2xl object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-black text-white">
                  <User className="h-7 w-7" />
                </div>
              )}
              {businessName ? (
                <span
                  className="text-lg font-semibold tracking-wide text-[var(--boho-text)]"
                  style={{
                    maxWidth: "140px",
                    overflow: "hidden",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                  }}
                >
                  {businessName}
                </span>
              ) : null}
            </Link>
          )}
        </div>

        {/* Collapse button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-20 z-50 hidden h-6 w-6 rounded-full border border-[var(--border)] bg-[var(--boho-card)] shadow lg:flex"
          onClick={() => setCollapsed(!collapsed)}
        >
          <ChevronLeft
            className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")}
          />
        </Button>

        {/* Navigation */}
        <nav className="space-y-1 p-4">
          {menuItems.filter((item) => canView(item.permission)).map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center rounded-lg transition-all duration-150 cursor-pointer select-none",
                  collapsed
                    ? "h-12 w-12 mx-auto justify-center"
                    : "gap-3 px-3 py-2",
                  active
                    ? "bg-[var(--boho-primary)/30] text-[var(--boho-primary)]"
                    : "text-[var(--boho-text)] hover:bg-[var(--boho-secondary)/30]",
                  "active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--boho-primary)]"
                )}
              >
                <Icon className={cn("h-5 w-5", collapsed && "h-6 w-6")} />
                {!collapsed && item.title}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}