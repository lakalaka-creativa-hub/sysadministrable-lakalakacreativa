"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { generarPDFRemision } from "@/lib/pdf/remision";
import { useBranding } from "@/components/branding-provider";

type Cliente = {
  id: string;
  nombre: string;
  telefono: string | null;
  correo: string | null;
  direccion: string | null;
  colonia: string | null;
  ciudad: string | null;
  estado: string | null;
  codigo_postal: string | null;
  canal: string | null;
  created_at: string;
};

type Remision = {
  id: string;
  folio: string;
  cliente: string | null;
  telefono: string | null;
  direccion?: string | null;
  fecha: string | null;
  total: number | null;
  anticipo: number | null;
  total_cost?: number | null;
  profit?: number | null;
  status: "ACTIVA" | "CANCELADA";
  delivered?: boolean | null;
  payment_method?: string | null;
  created_at: string;
};

type ClienteNota = {
  id: string;
  cliente_id: string;
  nota: string;
  created_at: string;
};

const formatAddress = (client: Cliente) => {
  const parts = [
    client.direccion,
    client.colonia,
    client.ciudad,
    client.estado,
  ].filter(Boolean);

  if (client.codigo_postal) {
    parts.push(`CP ${client.codigo_postal}`);
  }

  return parts.join(", ") || "—";
};

const formatWhatsAppPhone = (value: string | null) => {
  if (!value) return "";
  return value.replace(/\D+/g, "");
};

const getGoogleMapsUrl = (client: Cliente | null) => {
  if (!client) return "";
  const parts = [
    client.direccion,
    client.colonia,
    client.ciudad,
    client.estado,
    client.codigo_postal ? `CP ${client.codigo_postal}` : null,
  ].filter(Boolean);

  const query = parts.join(", ");
  if (!query) return "";
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
};

const parseMoney = (value: unknown) => {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  const raw = String(value).trim();
  if (!raw) return 0;

  let normalized = raw.replace(/[^0-9,.-]/g, "");
  const hasComma = normalized.includes(",");
  const hasDot = normalized.includes(".");

  if (hasComma && hasDot) {
    normalized = normalized.replace(/,/g, "");
  } else if (hasComma && !hasDot) {
    normalized = normalized.replace(/,/g, ".");
  }

  const parsed = Number(normalized);
  return Number.isNaN(parsed) ? 0 : parsed;
};

