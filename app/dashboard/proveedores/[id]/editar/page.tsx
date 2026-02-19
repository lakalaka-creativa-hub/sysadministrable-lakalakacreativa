"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Provider = {
  id: string;
  name: string;
  address?: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  active: boolean;
};

type Supply = {
  id: string;
  name: string;
};

type ProviderSupply = {
  id: string;
  supply_id: string;
  supply: { id: string; name: string } | null;
  supplier_price: number;
  active: boolean;
};

export default function EditarProveedorPage() {
  const params = useParams();
  const router = useRouter();
  const providerId = params.id as string;

  const [provider, setProvider] = useState<Provider | null>(null);
  const [providerSupplies, setProviderSupplies] = useState<ProviderSupply[]>([]);
  const [supplyName, setSupplyName] = useState("");
  const [supplyPrice, setSupplyPrice] = useState<number>(0);
  const [psSaving, setPsSaving] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadProvider = async () => {
    const { data, error } = await supabase
      .from("providers")
      .select("id, name, address, phone, email, notes, active")
      .eq("id", providerId)
      .single();

    if (error) {
      console.error("Error cargando proveedor", error.message);
      setProvider(null);
      return;
    }

    setProvider(data as Provider);
  };

  const loadProducts = async () => {
    /* products no longer used for providers */
  };

  const loadProviderSupplies = async () => {
    const { data, error } = await supabase
      .from("provider_supplies")
      .select("id, supply_id, supplier_price, active, supply:supplies(id, name)")
      .eq("provider_id", providerId)
      .order("active", { ascending: false })
      .order("supply_id", { ascending: true });

    if (error) {
      console.error("Error cargando insumos del proveedor", error.message);
      return;
    }

    const raw = (data as any[]) || [];
    const normalized: ProviderSupply[] = raw.map((item) => ({
      ...item,
      supply: Array.isArray((item as any).supply) ? (item as any).supply[0] ?? null : (item as any).supply ?? null,
    }));

    setProviderSupplies(normalized);
  };

  useEffect(() => {
    let isMounted = true;

    const loadAll = async () => {
      setLoading(true);
      await Promise.all([
        loadProvider(),
        loadProviderSupplies(),
      ]);
      if (isMounted) setLoading(false);
    };

    loadAll();

    return () => {
      isMounted = false;
    };
  }, [providerId]);

  const save = async () => {
    if (!provider) return;
    if (!provider.name.trim()) return alert("El nombre es obligatorio");
    if (saving) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("providers")
        .update({
          name: provider.name.trim(),
          address: provider.address?.trim() || null,
          phone: provider.phone?.trim() || null,
          email: provider.email?.trim() || null,
          notes: provider.notes?.trim() || null,
          active: provider.active,
        })
        .eq("id", provider.id);

      if (error) {
        alert("Error al actualizar: " + error.message);
        return;
      }

      router.push("/dashboard/proveedores");
    } catch (err) {
      console.error(err);
      alert("Error inesperado al guardar");
    } finally {
      setSaving(false);
    }
  };

  const saveSupply = async () => {
    if (psSaving) return;
    const trimmed = supplyName.trim();
    if (!trimmed) return alert("Ingresa un nombre de insumo");
    if (supplyPrice <= 0) return alert("Ingresa un precio válido");

    setPsSaving(true);
    try {
      // Buscar insumo por nombre (case-insensitive)
      const { data: found, error: findError } = await supabase
        .from("supplies")
        .select("id, name")
        .ilike("name", trimmed)
        .limit(1);

      if (findError) {
        alert("Error buscando insumo: " + findError.message);
        return;
      }

      let supplyId = found && found.length ? (found[0] as Supply).id : "";

      if (!supplyId) {
        const { data: supplyRow, error: supplyError } = await supabase
          .from("supplies")
          .insert({ name: trimmed, active: true })
          .select("id")
          .single();

        if (supplyError) {
          alert("Error creando insumo: " + supplyError.message);
          return;
        }

        supplyId = (supplyRow as Supply).id;
      }

      const existing = providerSupplies.find((ps) => ps.supply_id === supplyId);

      if (existing) {
        const { error } = await supabase
          .from("provider_supplies")
          .update({ supplier_price: supplyPrice, active: true })
          .eq("id", existing.id);

        if (error) {
          alert("Error actualizando insumo: " + error.message);
          return;
        }
      } else {
        const { error } = await supabase.from("provider_supplies").insert({
          provider_id: providerId,
          supply_id: supplyId,
          supplier_price: supplyPrice,
          active: true,
        });

        if (error) {
          alert("Error al asignar insumo: " + error.message);
          return;
        }
      }

      setSupplyName("");
      setSupplyPrice(0);
      await loadProviderSupplies();
    } finally {
      setPsSaving(false);
    }
  };

  const updateSupplyPrice = async (id: string, price: number) => {
    if (price <= 0) return alert("Ingresa un precio válido");
    const { error } = await supabase
      .from("provider_supplies")
      .update({ supplier_price: price })
      .eq("id", id);

    if (error) alert("Error al actualizar precio: " + error.message);
  };

  const toggleProviderSupply = async (id: string, active: boolean) => {
    if (!active) {
      const ok = confirm("¿Desactivar este insumo para el proveedor?");
      if (!ok) return;
    }

    const { error } = await supabase
      .from("provider_supplies")
      .update({ active })
      .eq("id", id);

    if (error) {
      alert("Error al actualizar estado: " + error.message);
      return;
    }

    await loadProviderSupplies();
  };

  if (loading) return <p>Cargando…</p>;
  if (!provider) return <p>Proveedor no encontrado</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Editar proveedor</h1>
        <button
          onClick={() => router.push("/dashboard/proveedores")}
          className="px-4 py-2 rounded border border-[var(--boho-primary)] text-[var(--boho-primary)] hover:bg-[var(--boho-primary)] hover:text-white"
        >
          ← Cancelar
        </button>
      </div>

      <div className="space-y-4 bg-white p-4 rounded border">
        <div>
          <label className="block text-sm mb-1">Nombre *</label>
          <input
            value={provider.name}
            onChange={(e) => setProvider({ ...provider, name: e.target.value })}
            className="border p-2 rounded w-full"
            placeholder="Nombre del proveedor"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Teléfono</label>
            <input
              value={provider.phone || ""}
              onChange={(e) => setProvider({ ...provider, phone: e.target.value })}
              className="border p-2 rounded w-full"
              placeholder="Teléfono"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Email</label>
            <input
              value={provider.email || ""}
              onChange={(e) => setProvider({ ...provider, email: e.target.value })}
              className="border p-2 rounded w-full"
              placeholder="correo@ejemplo.com"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm mb-1">Dirección</label>
          <textarea
            value={provider.address || ""}
            onChange={(e) => setProvider({ ...provider, address: e.target.value })}
            className="border p-2 rounded w-full"
            rows={2}
            placeholder="Dirección del proveedor"
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Notas internas</label>
          <textarea
            value={provider.notes || ""}
            onChange={(e) => setProvider({ ...provider, notes: e.target.value })}
            className="border p-2 rounded w-full"
            rows={3}
            placeholder="Notas internas"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            id="provider-active"
            type="checkbox"
            className="h-4 w-4"
            checked={provider.active}
            onChange={(e) => setProvider({ ...provider, active: e.target.checked })}
          />
          <label htmlFor="provider-active" className="text-sm">
            Proveedor activo
          </label>
        </div>
      </div>

      <div className="space-y-4 bg-white p-4 rounded border">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Lo que este proveedor me vende</h2>
        </div>

        <div className="flex flex-col md:flex-row md:items-end gap-3">
          <div className="flex-1">
            <label className="block text-sm mb-1">Insumo</label>
            <input
              value={supplyName}
              onChange={(e) => setSupplyName(e.target.value)}
              className="border p-2 rounded w-full"
              placeholder="Nombre del insumo"
            />
          </div>
          <div className="w-full md:w-48">
            <label className="block text-sm mb-1">Precio proveedor</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={supplyPrice}
              onChange={(e) => setSupplyPrice(Number(e.target.value))}
              className="border p-2 rounded w-full"
              placeholder="0.00"
            />
          </div>
          <div className="md:w-auto flex gap-2 w-full md:w-auto">
            <button
              onClick={saveSupply}
              disabled={psSaving}
              className="w-full md:w-auto px-4 py-2 rounded bg-[var(--boho-primary)] text-white hover:opacity-90 disabled:opacity-50"
            >
              {psSaving ? "Guardando..." : "Guardar insumo"}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] bg-white border">
            <thead className="bg-gray-50">
              <tr className="border-b">
                <th className="p-2 text-left">Insumo</th>
                <th className="p-2 text-left">Precio proveedor</th>
                <th className="p-2 text-left">Estado</th>
                <th className="p-2 text-right"></th>
              </tr>
            </thead>
            <tbody>
              {providerSupplies.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-gray-500">
                    No hay insumos asignados a este proveedor
                  </td>
                </tr>
              )}
              {providerSupplies.map((ps) => (
                <tr key={ps.id} className="border-b">
                  <td className="p-2 text-sm">{ps.supply?.name || "(sin nombre)"}</td>
                  <td className="p-2 text-sm">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={ps.supplier_price}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setProviderSupplies((prev) =>
                          prev.map((item) =>
                            item.id === ps.id ? { ...item, supplier_price: val } : item
                          )
                        );
                      }}
                      onBlur={async () => {
                        const current = providerSupplies.find((x) => x.id === ps.id);
                        if (!current) return;
                        await updateSupplyPrice(ps.id, current.supplier_price);
                      }}
                      className="border p-1 rounded w-28 text-right"
                    />
                  </td>
                  <td className="p-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        ps.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}
                    >
                      {ps.active ? "ACTIVO" : "INACTIVO"}
                    </span>
                  </td>
                  <td className="p-2 text-right">
                    <button
                      onClick={() => toggleProviderSupply(ps.id, !ps.active)}
                      className="px-3 py-1.5 rounded-md border text-sm font-medium transition-colors border-[var(--boho-secondary)] text-[var(--boho-secondary)] hover:bg-[var(--boho-secondary)] hover:text-white"
                    >
                      {ps.active ? "Desactivar" : "Activar"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-end gap-3">
        <button
          onClick={() => router.push("/dashboard/proveedores")}
          className="w-full sm:w-auto px-6 py-2 rounded border border-[var(--boho-primary)] text-[var(--boho-primary)] hover:bg-[var(--boho-primary)] hover:text-white"
        >
          Cancelar
        </button>
        <button
          onClick={save}
          disabled={saving}
          className="w-full sm:w-auto px-6 py-2 rounded bg-[var(--boho-primary)] text-white hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
    </div>
  );
}
