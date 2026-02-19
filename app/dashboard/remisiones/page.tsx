"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { generarPDFRemision } from "@/lib/pdf/remision";
import { useBranding } from "@/components/branding-provider";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { StickyNote } from "lucide-react";

type Remision = {
  id: string;
  folio: string;
  cliente: string;
  cliente_id?: string | null;
  telefono: string | null;
  direccion: string | null;
  fecha: string;
  total: number;
  anticipo: number;
  total_cost?: number | null;
  profit?: number | null;
  status: "ACTIVA" | "CANCELADA";
  delivered?: boolean | null;
  delivered_at?: string | null;
  payment_method?: string | null;
  created_at: string;
};

type ClienteNota = {
  id: string;
  cliente_id: string;
  nota: string;
  created_at: string;
};

export default function RemisionesPage() {
  const router = useRouter();
  const { branding } = useBranding();
  const [rows, setRows] = useState<Remision[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingPDFId, setGeneratingPDFId] = useState<string | null>(null);
  const [previewingPDFId, setPreviewingPDFId] = useState<string | null>(null);
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [deliveryFilter, setDeliveryFilter] = useState<
    "ALL" | "DELIVERED" | "PENDING"
  >("ALL");
  const [clientSearch, setClientSearch] = useState("");
  const [phoneSearch, setPhoneSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<"ALL" | "NONE" | "PARTIAL" | "PAID">("ALL");
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [clienteNombre, setClienteNombre] = useState("");
  const [clienteTelefono, setClienteTelefono] = useState("");
  const [clienteCorreo, setClienteCorreo] = useState("");
  const [clienteDireccion, setClienteDireccion] = useState("");
  const [clienteColonia, setClienteColonia] = useState("");
  const [clienteCiudad, setClienteCiudad] = useState("");
  const [clienteEstado, setClienteEstado] = useState("");
  const [clienteCodigoPostal, setClienteCodigoPostal] = useState("");
  const [clientePublicidadPagada, setClientePublicidadPagada] = useState(false);
  const [clienteCanal, setClienteCanal] = useState("");
  const [savingCliente, setSavingCliente] = useState(false);
  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const [notesLoading, setNotesLoading] = useState(false);
  const [notesItems, setNotesItems] = useState<ClienteNota[]>([]);
  const [notesClientName, setNotesClientName] = useState("");

  const monthOptions = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const yearOptions = Array.from({ length: 6 }, (_, idx) => new Date().getFullYear() - 3 + idx);

  const load = async () => {
    let query = supabase
      .from("remisiones")
      .select(
        "id, folio, cliente, cliente_id, telefono, direccion, fecha, total, total_cost, anticipo, status, profit, delivered, delivered_at, payment_method, created_at"
      )
      .order("created_at", { ascending: false });

    if (deliveryFilter === "DELIVERED") {
      query = query.eq("delivered", true);
    }

    if (deliveryFilter === "PENDING") {
      query = query.eq("delivered", false);
    }

    const { data } = await query;

    setRows(data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [deliveryFilter]);

  const cancelar = async (id: string) => {
    if (cancelingId === id) return;

    const ok = confirm("¿Cancelar esta remisión? Esta acción no se puede deshacer.");
    if (!ok) return;

    setCancelingId(id);
    try {
      await supabase
        .from("remisiones")
        .update({ status: "CANCELADA" })
        .eq("id", id);

      load();
    } finally {
      setCancelingId(null);
    }
  };

  const generarPDF = async (r: Remision, mode: "download" | "preview") => {
    const inProgress = mode === "preview" ? previewingPDFId === r.id : generatingPDFId === r.id;
    if (inProgress) return;

    if (mode === "preview") {
      setPreviewingPDFId(r.id);
    } else {
      setGeneratingPDFId(r.id);
    }
    
    const { data: items } = await supabase
      .from("remision_items")
      .select("product_name, price, quantity, subtotal")
      .eq("remision_id", r.id);

    if (!items || items.length === 0) {
      alert("Esta remisión no tiene productos");
      setGeneratingPDFId(null);
      setPreviewingPDFId(null);
      return;
    }

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
      web: "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='#6B7280'><path d='M12 2C6.49 2 2 6.49 2 12s4.49 10 10 10 10-4.49 10-10S17.51 2 12 2Zm6.93 9h-3.17a15.6 15.6 0 0 0-1.1-4.07 8.03 8.03 0 0 1 4.27 4.07ZM12 4.08c.9 1.24 1.62 2.92 2.06 4.92H9.94C10.38 7 11.1 5.32 12 4.08ZM4.8 15h3.32c.2 1.46.6 2.83 1.19 4.04A8.03 8.03 0 0 1 4.8 15Zm3.32-2H4.8a8.03 8.03 0 0 1 4.51-4.04A15.6 15.6 0 0 0 8.12 13Zm3.88 6.92c-.9-1.24-1.62-2.92-2.06-4.92h4.12c-.44 2-1.16 3.68-2.06 4.92ZM14.93 15h3.17a8.03 8.03 0 0 1-4.27 4.07c.48-1.29.84-2.66 1.1-4.07Zm-5-2h4.12c.08.64.13 1.31.13 2 0 .69-.05 1.36-.13 2h-4.12a15.3 15.3 0 0 1 0-4Zm5.93 2c0-.69-.05-1.36-.13-2h3.32a8.03 8.03 0 0 1 0 4h-3.32c.08-.64.13-1.31.13-2Z'/></svg>",
      otro: "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='#6B7280'><path d='M12 2a10 10 0 1 0 10 10A10.01 10.01 0 0 0 12 2Zm0 15a1.5 1.5 0 1 1 1.5-1.5A1.5 1.5 0 0 1 12 17Zm2-6.5a2 2 0 0 0-1.4 1.9V13h-1.2v-1.1a3.2 3.2 0 1 1 5.4-2.3A3.1 3.1 0 0 1 14 10.5Z'/></svg>",
    };

    const getSocialIconDataUrl = async (network: string) => {
      const svg = socialIconSvgMap[network];
      if (!svg) return "";
      return svgToPngDataUrl(svg, 24);
    };

    const logoDataUrl = await getLogoDataUrl(branding.logoUrl || "");
    const [social1IconDataUrl, social2IconDataUrl, social3IconDataUrl, social4IconDataUrl] = await Promise.all([
      getSocialIconDataUrl(branding.social1Network || ""),
      getSocialIconDataUrl(branding.social2Network || ""),
      getSocialIconDataUrl(branding.social3Network || ""),
      getSocialIconDataUrl(branding.social4Network || ""),
    ]);

    generarPDFRemision({
      folio: r.folio,
      date: new Date(r.fecha || r.created_at).toLocaleDateString("es-MX"),
      cliente: r.cliente,
      telefono: r.telefono,
      direccion: r.direccion,
      total: r.total,
      anticipo: r.anticipo || 0,
      status: r.status,
      delivered: r.delivered,
      paymentMethod: r.payment_method,
      items: (items || []).map(i => ({
        product_name: i.product_name,
        price: i.price,
        quantity: i.quantity,
        subtotal: i.subtotal,
      })),
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
    }, { mode });
    
    setTimeout(() => {
      setGeneratingPDFId(null);
      setPreviewingPDFId(null);
    }, 1000);
  };

  const getGoogleMapsUrl = () => {
    const parts = [
      clienteDireccion.trim(),
      clienteCiudad.trim(),
      clienteEstado.trim(),
      clienteCodigoPostal.trim(),
    ].filter(Boolean);

    const query = parts.join(", ");
    if (!query) return "";
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  };

  const getRowGoogleMapsUrl = (r: Remision) => {
    const query = (r.direccion || "").trim();
    if (!query) return "";
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  };

  const resetClienteForm = () => {
    setClienteNombre("");
    setClienteTelefono("");
    setClienteCorreo("");
    setClienteDireccion("");
    setClienteColonia("");
    setClienteCiudad("");
    setClienteEstado("");
    setClienteCodigoPostal("");
    setClientePublicidadPagada(false);
    setClienteCanal("");
  };

  const guardarCliente = async () => {
    if (!clienteNombre.trim()) return alert("El nombre del cliente es obligatorio");
    if (savingCliente) return;

    const canal = clienteCanal.trim() || (clientePublicidadPagada ? "Publicidad pagada" : "Organico");

    setSavingCliente(true);
    const { error } = await supabase.from("clientes").insert({
      nombre: clienteNombre.trim(),
      telefono: clienteTelefono.trim() || null,
      correo: clienteCorreo.trim() || null,
      direccion: clienteDireccion.trim() || null,
      colonia: clienteColonia.trim() || null,
      ciudad: clienteCiudad.trim() || null,
      estado: clienteEstado.trim() || null,
      codigo_postal: clienteCodigoPostal.trim() || null,
      canal,
    });

    if (error) {
      setSavingCliente(false);
      return alert("Error creando cliente: " + error.message);
    }

    setSavingCliente(false);
    setClientModalOpen(false);
    resetClienteForm();
  };

  const openNotesModal = async (r: Remision) => {
    if (!r.cliente_id) {
      alert("Esta remision no tiene cliente vinculado.");
      return;
    }

    setNotesClientName(r.cliente || "Cliente");
    setNotesModalOpen(true);
    setNotesLoading(true);

    const { data, error } = await supabase
      .from("cliente_notas")
      .select("id, cliente_id, nota, created_at")
      .eq("cliente_id", r.cliente_id)
      .order("created_at", { ascending: false });

    if (error) {
      alert("Error cargando notas: " + error.message);
      setNotesItems([]);
    } else {
      setNotesItems(data || []);
    }

    setNotesLoading(false);
  };

  if (loading) return <p>Cargando…</p>;

  const pendingCount = rows.filter(
    (r) => !r.delivered && r.status === "ACTIVA"
  ).length;

  const getPaymentStatus = (r: Remision): "NONE" | "PARTIAL" | "PAID" => {
    const totalNum = Number(r.total || 0);
    const anticipoNum = Number(r.anticipo || 0);
    if (anticipoNum >= totalNum && totalNum > 0) return "PAID";
    if (anticipoNum > 0 && anticipoNum < totalNum) return "PARTIAL";
    return "NONE";
  };

  const filteredRows = rows.filter((r) => {
    const matchesClient = (r.cliente || "").toLowerCase().includes(clientSearch.toLowerCase());
    const matchesPhone = (r.telefono || "").toLowerCase().includes(phoneSearch.toLowerCase());
    const dateKey = r.fecha || r.created_at || "";
    const matchesDate = dateFilter ? dateKey.startsWith(dateFilter) : true;
    const matchesMonth = monthFilter ? dateKey.slice(5, 7) === monthFilter : true;
    const matchesYear = yearFilter ? dateKey.slice(0, 4) === yearFilter : true;
    const paymentStatus = getPaymentStatus(r);
    const matchesPayment = paymentFilter === "ALL" || paymentStatus === paymentFilter;
    return matchesClient && matchesPhone && matchesDate && matchesMonth && matchesYear && matchesPayment;
  });

  const renderCobroIndicator = (r: Remision) => {
    const totalNum = Number(r.total || 0);
    const anticipoNum = Number(r.anticipo || 0);
    const isGreen = anticipoNum >= totalNum && totalNum > 0;
    const isYellow = anticipoNum > 0 && anticipoNum < totalNum;
    const colorClass = isGreen ? "bg-green-500" : isYellow ? "bg-yellow-400" : "bg-red-500";
    return <span className={`inline-block w-2 h-2 rounded-full ${colorClass}`} aria-hidden />;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Remisiones</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setClientModalOpen(true)}
            className="px-4 py-2 rounded border border-[var(--boho-primary)] text-[var(--boho-primary)] hover:bg-[var(--boho-primary)] hover:text-white"
          >
            + Nuevo cliente
          </button>
          <Link
            href="/dashboard/remisiones/nueva"
            className="px-4 py-2 rounded bg-[var(--boho-primary)] text-white"
          >
            + Nueva remisión
          </Link>
        </div>
      </div>

      <Sheet open={clientModalOpen} onOpenChange={setClientModalOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>Alta de cliente</SheetTitle>
          </SheetHeader>

          <div className="space-y-4 px-4 pb-6">
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-sm mb-1">Nombre del cliente</label>
                <input
                  value={clienteNombre}
                  onChange={(e) => setClienteNombre(e.target.value)}
                  placeholder="Nombre completo"
                  className="border p-2 rounded w-full"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm mb-1">Telefono</label>
                  <input
                    value={clienteTelefono}
                    onChange={(e) => setClienteTelefono(e.target.value)}
                    placeholder="Telefono"
                    className="border p-2 rounded w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Correo</label>
                  <input
                    type="email"
                    value={clienteCorreo}
                    onChange={(e) => setClienteCorreo(e.target.value)}
                    placeholder="correo@ejemplo.com"
                    className="border p-2 rounded w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm mb-1">Direccion</label>
                <input
                  value={clienteDireccion}
                  onChange={(e) => setClienteDireccion(e.target.value)}
                  placeholder="Direccion"
                  className="border p-2 rounded w-full"
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Colonia</label>
                <input
                  value={clienteColonia}
                  onChange={(e) => setClienteColonia(e.target.value)}
                  placeholder="Colonia"
                  className="border p-2 rounded w-full"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm mb-1">Ciudad</label>
                  <input
                    value={clienteCiudad}
                    onChange={(e) => setClienteCiudad(e.target.value)}
                    placeholder="Ciudad"
                    className="border p-2 rounded w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Estado</label>
                  <input
                    value={clienteEstado}
                    onChange={(e) => setClienteEstado(e.target.value)}
                    placeholder="Estado"
                    className="border p-2 rounded w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Codigo postal</label>
                  <input
                    value={clienteCodigoPostal}
                    onChange={(e) => setClienteCodigoPostal(e.target.value)}
                    placeholder="Opcional"
                    className="border p-2 rounded w-full"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm mb-1">Publicidad pagada</label>
                <div className="flex items-center gap-2">
                  <input
                    id="cliente-publicidad"
                    type="checkbox"
                    checked={clientePublicidadPagada}
                    onChange={(e) => setClientePublicidadPagada(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <label htmlFor="cliente-publicidad" className="text-sm">
                    Llego por publicidad pagada
                  </label>
                </div>
                <input
                  value={clienteCanal}
                  onChange={(e) => setClienteCanal(e.target.value)}
                  placeholder="Canal (Meta, Google, etc.)"
                  className="border p-2 rounded w-full"
                />
                <p className="text-xs text-gray-500">Si no indicas canal, se guardara como Organico o Publicidad pagada.</p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm mb-1">Ver en Google Maps</label>
                <a
                  href={getGoogleMapsUrl() || "#"}
                  target="_blank"
                  rel="noreferrer"
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded border ${
                    getGoogleMapsUrl()
                      ? "border-[var(--boho-primary)] text-[var(--boho-primary)] hover:bg-[var(--boho-primary)] hover:text-white"
                      : "border-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
                  onClick={(event) => {
                    if (!getGoogleMapsUrl()) event.preventDefault();
                  }}
                >
                  Ver en Google Maps
                </a>
                <p className="text-xs text-gray-500">
                  Se abrira con la direccion capturada.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setClientModalOpen(false);
                  resetClienteForm();
                }}
                className="px-4 py-2 rounded border"
              >
                Cancelar
              </button>
              <button
                onClick={guardarCliente}
                disabled={savingCliente}
                className="px-4 py-2 rounded bg-[var(--boho-primary)] text-white hover:opacity-90 disabled:opacity-50"
              >
                {savingCliente ? "Guardando…" : "Guardar cliente"}
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <div className="flex items-center gap-4 mb-4">
        <div className="flex flex-wrap gap-3 items-center w-full">
          <input
            type="text"
            placeholder="Buscar cliente..."
            value={clientSearch}
            onChange={(e) => setClientSearch(e.target.value)}
            className="px-3 py-2 border rounded w-full sm:w-56"
          />
          <input
            type="text"
            placeholder="Teléfono"
            value={phoneSearch}
            onChange={(e) => setPhoneSearch(e.target.value)}
            className="px-3 py-2 border rounded w-full sm:w-40"
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

          <span className="text-sm font-semibold text-gray-700 flex items-center gap-1">
            Pendientes:
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full ${
                pendingCount > 0
                  ? "bg-orange-100 text-orange-800"
                  : "bg-green-100 text-green-800"
              }`}
            >
              {pendingCount}
            </span>
          </span>

          <div className="flex gap-2">
            <button
              onClick={() => setDeliveryFilter("ALL")}
              className={`px-3 py-1 rounded ${
                deliveryFilter === "ALL"
                  ? "bg-[var(--boho-primary)] text-white"
                  : "border border-[var(--boho-primary)] text-[var(--boho-primary)] hover:bg-[var(--boho-primary)] hover:text-white"
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setDeliveryFilter("PENDING")}
              className={`px-3 py-1 rounded ${
                deliveryFilter === "PENDING"
                  ? "bg-[var(--boho-primary)] text-white"
                  : "border border-[var(--boho-primary)] text-[var(--boho-primary)] hover:bg-[var(--boho-primary)] hover:text-white"
              }`}
            >
              Pendientes
            </button>
            <button
              onClick={() => setDeliveryFilter("DELIVERED")}
              className={`px-3 py-1 rounded ${
                deliveryFilter === "DELIVERED"
                  ? "bg-[var(--boho-primary)] text-white"
                  : "border border-[var(--boho-primary)] text-[var(--boho-primary)] hover:bg-[var(--boho-primary)] hover:text-white"
              }`}
            >
              Entregadas
            </button>
          </div>

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value as any)}
            className="px-3 py-2 border rounded w-full sm:w-44"
            title="Estado de cobro"
          >
            <option value="ALL">Todos (cobro)</option>
            <option value="NONE">🔴 Sin cobro</option>
            <option value="PARTIAL">🟡 Anticipo parcial</option>
            <option value="PAID">🟢 Liquidada</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1100px] bg-white border">
          <thead>
            <tr className="border-b">
              <th className="p-2 text-left">Folio</th>
              <th className="p-2 text-left">Cliente</th>
              <th className="p-2 text-left">Teléfono</th>
              <th className="p-2 text-left">Dirección</th>
              <th className="p-2 text-center"></th>
              <th className="p-2">Fecha</th>
              <th className="p-2">Total</th>
              <th className="p-2">Anticipo</th>
              <th className="p-2">Restante</th>
              <th className="px-3 py-2 text-right">Ganancia</th>
              <th className="p-2">Estado</th>
              <th className="px-3 py-2 text-center">Entregado</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((r) => (
              <tr
                key={r.id}
                onClick={() => {
                  if (r.status === "ACTIVA") {
                    router.push(`/dashboard/remisiones/${r.id}/editar`);
                  }
                }}
                className={`border-b ${
                  r.status === "ACTIVA" ? "cursor-pointer hover:bg-gray-50" : "cursor-default"
                } ${r.status === "CANCELADA" ? "opacity-50 line-through" : ""}`}
              >
                <td className="p-2 font-medium flex items-center gap-2">
                  {renderCobroIndicator(r)}
                  <span>{r.folio}</span>
                </td>
                <td className="p-2">{r.cliente || "Venta mostrador"}</td>
                <td className="p-2 text-gray-600">{r.telefono || "—"}</td>
                <td className="p-2 text-gray-600 text-sm">{r.direccion || "—"}</td>
                <td className="p-2 text-center" onClick={(e) => e.stopPropagation()}>
                  <a
                    href={getRowGoogleMapsUrl(r) || "#"}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(event) => {
                      if (!getRowGoogleMapsUrl(r)) event.preventDefault();
                    }}
                    className={`inline-flex items-center justify-center w-9 h-9 rounded-md border text-sm transition-colors ${
                      getRowGoogleMapsUrl(r)
                        ? "border-[var(--boho-secondary)] text-[var(--boho-secondary)] hover:bg-[var(--boho-secondary)] hover:text-white"
                        : "border-gray-200 text-gray-300 cursor-not-allowed"
                    }`}
                    title="Ver en Google Maps"
                    aria-label="Ver en Google Maps"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 21s6-5.33 6-10a6 6 0 1 0-12 0c0 4.67 6 10 6 10Z" />
                      <circle cx="12" cy="11" r="2.5" />
                    </svg>
                  </a>
                </td>
                <td className="p-2">
                  {new Date(r.fecha || r.created_at).toLocaleDateString("es-MX")}
                </td>
                <td className="p-2">${r.total}</td>
                <td className="p-2">${r.anticipo || 0}</td>
                <td className="p-2 font-medium">${r.total - (r.anticipo || 0)}</td>
                <td className="px-3 py-2 text-right font-semibold text-green-700">
                  ${Number(r.total - (r.total_cost || 0)).toFixed(2)}
                </td>
                <td className="p-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      r.status === "ACTIVA"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {r.status}
                  </span>
                </td>
                <td className="px-3 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={async () => {
                      const delivered = !r.delivered;

                      const { error } = await supabase
                        .from("remisiones")
                        .update({
                          delivered,
                          delivered_at: delivered ? new Date().toISOString() : null,
                        })
                        .eq("id", r.id);

                      if (error) {
                        alert("Error actualizando entrega");
                        return;
                      }

                      load();
                    }}
                    className={`inline-flex items-center justify-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      r.delivered
                        ? "bg-[var(--boho-primary)] text-white"
                        : "border border-[var(--boho-primary)] text-[var(--boho-primary)] hover:bg-[var(--boho-primary)] hover:text-white"
                    }`}
                  >
                    {r.delivered ? "Entregado" : "Pendiente"}
                  </button>
                </td>
                <td className="p-2 text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => openNotesModal(r)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-[var(--boho-primary)] text-[var(--boho-primary)] text-sm font-medium hover:bg-[var(--boho-primary)] hover:text-white"
                      title="Notas de seguimiento"
                    >
                      <StickyNote className="h-4 w-4" />
                      Notas
                    </button>
                    {r.status === "ACTIVA" && (
                      <button
                        onClick={() => router.push(`/dashboard/remisiones/${r.id}/editar`)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-white text-sm font-medium bg-[var(--boho-primary)] hover:opacity-90"
                        title="Editar remisión"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Editar
                      </button>
                    )}
                    
                    <button
                      onClick={() => generarPDF(r, "download")}
                      disabled={generatingPDFId === r.id}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-[var(--boho-secondary)] text-white text-sm font-medium hover:opacity-90 transition-opacity ${generatingPDFId === r.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                      title="Descargar PDF"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      {generatingPDFId === r.id ? "Generando..." : "PDF"}
                    </button>

                    <button
                      onClick={() => generarPDF(r, "preview")}
                      disabled={previewingPDFId === r.id}
                      className={`inline-flex items-center justify-center px-3 py-1.5 rounded-md border border-[var(--boho-secondary)] text-[var(--boho-secondary)] text-sm font-medium hover:bg-[var(--boho-secondary)] hover:text-white transition-colors ${previewingPDFId === r.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                      title="Vista previa"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7Z" />
                        <circle cx="12" cy="12" r="3" strokeWidth={2} />
                      </svg>
                    </button>
                    
                    {r.status === "ACTIVA" && (
                      <button
                        onClick={() => cancelar(r.id)}
                        disabled={cancelingId === r.id}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-md border text-sm font-medium transition-colors border-[var(--boho-secondary)] text-[var(--boho-secondary)] ${
                          cancelingId === r.id
                            ? "opacity-60 cursor-not-allowed"
                            : "hover:bg-[var(--boho-secondary)] hover:text-white"
                        }`}
                        title="Cancelar remisión"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        {cancelingId === r.id ? "Cancelando..." : "Cancelar"}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {notesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl border bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Seguimiento</p>
                <h2 className="text-xl font-semibold text-[var(--boho-text)]">Notas de {notesClientName}</h2>
              </div>
              <button
                type="button"
                onClick={() => setNotesModalOpen(false)}
                className="px-3 py-2 rounded border border-gray-300 text-gray-600 hover:bg-gray-50"
              >
                Cerrar
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {notesLoading ? (
                <div className="rounded-lg border border-dashed p-4 text-sm text-gray-500">Cargando notas...</div>
              ) : notesItems.length === 0 ? (
                <div className="rounded-lg border border-dashed p-4 text-sm text-gray-500">No hay notas registradas.</div>
              ) : (
                notesItems.map((note) => (
                  <div key={note.id} className="rounded-lg border p-4">
                    <div className="text-xs text-gray-500">
                      {new Date(note.created_at).toLocaleString("es-MX")}
                    </div>
                    <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">{note.nota}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