export default function ClientesPage() {
  const { branding } = useBranding();
  const [clients, setClients] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [remisiones, setRemisiones] = useState<Remision[]>([]);
  const [notas, setNotas] = useState<ClienteNota[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [notaTexto, setNotaTexto] = useState("");
  const [savingNota, setSavingNota] = useState(false);
  const [previewingPDFId, setPreviewingPDFId] = useState<string | null>(null);
  const [editingClient, setEditingClient] = useState(false);
  const [savingClient, setSavingClient] = useState(false);
  const [editNombre, setEditNombre] = useState("");
  const [editTelefono, setEditTelefono] = useState("");
  const [editDireccion, setEditDireccion] = useState("");
  const [editColonia, setEditColonia] = useState("");
  const [editCiudad, setEditCiudad] = useState("");
  const [editEstado, setEditEstado] = useState("");
  const [editCodigoPostal, setEditCodigoPostal] = useState("");

  const selectedClient = useMemo(
    () => clients.find((c) => c.id === selectedId) || null,
    [clients, selectedId]
  );

  const filteredClients = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return clients;
    return clients.filter((c) => {
      const nameMatch = c.nombre.toLowerCase().includes(term);
      const phoneMatch = (c.telefono || "").toLowerCase().includes(term);
      const emailMatch = (c.correo || "").toLowerCase().includes(term);
      return nameMatch || phoneMatch || emailMatch;
    });
  }, [clients, search]);

  const loadClients = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("clientes")
      .select("id, nombre, telefono, correo, direccion, colonia, ciudad, estado, codigo_postal, canal, created_at")
      .order("created_at", { ascending: false });

    setClients(data || []);
    setLoading(false);
  };

  const loadClientDetail = async (client: Cliente) => {
    setLoadingDetail(true);

    const remisionQuery = supabase
      .from("remisiones")
      .select("id, folio, cliente, telefono, direccion, fecha, total, anticipo, total_cost, profit, status, delivered, payment_method, created_at")
      .eq("cliente_id", client.id)
      .order("created_at", { ascending: false });

    const notasQuery = supabase
      .from("cliente_notas")
      .select("id, cliente_id, nota, created_at")
      .eq("cliente_id", client.id)
      .order("created_at", { ascending: false });

    const [{ data: remisionData }, { data: notasData }] = await Promise.all([
      remisionQuery,
      notasQuery,
    ]);

    setRemisiones(remisionData || []);
    setNotas(notasData || []);
    setLoadingDetail(false);
  };

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

  const previewRemisionPDF = async (r: Remision) => {
    if (previewingPDFId === r.id) return;
    setPreviewingPDFId(r.id);

    try {
      const { data: items } = await supabase
        .from("remision_items")
        .select("product_name, price, quantity, subtotal")
        .eq("remision_id", r.id);

      if (!items || items.length === 0) {
        alert("Esta remisión no tiene productos");
        return;
      }

      const logoDataUrl = await getLogoDataUrl(branding.logoUrl || "");

      generarPDFRemision(
        {
          folio: r.folio,
          date: new Date(r.fecha || r.created_at).toLocaleDateString("es-MX"),
          cliente: r.cliente,
          telefono: r.telefono,
          direccion: r.direccion || null,
          total: Number(r.total || 0),
          anticipo: Number(r.anticipo || 0),
          status: r.status,
          delivered: r.delivered,
          paymentMethod: r.payment_method,
          items: (items || []).map((i) => ({
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
            primaryColor: branding.pdfPrimary,
            primaryDarkColor: branding.pdfPrimaryDark,
            accentColor: branding.pdfAccent,
            softColor: branding.pdfSoft,
            textColor: branding.pdfText,
            textLightColor: branding.pdfTextLight,
            borderColor: branding.pdfBorder,
          },
        },
        { mode: "preview" }
      );
    } finally {
      setTimeout(() => setPreviewingPDFId(null), 800);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    if (!selectedClient) return;
    loadClientDetail(selectedClient);
    setEditingClient(false);
    setEditNombre(selectedClient.nombre || "");
    setEditTelefono(selectedClient.telefono || "");
    setEditDireccion(selectedClient.direccion || "");
    setEditColonia(selectedClient.colonia || "");
    setEditCiudad(selectedClient.ciudad || "");
    setEditEstado(selectedClient.estado || "");
    setEditCodigoPostal(selectedClient.codigo_postal || "");
  }, [selectedClient?.id]);

  const handleSelectClient = (client: Cliente) => {
    setSelectedId(client.id);
    setNotaTexto("");
  };

  const handleAddNota = async () => {
    if (!selectedClient) return;
    if (!notaTexto.trim()) return;
    if (savingNota) return;

    setSavingNota(true);
    const { error } = await supabase.from("cliente_notas").insert({
      cliente_id: selectedClient.id,
      nota: notaTexto.trim(),
    });

    setSavingNota(false);
    if (error) {
      alert("Error guardando nota: " + error.message);
      return;
    }

    setNotaTexto("");
    loadClientDetail(selectedClient);
  };

  const handleSaveClient = async () => {
    if (!selectedClient || savingClient) return;
    setSavingClient(true);

    const payload = {
      nombre: editNombre.trim() || selectedClient.nombre,
      telefono: editTelefono.trim() || null,
      direccion: editDireccion.trim() || null,
      colonia: editColonia.trim() || null,
      ciudad: editCiudad.trim() || null,
      estado: editEstado.trim() || null,
      codigo_postal: editCodigoPostal.trim() || null,
    };

    const { error } = await supabase
      .from("clientes")
      .update(payload)
      .eq("id", selectedClient.id);

    setSavingClient(false);
    if (error) {
      alert("Error guardando cliente: " + error.message);
      return;
    }

    setClients((prev) =>
      prev.map((c) => (c.id === selectedClient.id ? { ...c, ...payload } : c))
    );
    setEditingClient(false);
  };

  const lastRemisionDate = remisiones[0]?.fecha || remisiones[0]?.created_at || "";
  const lastRemisionDateLabel = lastRemisionDate
    ? new Date(lastRemisionDate).toLocaleDateString("es-MX")
    : "";

  const activeRemisiones = remisiones.filter((r) => r.status !== "CANCELADA");
  const totalComprado = activeRemisiones.reduce(
    (sum, r) => sum + parseMoney(r.total),
    0
  );
  const totalGanancia = activeRemisiones.reduce((sum, r) => {
    const totalValue = parseMoney(r.total);
    const anticipoValue = parseMoney(r.anticipo);
    if (!totalValue || !anticipoValue) return sum;

    const profitValue = parseMoney(r.profit);
    const costValue = parseMoney(r.total_cost);
    const baseProfit = profitValue || (totalValue - costValue);
    const ratio = Math.min(1, anticipoValue / totalValue);
    return sum + baseProfit * ratio;
  }, 0);

  const whatsappMessage = selectedClient
    ? `Buenas tardes ${selectedClient.nombre}, es un gusto saludarte. Como te sentiste con nuestros productos${lastRemisionDateLabel ? `, el dia ${lastRemisionDateLabel} compraste y desde entonces no sabemos nada de ti.` : "?"}`
    : "";

  const whatsappPhone = formatWhatsAppPhone(selectedClient?.telefono || null);
  const whatsappUrl = whatsappPhone
    ? `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(whatsappMessage)}`
    : "";
  const mapsUrl = getGoogleMapsUrl(selectedClient);


  if (loading) return <p>Cargando…</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Clientes</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        <div className="space-y-3">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar cliente..."
            className="w-full border rounded px-3 py-2"
          />

          <div className="border rounded bg-white max-h-[70vh] overflow-auto">
            {filteredClients.length === 0 && (
              <div className="p-4 text-sm text-gray-500">No hay clientes</div>
            )}
            {filteredClients.map((client) => (
              <button
                key={client.id}
                type="button"
                onClick={() => handleSelectClient(client)}
                className={`w-full text-left px-3 py-3 border-b last:border-b-0 hover:bg-gray-50 ${
                  client.id === selectedId ? "bg-gray-50" : ""
                }`}
              >
                <div className="font-medium text-sm text-gray-900">{client.nombre}</div>
                <div className="text-xs text-gray-500">{client.telefono || "Sin telefono"}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          {!selectedClient ? (
            <div className="border rounded bg-white p-6 text-sm text-gray-500">
              Selecciona un cliente para ver su informacion.
            </div>
          ) : (
            <>
              <div className="border rounded bg-white p-6 space-y-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">{selectedClient.nombre}</h2>
                    <p className="text-sm text-gray-600">{formatAddress(selectedClient)}</p>
                    <p className="text-sm text-gray-600">{selectedClient.correo || "Sin correo"}</p>
                    <p className="text-sm text-gray-600">{selectedClient.telefono || "Sin telefono"}</p>
                    <p className="text-xs text-gray-500">Canal: {selectedClient.canal || "—"}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <a
                      href={whatsappUrl || "#"}
                      target="_blank"
                      rel="noreferrer"
                      className={`px-3 py-2 rounded border ${
                        whatsappUrl
                          ? "border-[var(--boho-primary)] text-[var(--boho-primary)] hover:bg-[var(--boho-primary)] hover:text-white"
                          : "border-gray-200 text-gray-400 cursor-not-allowed"
                      }`}
                      onClick={(event) => {
                        if (!whatsappUrl) event.preventDefault();
                      }}
                    >
                      Enviar WhatsApp
                    </a>
                    <a
                      href={mapsUrl || "#"}
                      target="_blank"
                      rel="noreferrer"
                      className={`px-3 py-2 rounded border ${
                        mapsUrl
                          ? "border-[var(--boho-secondary)] text-[var(--boho-secondary)] hover:bg-[var(--boho-secondary)] hover:text-white"
                          : "border-gray-200 text-gray-400 cursor-not-allowed"
                      }`}
                      onClick={(event) => {
                        if (!mapsUrl) event.preventDefault();
                      }}
                    >
                      Ubicacion
                    </a>
                    <button
                      type="button"
                      onClick={() => setEditingClient((prev) => !prev)}
                      className="px-3 py-2 rounded border border-[var(--boho-primary)] text-[var(--boho-primary)] hover:bg-[var(--boho-primary)] hover:text-white"
                    >
                      {editingClient ? "Cerrar" : "Editar"}
                    </button>
                  </div>
                </div>
                {editingClient ? (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500">Nombre</label>
                      <input
                        value={editNombre}
                        onChange={(e) => setEditNombre(e.target.value)}
                        className="w-full border rounded px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500">Telefono</label>
                      <input
                        value={editTelefono}
                        onChange={(e) => setEditTelefono(e.target.value)}
                        className="w-full border rounded px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500">Direccion</label>
                      <input
                        value={editDireccion}
                        onChange={(e) => setEditDireccion(e.target.value)}
                        className="w-full border rounded px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500">Colonia</label>
                      <input
                        value={editColonia}
                        onChange={(e) => setEditColonia(e.target.value)}
                        className="w-full border rounded px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500">Ciudad</label>
                      <input
                        value={editCiudad}
                        onChange={(e) => setEditCiudad(e.target.value)}
                        className="w-full border rounded px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500">Estado</label>
                      <input
                        value={editEstado}
                        onChange={(e) => setEditEstado(e.target.value)}
                        className="w-full border rounded px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500">Codigo postal</label>
                      <input
                        value={editCodigoPostal}
                        onChange={(e) => setEditCodigoPostal(e.target.value)}
                        className="w-full border rounded px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="md:col-span-2 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingClient(false)}
                        className="px-3 py-2 rounded border border-gray-300 text-gray-600 hover:bg-gray-50"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveClient}
                        disabled={savingClient}
                        className="px-3 py-2 rounded bg-[var(--boho-primary)] text-white hover:opacity-90 disabled:opacity-50"
                      >
                        {savingClient ? "Guardando..." : "Guardar"}
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="border rounded bg-white p-4 space-y-3">
                  <h3 className="font-semibold">Historial de remisiones</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="rounded border bg-gray-50 p-3">
                      <div className="text-xs text-gray-500">Total comprado</div>
                      <div className="text-lg font-semibold">${totalComprado.toFixed(2)}</div>
                    </div>
                    <div className="rounded border bg-gray-50 p-3">
                      <div className="text-xs text-gray-500">Ganancia cobrada</div>
                      <div className="text-lg font-semibold text-green-700">
                        ${totalGanancia.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  {loadingDetail ? (
                    <p className="text-sm text-gray-500">Cargando...</p>
                  ) : remisiones.length === 0 ? (
                    <p className="text-sm text-gray-500">Sin remisiones registradas.</p>
                  ) : (
                    <div className="space-y-2">
                      {remisiones.map((r) => {
                        const totalValue = Number(r.total || 0);
                        const costValue = Number(r.total_cost || 0);
                        const profitValue = Number(r.profit || 0) || totalValue - costValue;

                        return (
                          <div key={r.id} className="flex items-center justify-between text-sm border-b pb-2">
                            <div className="flex flex-wrap items-center gap-3">
                              <div className="text-sm font-medium text-gray-900">Folio {r.folio}</div>
                              <div className="text-xs text-gray-500">
                                {new Date(r.fecha || r.created_at).toLocaleDateString("es-MX")}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-sm font-medium text-gray-900">${totalValue.toFixed(2)}</div>
                              <div className="text-xs font-medium text-[var(--boho-primary)]">
                                ${profitValue.toFixed(2)}
                              </div>
                              <div
                                className={`text-xs font-medium ${
                                  r.status === "CANCELADA" ? "text-red-600" : "text-[var(--boho-secondary)]"
                                }`}
                              >
                                {r.status}
                              </div>
                              <div
                                className={`text-xs font-medium ${
                                  r.delivered ? "text-[var(--boho-primary)]" : "text-red-600"
                                }`}
                              >
                                {r.delivered ? "Entregado" : "Pendiente"}
                              </div>
                              <button
                                type="button"
                                onClick={() => previewRemisionPDF(r)}
                                disabled={previewingPDFId === r.id}
                                className="inline-flex h-8 w-8 items-center justify-center rounded border border-[var(--boho-secondary)] text-[var(--boho-secondary)] hover:bg-[var(--boho-secondary)] hover:text-white disabled:opacity-50"
                                title="Ver PDF"
                              >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7Z" />
                                  <circle cx="12" cy="12" r="3" strokeWidth={2} />
                                </svg>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="border rounded bg-white p-4 space-y-3">
                  <h3 className="font-semibold">Seguimiento</h3>
                  <textarea
                    value={notaTexto}
                    onChange={(e) => setNotaTexto(e.target.value)}
                    placeholder="Escribe una nota de seguimiento..."
                    className="w-full min-h-[120px] border rounded p-2"
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={handleAddNota}
                      disabled={savingNota}
                      className="px-4 py-2 rounded bg-[var(--boho-primary)] text-white hover:opacity-90 disabled:opacity-50"
                    >
                      {savingNota ? "Guardando..." : "Guardar nota"}
                    </button>
                  </div>

                  <div className="space-y-2">
                    {loadingDetail ? (
                      <p className="text-sm text-gray-500">Cargando...</p>
                    ) : notas.length === 0 ? (
                      <p className="text-sm text-gray-500">Sin notas registradas.</p>
                    ) : (
                      notas.map((nota) => (
                        <div key={nota.id} className="border-b pb-2">
                          <div className="text-xs text-gray-500">
                            {new Date(nota.created_at).toLocaleString("es-MX")}
                          </div>
                          <div className="text-sm text-gray-700 whitespace-pre-line">{nota.nota}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
