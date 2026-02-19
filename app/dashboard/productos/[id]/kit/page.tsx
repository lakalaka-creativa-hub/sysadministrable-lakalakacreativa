"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Product = {
  id: string;
  name: string;
};

type KitItem = {
  id: string;
  kit_product_id: string;
  component_supply_id: string;
  quantity: number;
  supply:
    | {
        id: string;
        name: string;
        provider_supplies?: { supplier_price: number | null; active: boolean }[];
      }
    | null;
};

type Supply = {
  id: string;
  name: string;
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

export default function ProductoKitPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [kitItems, setKitItems] = useState<KitItem[]>([]);
  const [selectedSupplyId, setSelectedSupplyId] = useState("");
  const [quantity, setQuantity] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [savingItem, setSavingItem] = useState(false);

  const loadProduct = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("id, name")
      .eq("id", productId)
      .single();

    if (error) {
      console.error("Error cargando producto", error.message);
      setProduct(null);
      return null;
    }

    setProduct(data as Product);
    return data as Product;
  };

  const loadSupplies = async () => {
    const { data, error } = await supabase
      .from("supplies")
      .select("id, name")
      .eq("active", true)
      .order("name");

    if (error) {
      console.error("Error cargando insumos", error.message);
      return [] as Supply[];
    }

    const list = (data as Supply[]) || [];
    setSupplies(list);
    return list;
  };

  const loadKitItems = async () => {
    const { data, error } = await supabase
      .from("kit_items")
      .select(
        "id, kit_product_id, component_supply_id, quantity, supply:supplies(id, name, provider_supplies:provider_supplies(supplier_price, active))"
      )
      .eq("kit_product_id", productId)
      .order("component_supply_id", { ascending: true });

    if (error) {
      console.error("Error cargando kit", error.message);
      setKitItems([]);
      return [] as KitItem[];
    }

    const raw = (data as any[]) || [];
    const list: KitItem[] = raw.map((item) => ({
      ...item,
      supply: normalizeSupply(item),
    }));

    setKitItems(list);
    return list;
  };

  useEffect(() => {
    let mounted = true;

    const loadAll = async () => {
      setLoading(true);
      await Promise.all([loadKitItems(), loadProduct(), loadSupplies()]);
      if (mounted) {
        setLoading(false);
      }
    };

    loadAll();

    return () => {
      mounted = false;
    };
  }, [productId]);

  const addKitItem = async () => {
    if (!selectedSupplyId) return alert("Selecciona un insumo");
    if (quantity <= 0) return alert("Ingresa una cantidad válida");
    if (kitItems.some((item) => item.component_supply_id === selectedSupplyId)) {
      return alert("Este insumo ya está en el kit");
    }

    setSavingItem(true);
    try {
      const { data, error } = await supabase
        .from("kit_items")
        .insert({
          kit_product_id: productId,
          component_supply_id: selectedSupplyId,
          quantity,
        })
        .select(
          "id, kit_product_id, component_supply_id, quantity, supply:supplies(id, name, provider_supplies:provider_supplies(supplier_price, active))"
        )
        .single();

      if (error) {
        alert("Error al agregar componente: " + error.message);
        return;
      }

      const inserted = data as any;
      const normalized: KitItem = { ...inserted, supply: normalizeSupply(inserted) };
      setKitItems((prev) => [...prev, normalized]);
      setSelectedSupplyId("");
      setQuantity(1);
    } finally {
      setSavingItem(false);
    }
  };

  const removeKitItem = async (id: string) => {
    const ok = confirm("¿Quitar este insumo del kit?");
    if (!ok) return;

    const { error } = await supabase.from("kit_items").delete().eq("id", id);

    if (error) {
      alert("Error al quitar insumo: " + error.message);
      return;
    }

    setKitItems((prev) => prev.filter((item) => item.id !== id));
  };

  if (loading) return <p>Cargando…</p>;
  if (!product) return <p>Producto no encontrado</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Definir kit: {product.name}</h1>
        <button
          onClick={() => router.push("/dashboard/productos")}
          className="px-4 py-2 rounded border border-[var(--boho-primary)] text-[var(--boho-primary)] hover:bg-[var(--boho-primary)] hover:text-white"
        >
          ← Volver
        </button>
      </div>

      <div className="space-y-4 bg-white p-4 rounded border">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Agregar insumos al kit</h2>
        </div>

        <div className="flex flex-col md:flex-row md:items-end gap-3">
          <div className="flex-1">
            <label className="block text-sm mb-1">Insumo</label>
            <select
              value={selectedSupplyId}
              onChange={(e) => setSelectedSupplyId(e.target.value)}
              className="border p-2 rounded w-full"
            >
              <option value="" disabled>
                Selecciona un insumo
              </option>
              {supplies.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="w-full md:w-32">
            <label className="block text-sm mb-1">Cantidad</label>
            <input
              type="number"
              min="1"
              step="1"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="border p-2 rounded w-full"
              placeholder="1"
            />
          </div>
          <div className="md:w-auto">
            <button
              onClick={addKitItem}
              disabled={savingItem}
              className="px-4 py-2 rounded bg-[var(--boho-primary)] text-white hover:opacity-90 disabled:opacity-50"
            >
              {savingItem ? "Agregando..." : "Agregar"}
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4 bg-white p-4 rounded border">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Insumos del kit</h2>
        </div>

        <table className="w-full bg-white border">
          <thead className="bg-gray-50">
            <tr className="border-b">
              <th className="p-2 text-left">Insumo</th>
              <th className="p-2 text-right">Precio unitario</th>
              <th className="p-2 text-right">Cantidad</th>
              <th className="p-2 text-right">Subtotal</th>
              <th className="p-2 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {kitItems.length === 0 && (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-500">
                  Aún no hay insumos en este kit
                </td>
              </tr>
            )}
            {kitItems.map((item) => (
              <tr key={item.id} className="border-b">
                <td className="p-2 text-sm">{item.supply?.name || "(sin nombre)"}</td>
                <td className="p-2 text-sm text-right">
                  {(() => {
                    const unit = getSupplyUnitCost(item.supply);
                    return unit !== null ? `$${unit.toFixed(2)}` : "—";
                  })()}
                </td>
                <td className="p-2 text-sm text-right">{item.quantity}</td>
                <td className="p-2 text-sm text-right">
                  {(() => {
                    const unit = getSupplyUnitCost(item.supply);
                    return unit !== null ? `$${(unit * item.quantity).toFixed(2)}` : "—";
                  })()}
                </td>
                <td className="p-2 text-right">
                  <button
                    onClick={() => removeKitItem(item.id)}
                    className="px-3 py-1.5 rounded-md border border-[var(--boho-secondary)] text-[var(--boho-secondary)] hover:bg-[var(--boho-secondary)] hover:text-white text-sm font-medium"
                  >
                    Quitar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {kitItems.length > 0 && (
          <div className="flex justify-end text-sm font-semibold text-gray-800">
            {(() => {
              const total = kitItems.reduce((sum, item) => {
                const unit = getSupplyUnitCost(item.supply);
                if (unit === null) return sum;
                return sum + unit * item.quantity;
              }, 0);
              return <span>Total del kit: ${total.toFixed(2)}</span>;
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
