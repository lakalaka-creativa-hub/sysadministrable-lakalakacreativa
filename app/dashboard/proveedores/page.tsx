"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Provider = {
  id: string;
  name: string;
  address?: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  active: boolean;
  created_at: string;
};

export default function ProveedoresPage() {
  const router = useRouter();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const loadData = async () => {
    const { data } = await supabase
      .from("providers")
      .select("*")
      .order("active", { ascending: false })
      .order("created_at", { ascending: false });

    setProviders(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleActive = async (p: Provider) => {
    if (togglingId) return;

    if (p.active) {
      const ok = confirm("¿Desactivar este proveedor?");
      if (!ok) return;
    }

    setTogglingId(p.id);
    try {
      const { error } = await supabase
        .from("providers")
        .update({ active: !p.active })
        .eq("id", p.id);

      if (!error) {
        setProviders((prev) =>
          prev.map((item) =>
            item.id === p.id ? { ...item, active: !p.active } : item
          )
        );
      }
    } finally {
      setTogglingId(null);
    }
  };

  if (loading) return <p>Cargando…</p>;

  const term = searchTerm.trim().toLowerCase();
  const filteredProviders = providers.filter((p) => {
    if (!term) return true;
    const nameMatch = p.name.toLowerCase().includes(term);
    const addressMatch = (p.address || "").toLowerCase().includes(term);
    const phoneMatch = (p.phone || "").toLowerCase().includes(term);
    return nameMatch || addressMatch || phoneMatch;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Proveedores</h1>
        <button
          onClick={() => router.push("/dashboard/proveedores/nueva")}
          className="px-4 py-2 rounded bg-[var(--boho-primary)] text-white hover:opacity-90"
        >
          + Nuevo proveedor
        </button>
      </div>

      <div className="flex-1">
        <input
          type="search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar proveedor..."
          className="w-full border rounded px-3 py-2"
        />
      </div>

      <table className="w-full bg-white border">
        <thead className="bg-gray-50">
          <tr className="border-b">
            <th className="p-2 text-left">Nombre</th>
            <th className="p-2 text-left">Dirección</th>
            <th className="p-2 text-left">Teléfono</th>
            <th className="p-2 text-left">Email</th>
            <th className="p-2 text-left">Estado</th>
            <th className="p-2 text-right"></th>
          </tr>
        </thead>
        <tbody>
          {providers.length === 0 && (
            <tr>
              <td colSpan={6} className="p-4 text-center text-gray-500">
                No hay proveedores registrados
              </td>
            </tr>
          )}
          {filteredProviders.map((p) => (
            <tr key={p.id} className="border-b hover:bg-gray-50">
              <td className="p-2 font-medium">{p.name}</td>
              <td className="p-2 text-sm text-gray-700">{p.address || "—"}</td>
              <td className="p-2 text-sm text-gray-700">{p.phone || "—"}</td>
              <td className="p-2 text-sm text-gray-700">{p.email || "—"}</td>
              <td className="p-2">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    p.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  }`}
                >
                  {p.active ? "ACTIVO" : "INACTIVO"}
                </span>
              </td>
              <td className="p-2 text-right">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => router.push(`/dashboard/proveedores/${p.id}/editar`)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-[var(--boho-primary)] text-white text-sm font-medium hover:opacity-90"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => toggleActive(p)}
                    disabled={togglingId === p.id}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-md border text-sm font-medium transition-colors border-[var(--boho-secondary)] text-[var(--boho-secondary)] ${
                      togglingId === p.id
                        ? "opacity-60 cursor-not-allowed"
                        : "hover:bg-[var(--boho-secondary)] hover:text-white"
                    }`}
                  >
                    {togglingId === p.id
                      ? "Actualizando..."
                      : p.active
                      ? "Desactivar"
                      : "Activar"}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
