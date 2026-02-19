"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type SupplyRow = {
  id: string;
  name: string;
  [key: string]: any;
};

type InventoryItem = SupplyRow & {
  _stock: number;
  _min: number;
  _cost: number;
};


type FieldMap = {
  stockKey: string;
  minKey: string;
  costKey: string;
};

const numberOrZero = (value: any) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const detectField = (sample: SupplyRow, candidates: string[], fallback: string) => {
  const found = candidates.find((key) => sample && Object.prototype.hasOwnProperty.call(sample, key));
  return found || fallback;
};

const getStatus = (item: InventoryItem) => {
  if (item._stock <= 0) {
    return { label: "Sin stock", tone: "border-red-100 bg-red-50 text-red-700", icon: "🔴" };
  }
  if (item._stock <= item._min) {
    return { label: "En riesgo", tone: "border-amber-100 bg-amber-50 text-amber-700", icon: "🟡" };
  }
  return { label: "Sano", tone: "border-emerald-100 bg-emerald-50 text-emerald-700", icon: "🟢" };
};

export default function InventarioPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<FieldMap>({
    stockKey: "stock",
    minKey: "stock_min",
    costKey: "unit_cost",
  });

  const loadSupplies = async () => {
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase.from("supplies").select("*").order("name");

    if (fetchError) {
      setError(fetchError.message);
      setItems([]);
      setLoading(false);
      return;
    }

    const sample = (data && data[0]) || ({} as SupplyRow);
    const stockKey = detectField(sample, ["stock", "stock_actual", "current_stock", "qty", "quantity"], "stock");
    const minKey = detectField(sample, ["stock_min", "min_stock", "stock_minimo", "reorder_point"], "stock_min");
    const costKey = detectField(sample, ["unit_cost", "cost", "cost_unit", "costo_unitario", "price"], "unit_cost");

    setFields({ stockKey, minKey, costKey });

    const normalized = (data || []).map((row) => ({
      ...row,
      _stock: numberOrZero((row as any)[stockKey]),
      _min: numberOrZero((row as any)[minKey]),
      _cost: numberOrZero((row as any)[costKey]),
    }));

    setItems(normalized);
    setLoading(false);
  };

  useEffect(() => {
    loadSupplies();
  }, []);

  const totalInvestment = useMemo(
    () => items.reduce((sum, item) => sum + (item._stock || 0) * (item._cost || 0), 0),
    [items]
  );

  const updateLocal = (id: string, key: "_stock" | "_min" | "_cost", value: number) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, [key]: value } : item)));
  };



  if (loading) return <p className="p-4">Cargando inventario…</p>;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Inventario</h1>
          <p className="text-sm text-gray-600">Fuente de verdad: tabla supplies. Edición manual, sin descuentos automáticos.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadSupplies}
            className="px-4 py-2 rounded border border-[var(--boho-primary)] text-[var(--boho-primary)] hover:bg-[var(--boho-primary)] hover:text-white"
          >
            Refrescar
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="overflow-auto rounded border bg-white">
        <table className="min-w-full border-collapse text-sm">
          <thead className="bg-gray-50">
            <tr className="border-b">
              <th className="p-3 text-left font-semibold text-gray-700">Insumo</th>
              <th className="p-3 text-right font-semibold text-gray-700">Stock actual</th>
              <th className="p-3 text-right font-semibold text-gray-700">Stock mínimo</th>
              <th className="p-3 text-right font-semibold text-gray-700">Costo unitario</th>
              <th className="p-3 text-right font-semibold text-gray-700">Inversión</th>
              <th className="p-3 text-left font-semibold text-gray-700">Estado</th>
              
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-gray-500">No hay insumos cargados.</td>
              </tr>
            )}
            {items.map((item) => {
              const status = getStatus(item);
              const investment = (item._stock || 0) * (item._cost || 0);
              return (
                <tr key={item.id} className="border-b last:border-0">
                  <td className="p-3 align-middle text-gray-900">{item.name || "(sin nombre)"}</td>
                  <td className="p-3 align-middle text-right">
                    <input
                      type="number"
                      step="0.01"
                      value={item._stock}
                      onChange={(e) => updateLocal(item.id, "_stock", numberOrZero(e.target.value))}
                      className="w-28 rounded border px-2 py-1 text-right"
                    />
                  </td>
                  <td className="p-3 align-middle text-right">
                    <input
                      type="number"
                      step="0.01"
                      value={item._min}
                      onChange={(e) => updateLocal(item.id, "_min", numberOrZero(e.target.value))}
                      className="w-28 rounded border px-2 py-1 text-right"
                    />
                  </td>
                  <td className="p-3 align-middle text-right">
                    <input
                      type="number"
                      step="0.01"
                      value={item._cost}
                      onChange={(e) => updateLocal(item.id, "_cost", numberOrZero(e.target.value))}
                      className="w-28 rounded border px-2 py-1 text-right"
                    />
                  </td>
                  <td className="p-3 align-middle text-right font-semibold text-gray-900">
                    ${investment.toFixed(2)}
                  </td>
                  <td className="p-3 align-middle">
                    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${status.tone}`}>
                      <span>{status.icon}</span>
                    </span>
                  </td>
                  
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between rounded border bg-white px-4 py-3 text-sm font-semibold text-gray-800">
        <span>Inversión total en inventario:</span>
        <span className="text-lg">${totalInvestment.toFixed(2)}</span>
      </div>

      <div className="rounded border border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-600">
        Usando columnas: stock = {fields.stockKey}, stock mínimo = {fields.minKey}, costo unitario = {fields.costKey}.
        Si tu tabla supplies usa otros nombres, ajusta esos campos en la base para evitar errores.
      </div>
    </div>
  );
}
