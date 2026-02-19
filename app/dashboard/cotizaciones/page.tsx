"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { generarPDFRemision } from "@/lib/pdf/remision";
import { useBranding } from "@/components/branding-provider";

type Cotizacion = {
  id: string;
  folio: string;
  cliente: string;
  cliente_id?: string | null;
  telefono: string | null;
  direccion: string | null;
  fecha: string;
  total: number;
  status: "ABIERTA" | "CANCELADA" | "CONVERTIDA";
  remision_id?: string | null;
  created_at: string;
};

type CotizacionItem = {
  product_id?: string | null;
  product_name: string;
  price: number;
  quantity: number;
  subtotal: number;
};

export default function CotizacionesPage() {
  const router = useRouter();
  const { branding } = useBranding();
  const [rows, setRows] = useState<Cotizacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientSearch, setClientSearch] = useState("");
  const [phoneSearch, setPhoneSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ABIERTA" | "CANCELADA" | "CONVERTIDA">("ALL");
  const [generatingPDFId, setGeneratingPDFId] = useState<string | null>(null);
  const [previewingPDFId, setPreviewingPDFId] = useState<string | null>(null);
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [cancelingId, setCancelingId] = useState<string | null>(null);

  const monthOptions = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const yearOptions = Array.from({ length: 6 }, (_, idx) => new Date().getFullYear() - 3 + idx);

  const load = async () => {
    let query = supabase
      .from("cotizaciones")
      .select("id, folio, cliente, cliente_id, telefono, direccion, fecha, total, status, remision_id, created_at")
      .order("created_at", { ascending: false });

    if (statusFilter !== "ALL") {
      query = query.eq("status", statusFilter);
    }

    const { data } = await query;
    setRows((data || []) as Cotizacion[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [statusFilter]);

  const getLogoDataUrl = async (value: string) => {
    if (!value) return "";
    if (value.startsWith("data:")) return value;
    try {
      const response = await fetch(value);
      const blob = await response.blob();
      return await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
        reader.onerror = () => resolve("");
        reader.readAsDataURL(blob);
      });
    } catch {
      return "";
    }
  };

  const svgToPngDataUrl = (svg: string, size = 24) => {
    return new Promise<string>((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve("");
          return;
        }
        ctx.clearRect(0, 0, size, size);
        ctx.drawImage(img, 0, 0, size, size);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = () => resolve("");
      img.src = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    });
  };

  const socialIconSvgMap: Record<string, string> = {
    whatsapp: "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='#25D366'><path d='M20.52 3.48A11.91 11.91 0 0 0 12.03 0C5.41 0 .04 5.36.03 11.98c0 2.1.55 4.15 1.6 5.96L0 24l6.22-1.63a11.9 11.9 0 0 0 5.8 1.48h.01c6.62 0 12-5.36 12-11.98 0-3.2-1.25-6.2-3.51-8.39Zm-8.5 18.49h-.01a9.9 9.9 0 0 1-5.06-1.4l-.36-.21-3.7.97.99-3.6-.23-.37a9.9 9.9 0 1 1 8.37 4.61Zm5.43-7.41c-.3-.15-1.77-.87-2.05-.97-.28-.1-.48-.15-.68.15-.2.3-.78.97-.95 1.17-.17.2-.35.22-.65.07-.3-.15-1.27-.47-2.42-1.5-.9-.8-1.5-1.79-1.67-2.09-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.68-1.64-.93-2.24-.25-.6-.5-.52-.68-.53h-.58c-.2 0-.52.07-.8.37-.27.3-1.05 1.03-1.05 2.5s1.07 2.9 1.22 3.1c.15.2 2.1 3.2 5.1 4.49.71.31 1.26.49 1.69.62.71.22 1.36.19 1.87.11.57-.08 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.08-.12-.28-.2-.58-.35Z'/></svg>",
    instagram: "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='#E1306C'><path d='M7 0h10a7 7 0 0 1 7 7v10a7 7 0 0 1-7 7H7a7 7 0 0 1-7-7V7a7 7 0 0 1 7-7Zm5 6.5A5.5 5.5 0 1 0 17.5 12 5.51 5.51 0 0 0 12 6.5Zm0 9A3.5 3.5 0 1 1 15.5 12 3.5 3.5 0 0 1 12 15.5ZM18.5 5a1.5 1.5 0 1 1-1.5 1.5A1.5 1.5 0 0 1 18.5 5Z'/></svg>",
    facebook: "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='#1877F2'><path d='M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.5h3.05V9.4c0-3.02 1.8-4.7 4.56-4.7 1.32 0 2.7.24 2.7.24v2.98h-1.52c-1.5 0-1.97.93-1.97 1.89v2.27h3.35l-.54 3.5h-2.81V24C19.61 23.1 24 18.1 24 12.07Z'/></svg>",
    tiktok: "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='#000000'><path d='M16.5 1c.48 3.06 2.66 5.23 5.73 5.72v3.4c-1.52.05-3.02-.33-4.3-1.08v7.2c0 4.07-3.3 7.38-7.38 7.38-4.08 0-7.38-3.3-7.38-7.38 0-4.08 3.3-7.38 7.38-7.38.44 0 .88.04 1.3.11v3.78a3.6 3.6 0 1 0 2.9 3.51V1h4.75Z'/></svg>",
    x: "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='#000000'><path d='M18.14 2H21l-6.56 7.5L22 22h-6.2l-4.86-6.35L5.3 22H2l7.02-8.02L2 2h6.36l4.4 5.78L18.14 2Zm-1.08 18h1.6L7.2 4H5.5l11.56 16Z'/></svg>",
    youtube: "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='#FF0000'><path d='M23.5 6.19a2.99 2.99 0 0 0-2.11-2.12C19.53 3.5 12 3.5 12 3.5s-7.53 0-9.39.57A2.99 2.99 0 0 0 .5 6.19C0 8.06 0 12 0 12s0 3.94.5 5.81a2.99 2.99 0 0 0 2.11 2.12c1.86.57 9.39.57 9.39.57s7.53 0 9.39-.57a2.99 2.99 0 0 0 2.11-2.12c.5-1.87.5-5.81.5-5.81s0-3.94-.5-5.81ZM9.6 15.5v-7l6.4 3.5-6.4 3.5Z'/></svg>",
    linkedin: "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='#0A66C2'><path d='M20.45 20.45h-3.55v-5.58c0-1.33-.03-3.05-1.86-3.05-1.86 0-2.15 1.45-2.15 2.95v5.68H9.34V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.59 0 4.25 2.36 4.25 5.43v6.31ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.12 20.45H3.56V9h3.56v11.45ZM22.23 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.46C23.2 24 24 23.23 24 22.28V1.72C24 .77 23.2 0 22.23 0Z'/></svg>",
    web: "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='#6B7280'><path d='M12 2C6.49 2 2 6.49 2 12s4.49 10 10 10 10-4.49 10-10S17.51 2 12 2Zm6.93 9h-3.17a15.6 15.6 0 0 0-1.1-4.07 8.03 8.03 0 0 1 4.27 4.07ZM12 4.08c.9 1.24 1.62 2.92 2.06 4.92H9.94C10.38 7 11.1 5.32 12 4.08ZM4.8 15h3.32c.2 1.46.6 2.83 1.19 4.04A8.03 8.03 0 0 1 4.8 15Zm3.32-2H4.8a8.03 8.03 0 0 1 4.51-4.04A15.6 15.6 0 0 0 8.12 13Zm3.88 6.92c-.9-1.24-1.62-2.92-2.06-4.92h4.12c-.44 2-1.16 3.68-2.06 4.92ZM14.93 15h3.17a8.03 8.03 0 0 1-4.27 4.07c.48-1.29.84-2.66 1.1-4.07Zm-5-2h4.12c.08.64.13 1.31.13 2 0 .69-.05 1.36-.13 2h-4.12a15.3 15.3 0 0 1 0-4Zm5.93 2c0-.69-.05-1.36-.13-2h3.32a8.03 8.03 0 0 1 0 4h-3.32c.08-.64.13-1.36.13-2Z'/></svg>",
    otro: "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='#6B7280'><path d='M12 2a10 10 0 1 0 10 10A10.01 10.01 0 0 0 12 2Zm0 15a1.5 1.5 0 1 1 1.5-1.5A1.5 1.5 0 0 1 12 17Zm2-6.5a2 2 0 0 0-1.4 1.9V13h-1.2v-1.1a3.2 3.2 0 1 1 5.4-2.3A3.1 3.1 0 0 1 14 10.5Z'/></svg>",
  };

  const getSocialIconDataUrl = async (network: string) => {
    const svg = socialIconSvgMap[network];
    if (!svg) return "";
    return svgToPngDataUrl(svg, 24);
  };

  const generarPDF = async (row: Cotizacion, mode: "download" | "preview") => {
    const inProgress = mode === "preview" ? previewingPDFId === row.id : generatingPDFId === row.id;
    if (inProgress) return;

    if (mode === "preview") {
      setPreviewingPDFId(row.id);
    } else {
      setGeneratingPDFId(row.id);
    }

    const { data: items } = await supabase
      .from("cotizacion_items")
      .select("product_name, price, quantity, subtotal")
      .eq("cotizacion_id", row.id);

    if (!items || items.length === 0) {
      alert("Esta cotizacion no tiene productos");
      setGeneratingPDFId(null);
      setPreviewingPDFId(null);
      return;
    }

    const logoDataUrl = await getLogoDataUrl(branding.logoUrl || "");
    const [social1IconDataUrl, social2IconDataUrl, social3IconDataUrl, social4IconDataUrl] = await Promise.all([
      getSocialIconDataUrl(branding.social1Network || ""),
      getSocialIconDataUrl(branding.social2Network || ""),
      getSocialIconDataUrl(branding.social3Network || ""),
      getSocialIconDataUrl(branding.social4Network || ""),
    ]);

    generarPDFRemision(
      {
        folio: row.folio,
        date: new Date(row.fecha || row.created_at).toLocaleDateString("es-MX"),
        cliente: row.cliente,
        telefono: row.telefono,
        direccion: row.direccion,
        total: row.total,
        anticipo: 0,
        status: row.status,
        items: (items || []).map((i) => ({
          product_name: i.product_name,
          price: i.price,
          quantity: i.quantity,
          subtotal: i.subtotal,
        })),
        noteTitle: "COTIZACION",
        showDeliveryPayment: false,
        branding: {
          businessName: branding.businessName,
          logoDataUrl,
          contactPhone: branding.contactPhone,
          contactEmail: branding.contactEmail,
          contactWeb: branding.contactWeb,
          contactAddress: branding.contactAddress,
          footerThanks: branding.footerThanks,
          footerInfo: branding.footerInfo,
          footerClosing: branding.footerClosing,
          terms: branding.terms,
          social1Network: branding.social1Network,
          social1Value: branding.social1Value,
          social2Network: branding.social2Network,
          social2Value: branding.social2Value,
          social3Network: branding.social3Network,
          social3Value: branding.social3Value,
          social4Network: branding.social4Network,
          social4Value: branding.social4Value,
          social1IconDataUrl,
          social2IconDataUrl,
          social3IconDataUrl,
          social4IconDataUrl,
          primaryColor: branding.pdfPrimary,
          primaryDarkColor: branding.pdfPrimaryDark,
          accentColor: branding.pdfAccent,
          softColor: branding.pdfSoft,
          textColor: branding.pdfText,
          textLightColor: branding.pdfTextLight,
          borderColor: branding.pdfBorder,
        },
      },
      { mode }
    );

    setTimeout(() => {
      setGeneratingPDFId(null);
      setPreviewingPDFId(null);
    }, 800);
  };

  const cancelar = async (row: Cotizacion) => {
    if (row.status === "CANCELADA") return;
    if (!confirm("¿Cancelar esta cotizacion?")) return;
    setCancelingId(row.id);
    await supabase.from("cotizaciones").update({ status: "CANCELADA" }).eq("id", row.id);
    setCancelingId(null);
    load();
  };

  const convertir = async (row: Cotizacion) => {
    if (row.status !== "ABIERTA") return;
    if (!confirm("¿Convertir esta cotizacion a remision?")) return;
    setConvertingId(row.id);

    const { data: items } = await supabase
      .from("cotizacion_items")
      .select("product_id, product_name, price, quantity, subtotal")
      .eq("cotizacion_id", row.id);

    const cotItems = (items || []) as CotizacionItem[];
    if (!cotItems.length) {
      alert("La cotizacion no tiene productos.");
      setConvertingId(null);
      return;
    }

    const { count } = await supabase
      .from("remisiones")
      .select("*", { count: "exact", head: true });

    const next = (count ?? 0) + 1;
    const folio = `A${String(next).padStart(3, "0")}`;

    let totalCost = 0;
    for (const item of cotItems) {
      if (!item.product_id) continue;
      const { data, error } = await supabase.rpc("get_product_cost", {
        p_product_id: item.product_id,
      });
      if (error) continue;
      const unitCost = Number(data ?? 0);
      totalCost += unitCost * Number(item.quantity || 0);
    }

    const now = new Date();
    const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 10);

    const { data: remision, error: remError } = await supabase
      .from("remisiones")
      .insert({
        folio,
        cliente: row.cliente,
        cliente_id: row.cliente_id || null,
        telefono: row.telefono || null,
        direccion: row.direccion || null,
        fecha: localDate,
        total: row.total,
        total_cost: totalCost,
        anticipo: 0,
        payment_method: null,
        status: "ACTIVA",
      })
      .select()
      .single();

    if (remError || !remision) {
      alert("Error creando la remision: " + remError?.message);
      setConvertingId(null);
      return;
    }

    const rows = cotItems.map((item) => ({
      remision_id: remision.id,
      product_id: item.product_id ?? null,
      product_name: item.product_name,
      price: item.price,
      quantity: item.quantity,
      subtotal: item.subtotal,
    }));

    const { error: itemsError } = await supabase.from("remision_items").insert(rows);
    if (itemsError) {
      alert("Error guardando productos: " + itemsError.message);
      setConvertingId(null);
      return;
    }

    await supabase
      .from("cotizaciones")
      .update({ status: "CONVERTIDA", remision_id: remision.id })
      .eq("id", row.id);

    setConvertingId(null);
    load();
    router.push(`/dashboard/remisiones/${remision.id}/editar`);
  };

  const filteredRows = rows.filter((r) => {
    const matchesClient = (r.cliente || "").toLowerCase().includes(clientSearch.toLowerCase());
    const matchesPhone = (r.telefono || "").toLowerCase().includes(phoneSearch.toLowerCase());
    const dateKey = r.fecha || r.created_at || "";
    const matchesDate = dateFilter ? dateKey.startsWith(dateFilter) : true;
    const matchesMonth = monthFilter ? dateKey.slice(5, 7) === monthFilter : true;
    const matchesYear = yearFilter ? dateKey.slice(0, 4) === yearFilter : true;
    return matchesClient && matchesPhone && matchesDate && matchesMonth && matchesYear;
  });

  if (loading) return <div>Cargando...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Cotizaciones</h1>
          <p className="text-sm text-gray-600">No cuentan como ventas ni consumen folio de remision.</p>
        </div>
        <button
          onClick={() => router.push("/dashboard/cotizaciones/nueva")}
          className="px-4 py-2 rounded bg-[var(--boho-primary)] text-white hover:opacity-90"
        >
          + Nueva cotizacion
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          value={clientSearch}
          onChange={(e) => setClientSearch(e.target.value)}
          placeholder="Buscar cliente"
          className="px-3 py-2 border rounded w-full sm:w-56"
        />
        <input
          value={phoneSearch}
          onChange={(e) => setPhoneSearch(e.target.value)}
          placeholder="Telefono"
          className="px-3 py-2 border rounded w-full sm:w-44"
        />
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="px-3 py-2 border rounded w-full sm:w-44"
        />
        <select
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
          className="px-3 py-2 border rounded w-full sm:w-32"
        >
          <option value="">Mes</option>
          {monthOptions.map((label, idx) => (
            <option key={label} value={String(idx + 1).padStart(2, "0")}>
              {label}
            </option>
          ))}
        </select>
        <select
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value)}
          className="px-3 py-2 border rounded w-full sm:w-32"
        >
          <option value="">Año</option>
          {yearOptions.map((year) => (
            <option key={year} value={String(year)}>
              {year}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="px-3 py-2 border rounded w-full sm:w-40"
        >
          <option value="ALL">Todos</option>
          <option value="ABIERTA">Abierta</option>
          <option value="CONVERTIDA">Convertida</option>
          <option value="CANCELADA">Cancelada</option>
        </select>
      </div>

      <div className="bg-white border rounded">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="text-left">
              <th className="p-3">Folio</th>
              <th className="p-3">Cliente</th>
              <th className="p-3">Fecha</th>
              <th className="p-3 text-right">Total</th>
              <th className="p-3 text-center">Status</th>
              <th className="p-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-4 text-center text-gray-500">
                  Sin cotizaciones.
                </td>
              </tr>
            ) : (
              filteredRows.map((row) => {
                const isProcessing = convertingId === row.id || cancelingId === row.id;
                return (
                  <tr key={row.id} className="border-t">
                    <td className="p-3 font-medium">{row.folio}</td>
                    <td className="p-3">{row.cliente}</td>
                    <td className="p-3">{new Date(row.fecha || row.created_at).toLocaleDateString("es-MX")}</td>
                    <td className="p-3 text-right">${Number(row.total || 0).toFixed(2)}</td>
                    <td className="p-3 text-center">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                          row.status === "ABIERTA"
                            ? "bg-green-100 text-green-700"
                            : row.status === "CONVERTIDA"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap justify-end gap-2">
                        <button
                          onClick={() => router.push(`/dashboard/cotizaciones/${row.id}/editar`)}
                          className="px-3 py-1.5 rounded border border-[var(--boho-primary)] text-[var(--boho-primary)] hover:bg-[var(--boho-primary)] hover:text-white"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => generarPDF(row, "preview")}
                          disabled={previewingPDFId === row.id}
                          className="px-3 py-1.5 rounded border border-[var(--boho-secondary)] text-[var(--boho-secondary)] hover:bg-[var(--boho-secondary)] hover:text-white disabled:opacity-50"
                        >
                          PDF
                        </button>
                        <button
                          onClick={() => convertir(row)}
                          disabled={row.status !== "ABIERTA" || isProcessing}
                          className="px-3 py-1.5 rounded bg-[var(--boho-primary)] text-white hover:opacity-90 disabled:opacity-50"
                        >
                          {convertingId === row.id ? "Convirtiendo..." : "Convertir"}
                        </button>
                        <button
                          onClick={() => cancelar(row)}
                          disabled={row.status !== "ABIERTA" || isProcessing}
                          className="px-3 py-1.5 rounded border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          {cancelingId === row.id ? "Cancelando..." : "Cancelar"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
