"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Product = {
  id: string;
  name: string;
  price: number;
  active: boolean;
};

type KitRef = {
  kit_product_id: string;
};

type KitComponent = {
  id: string;
  quantity: number;
  supply:
    | {
        id: string;
        name: string;
        provider_supplies?: { supplier_price: number | null; active: boolean }[];
      }
    | null;
};

export default function ProductosPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [saving, setSaving] = useState(false);

  const [editing, setEditing] = useState<Product | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editActive, setEditActive] = useState(true);
  const [isKit, setIsKit] = useState(false);
  const [realCost, setRealCost] = useState<number | null>(null);
  const [kitIds, setKitIds] = useState<Set<string>>(new Set());
  const [kitComponents, setKitComponents] = useState<KitComponent[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "SIMPLE" | "KIT">("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ACTIVE");

  const fetchProducts = async () => {
    setLoading(true);

    // Productos
    const { data: productsData, error: productsError } = await supabase
      .from("products")
      .select("id, name, price, active")
      .order("name");

    if (productsError) {
      alert(productsError.message);
      setLoading(false);
      return;
    }

    setProducts(productsData || []);

    // Kits (solo referencia visual)
    const { data: kitItems, error: kitError } = await supabase
      .from("kit_items")
      .select("kit_product_id");

    if (!kitError && kitItems) {
      setKitIds(new Set((kitItems as KitRef[]).map((k) => k.kit_product_id)));
    } else {
      setKitIds(new Set());
    }

    setLoading(false);
  };

  const getSupplyUnitCost = (
    supply:
      | {
          provider_supplies?: { supplier_price: number | null; active: boolean }[];
        }
      | null
  ) => {
    const prices = supply?.provider_supplies?.
      map((ps) => (ps.supplier_price === null ? undefined : Number(ps.supplier_price)))
      .filter((v) => v !== undefined) as number[];
    if (!prices || prices.length === 0) return null;
    const activePrices = supply?.provider_supplies
      ?.filter((ps) => ps.active && ps.supplier_price !== null)
      .map((ps) => Number(ps.supplier_price));
    const candidate = activePrices && activePrices.length > 0 ? activePrices : prices;
    return Math.min(...candidate);
  };

  const normalizeSupply = (item: any) => {
    if (!item) return null;
    const raw = (item as any).supply;
    if (Array.isArray(raw)) return raw[0] ?? null;
    return raw ?? null;
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const createProduct = async () => {
    if (!name || !price) return alert("Nombre y precio son obligatorios");

    setSaving(true);

    const { error } = await supabase.from("products").insert({
      name,
      price: Number(price),
      active: true,
    });

    setSaving(false);

    if (error) {
      alert(error.message);
    } else {
      setName("");
      setPrice("");
      setShowForm(false);
      fetchProducts();
    }
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setEditName(p.name);
    setEditPrice(p.price.toString());
    setEditActive(p.active);
    const productIsKit = kitIds.has(p.id);
    setIsKit(productIsKit);
    setRealCost(null);
    setKitComponents([]);

    if (productIsKit) {
      supabase
        .from("kit_items")
        .select(
          "id, quantity, supply:supplies(id, name, provider_supplies:provider_supplies(supplier_price, active))"
        )
        .eq("kit_product_id", p.id)
        .order("id")
        .then(({ data, error }) => {
          if (!error) {
            const raw = (data as any[]) || [];
            const list: KitComponent[] = raw.map((item) => ({
              ...item,
              supply: normalizeSupply(item),
            }));
            setKitComponents(list);
          }
        });
    }

    supabase
      .rpc("get_product_cost", { p_product_id: p.id })
      .then(({ data, error }) => {
        if (!error) setRealCost(Number(data || 0));
      });
  };

  const updateProduct = async () => {
    if (!editing) return;
    if (!editName || !editPrice) return alert("Nombre y precio son obligatorios");

    const { error } = await supabase
      .from("products")
      .update({
        name: editName,
        price: Number(editPrice),
        active: editActive,
      })
      .eq("id", editing.id);

    if (error) {
      alert(error.message);
    } else {
      setEditing(null);
      fetchProducts();
    }
  };

  const toggleActive = async (p: Product) => {
    const { error } = await supabase
      .from("products")
      .update({ active: !p.active })
      .eq("id", p.id);

    if (error) {
      alert(error.message);
    } else {
      fetchProducts();
    }
  };

  const deleteProduct = async (p: Product) => {
    const ok = confirm(`¿Quitar el producto "${p.name}" de la lista? Podrás verlo en Inactivos.`);
    if (!ok) return;

    const { error } = await supabase
      .from("products")
      .update({ active: false })
      .eq("id", p.id);

    if (error) {
      alert(error.message);
      return;
    }

    fetchProducts();
  };

  if (loading) return <p>Cargando productos…</p>;

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const isKitProduct = kitIds.has(p.id);

    const matchesType =
      typeFilter === "ALL" || (typeFilter === "KIT" && isKitProduct) || (typeFilter === "SIMPLE" && !isKitProduct);

    const matchesStatus =
      statusFilter === "ALL" || (statusFilter === "ACTIVE" && p.active) || (statusFilter === "INACTIVE" && !p.active);

    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-semibold">Productos</h1>
          <p className="text-sm text-gray-600">
            Estos son los productos / kits / combos ya formados. Aquí no van los insumos.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 rounded bg-[var(--boho-primary)] text-white"
        >
          + Nuevo producto
        </button>
      </div>

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex-1">
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar producto..."
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Tipo:</span>
            {["ALL", "SIMPLE", "KIT"].map((v) => (
              <button
                key={v}
                onClick={() => setTypeFilter(v as any)}
                className={`px-3 py-1.5 rounded border text-sm ${
                  typeFilter === v
                    ? "bg-[var(--boho-primary)] text-white border-[var(--boho-primary)]"
                    : "text-[var(--boho-primary)] border-[var(--boho-primary)] hover:bg-[var(--boho-primary)] hover:text-white"
                }`}
              >
                {v === "ALL" ? "Todos" : v}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Estado:</span>
            {["ALL", "ACTIVE", "INACTIVE"].map((v) => (
              <button
                key={v}
                onClick={() => setStatusFilter(v as any)}
                className={`px-3 py-1.5 rounded border text-sm ${
                  statusFilter === v
                    ? "bg-[var(--boho-primary)] text-white border-[var(--boho-primary)]"
                    : "text-[var(--boho-primary)] border-[var(--boho-primary)] hover:bg-[var(--boho-primary)] hover:text-white"
                }`}
              >
                {v === "ALL" ? "Todos" : v === "ACTIVE" ? "Activos" : "Inactivos"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {showForm && (
        <div className="mb-6 p-4 rounded bg-white border">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              placeholder="Nombre"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border p-2 rounded"
            />
            <input
              placeholder="Precio"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              type="number"
              className="border p-2 rounded"
            />
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={createProduct}
              disabled={saving}
              className="px-4 py-2 rounded bg-[var(--boho-secondary)] text-white"
            >
              {saving ? "Guardando…" : "Guardar"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded border border-[var(--boho-primary)] text-[var(--boho-primary)] hover:bg-[var(--boho-primary)] hover:text-white"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <table className="w-full border-collapse bg-white">
        <thead>
          <tr className="border-b">
            <th className="text-left p-2">Nombre</th>
            <th className="text-left p-2">Precio</th>
            <th className="text-center p-2">Tipo</th>
            <th className="text-left p-2">Activo</th>
            <th className="text-left p-2">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {filteredProducts.map((p) => (
            <tr key={p.id} className="border-b">
              <td className="p-2">{p.name}</td>
              <td className="p-2">${p.price}</td>
              <td className="px-3 py-2 text-center">
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    kitIds.has(p.id)
                      ? "bg-purple-100 text-purple-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {kitIds.has(p.id) ? "KIT" : "SIMPLE"}
                </span>
              </td>
              <td className="p-2">
                <input
                  type="checkbox"
                  checked={p.active}
                  onChange={() => toggleActive(p)}
                  className="h-4 w-4 cursor-pointer"
                />
              </td>
              <td className="p-2">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => openEdit(p)}
                    className="px-3 py-1 rounded border border-[var(--boho-primary)] text-[var(--boho-primary)] hover:bg-[var(--boho-primary)] hover:text-white"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => deleteProduct(p)}
                    className="px-3 py-1 rounded border border-red-300 text-red-600 hover:bg-red-50"
                  >
                    Eliminar
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Editar producto</h2>

            <div className="space-y-3">
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="border p-2 rounded w-full"
              />
              <input
                value={editPrice}
                onChange={(e) => setEditPrice(e.target.value)}
                type="number"
                className="border p-2 rounded w-full"
              />

                <div className="flex items-center justify-between text-sm text-gray-700">
                  <div>
                    Costo real:
                    <span className="ml-1 font-semibold">
                      ${realCost !== null ? realCost.toFixed(2) : "—"}
                    </span>
                  </div>

                  {!isKit && editing && (
                    <button
                      onClick={() => router.push(`/dashboard/productos/${editing.id}/kit`)}
                      className="px-3 py-1 rounded bg-[var(--boho-secondary)] text-white text-xs font-semibold hover:opacity-90"
                    >
                      Definir Kit
                    </button>
                  )}
                </div>

              {isKit && (
                <div className="mt-3 rounded border bg-gray-50 p-3 space-y-2">
                  <div className="text-sm font-semibold text-gray-800">Este kit incluye:</div>
                  {kitComponents.length === 0 ? (
                    <div className="text-sm text-gray-700">Este kit aún no tiene insumos definidos</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-gray-800">
                        <thead>
                          <tr className="text-left text-xs text-gray-500">
                            <th className="py-1 pr-2">Insumo</th>
                            <th className="py-1 pr-2 text-right">Precio unitario</th>
                            <th className="py-1 pr-2 text-right">Cantidad</th>
                            <th className="py-1 text-right">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {kitComponents.map((kc) => {
                            const unit = getSupplyUnitCost(kc.supply);
                            const subtotal = unit !== null ? unit * kc.quantity : null;
                            return (
                              <tr key={kc.id} className="border-t">
                                <td className="py-1 pr-2">{kc.supply?.name || "(sin nombre)"}</td>
                                <td className="py-1 pr-2 text-right">
                                  {unit !== null ? `$${unit.toFixed(2)}` : "—"}
                                </td>
                                <td className="py-1 pr-2 text-right">{kc.quantity}</td>
                                <td className="py-1 text-right">
                                  {subtotal !== null ? `$${subtotal.toFixed(2)}` : "—"}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {editing && (
                    <button
                      onClick={() => router.push(`/dashboard/productos/${editing.id}/kit`)}
                      className="w-full px-3 py-2 rounded border border-[var(--boho-secondary)] text-[var(--boho-secondary)] bg-white hover:bg-[var(--boho-secondary)] hover:text-white text-sm font-semibold"
                    >
                      Editar componentes del kit
                    </button>
                  )}
                </div>
              )}

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editActive}
                  onChange={(e) => setEditActive(e.target.checked)}
                />
                Activo
              </label>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setEditing(null)}
                className="px-4 py-2 rounded border border-[var(--boho-primary)] text-[var(--boho-primary)] hover:bg-[var(--boho-primary)] hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={updateProduct}
                className="px-4 py-2 rounded bg-[var(--boho-primary)] text-white"
              >
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
