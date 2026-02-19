"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { supabase } from "@/lib/supabase";

type Kpi = {
  totalRemisiones: number;
  remisionesCobradas: number;
  costosInsumos: number;
  costosInsumosCobrados: number;
  gastosOperativos: number;
};

type ChartPoint = {
  month: string;
  ventas: number;
  costos: number;
  gastos: number;
};

type PeriodTotals = {
  ventas: number;
  costos: number;
  gastos: number;
};

type ProductSales = {
  id: string;
  name: string;
  quantity: number;
};

type SupplyAlert = {
  id: string;
  name: string;
  stock: number;
  stockMin: number;
  status: "empty" | "low";
};

const fmtCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(value);

const startOfCurrentMonth = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
};

const endOfCurrentMonth = () => {
  const d = new Date();
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return end.toISOString().slice(0, 10);
};

const monthLabels = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

const buildMonthRange = (year: number, month: number) => {
  const start = new Date(year, month, 1).toISOString().slice(0, 10);
  const end = new Date(year, month + 1, 0).toISOString().slice(0, 10);
  return { start, end };
};

export default function DashboardPage() {
  const router = useRouter();
  const [fromDate, setFromDate] = useState(startOfCurrentMonth());
  const [toDate, setToDate] = useState(endOfCurrentMonth());
  const [selectedMonth, setSelectedMonth] = useState<number | null>(() => new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const [manualRange, setManualRange] = useState(false);
  const [loading, setLoading] = useState(true);
  const [chartEndMonth, setChartEndMonth] = useState(() => new Date().getMonth());
  const [chartEndYear, setChartEndYear] = useState(() => new Date().getFullYear());
  const [kpi, setKpi] = useState<Kpi>({
    totalRemisiones: 0,
    remisionesCobradas: 0,
    costosInsumos: 0,
    costosInsumosCobrados: 0,
    gastosOperativos: 0,
  });
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [periods, setPeriods] = useState<{ current: PeriodTotals; previous: PeriodTotals }>(
    { current: { ventas: 0, costos: 0, gastos: 0 }, previous: { ventas: 0, costos: 0, gastos: 0 } }
  );
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [pendingOverflow, setPendingOverflow] = useState(0);
  const [pendingOpen, setPendingOpen] = useState(false);
  const [lowSupplies, setLowSupplies] = useState<SupplyAlert[]>([]);
  const [suppliesOpen, setSuppliesOpen] = useState(false);
  const [topProduct, setTopProduct] = useState<ProductSales | null>(null);
  const [bottomProduct, setBottomProduct] = useState<ProductSales | null>(null);
  const yearOptions = Array.from({ length: 5 }, (_, i) => selectedYear - 2 + i);

  useEffect(() => {
    if (manualRange || selectedMonth === null) return;
    const range = buildMonthRange(selectedYear, selectedMonth);
    if (range.start !== fromDate) setFromDate(range.start);
    if (range.end !== toDate) setToDate(range.end);
  }, [manualRange, selectedMonth, selectedYear, fromDate, toDate]);

  const syncSelectionFromRange = (nextFrom: string, nextTo: string) => {
    if (!nextFrom || !nextTo) return;
    const from = new Date(nextFrom);
    const to = new Date(nextTo);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return;
    if (from.getFullYear() === to.getFullYear() && from.getMonth() === to.getMonth()) {
      setSelectedYear(from.getFullYear());
      setSelectedMonth(from.getMonth());
    } else {
      setSelectedYear(from.getFullYear());
      setSelectedMonth(null);
    }
  };

  const load = async () => {
    setLoading(true);

    const { data: remisionesData, error: remErr } = await supabase
      .from("remisiones")
      .select("id, total, total_cost, anticipo, fecha, status")
      .neq("status", "CANCELADA")
      .gte("fecha", fromDate)
      .lte("fecha", toDate);

    if (remErr) {
      alert("Error cargando ventas/costos: " + remErr.message);
      setLoading(false);
      return;
    }

    const remisiones = remisionesData || [];

    const totalRemisiones = remisiones.reduce((acc, r) => acc + Number((r as any).total || 0), 0);
    const remisionesCobradas = remisiones.reduce((acc, r) => acc + Number((r as any).anticipo || 0), 0);
    const costosInsumos = remisiones.reduce((acc, r) => acc + Number((r as any).total_cost || 0), 0);
    const costosInsumosCobrados = remisiones.reduce(
      (acc, r) => acc + (Number((r as any).anticipo || 0) > 0 ? Number((r as any).total_cost || 0) : 0),
      0
    );

    const { data: gastosData, error: expErr } = await supabase
      .from("expenses")
      .select("amount, date")
      .eq("active", true)
      .gte("date", fromDate)
      .lte("date", toDate);

    if (expErr) {
      alert("Error cargando gastos: " + expErr.message);
      setLoading(false);
      return;
    }

    const gastosOperativos = gastosData?.reduce((acc, r) => acc + Number((r as any).amount), 0) || 0;

    setKpi({
      totalRemisiones,
      remisionesCobradas,
      costosInsumos,
      costosInsumosCobrados,
      gastosOperativos,
    });

    // Mes actual y anterior para insight mes vs mes
    const now = new Date(fromDate);
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 10);
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10);

    const fetchPeriod = async (start: string, end: string) => {
      const { data: rems, error: remErr2 } = await supabase
        .from("remisiones")
        .select("total, total_cost, fecha")
        .neq("status", "CANCELADA")
        .gte("fecha", start)
        .lte("fecha", end);
      const { data: exps, error: expErr2 } = await supabase
        .from("expenses")
        .select("amount, date")
        .eq("active", true)
        .gte("date", start)
        .lte("date", end);
      if (remErr2 || expErr2) {
        return { ventas: 0, costos: 0, gastos: 0 } as PeriodTotals;
      }
      const ventasP = rems?.reduce((acc, r) => acc + Number((r as any).total || 0), 0) || 0;
      const costosP = rems?.reduce((acc, r) => acc + Number((r as any).total_cost || 0), 0) || 0;
      const gastosP = exps?.reduce((acc, r) => acc + Number((r as any).amount || 0), 0) || 0;
      return { ventas: ventasP, costos: costosP, gastos: gastosP } as PeriodTotals;
    };

    const [currentPeriod, previousPeriod] = await Promise.all([
      fetchPeriod(currentMonthStart, currentMonthEnd),
      fetchPeriod(prevMonthStart, prevMonthEnd),
    ]);

    setPeriods({ current: currentPeriod, previous: previousPeriod });

    const { data: pendingData, error: pendingErr, count: pendingCount } = await supabase
      .from("remisiones")
      .select("id, folio, cliente, total, delivered, status, fecha", { count: "exact" })
      .eq("delivered", false)
      .neq("status", "CANCELADA")
      .order("fecha", { ascending: true })
      .limit(10);

    if (pendingErr) {
      alert("Error cargando pedidos pendientes: " + pendingErr.message);
    }

    const list = pendingData || [];
    setPendingOrders(list);
    const extra = (pendingCount || 0) - list.length;
    setPendingOverflow(extra > 0 ? extra : 0);

    const { data: suppliesData, error: suppliesErr } = await supabase
      .from("supplies")
      .select("id, name, stock, stock_min")
      .order("name");

    if (suppliesErr) {
      console.error("Error cargando alertas de inventario", suppliesErr.message);
      setLowSupplies([]);
    } else {
      const alerts = (suppliesData || []).map((s) => {
        const stock = Number((s as any).stock ?? 0) || 0;
        const stockMin = Number((s as any).stock_min ?? 0) || 0;
        const isEmpty = stock <= 0;
        const isLow = !isEmpty && stock <= stockMin;
        return { id: (s as any).id, name: (s as any).name || "(sin nombre)", stock, stockMin, status: isEmpty ? "empty" : "low" } as SupplyAlert;
      }).filter((s) => s.stock <= 0 || s.stock <= s.stockMin);

      setLowSupplies(alerts);
    }

    const { data: allRemisiones, error: allRemErr } = await supabase
      .from("remisiones")
      .select("id")
      .neq("status", "CANCELADA");

    if (allRemErr) {
      console.error("Error cargando remisiones para ranking global", allRemErr.message);
      setTopProduct(null);
      setBottomProduct(null);
    } else {
      const remIds = (allRemisiones || []).map((r) => (r as any).id).filter(Boolean);
      if (remIds.length === 0) {
        setTopProduct(null);
        setBottomProduct(null);
      } else {
        const { data: itemsData, error: itemsErr } = await supabase
          .from("remision_items")
          .select("product_id, product_name, quantity, remision_id")
          .in("remision_id", remIds);

        if (itemsErr) {
          console.error("Error cargando ventas por producto", itemsErr.message);
          setTopProduct(null);
          setBottomProduct(null);
        } else {
          const salesMap = new Map<string, ProductSales>();

          (itemsData || []).forEach((item) => {
            const productId = (item as any).product_id as string | null;
            const name = (item as any).product_name || "(sin nombre)";
            const key = productId || `name:${name}`; // si no hay id, agrupa por nombre
            const qty = Number((item as any).quantity || 0) || 0;
            const prev = salesMap.get(key) || { id: key, name, quantity: 0 };
            salesMap.set(key, { ...prev, quantity: prev.quantity + qty, name });
          });

          const sales = Array.from(salesMap.values());
          if (sales.length === 0) {
            setTopProduct(null);
            setBottomProduct(null);
          } else {
            sales.sort((a, b) => b.quantity - a.quantity);
            setTopProduct(sales[0]);
            setBottomProduct(sales[sales.length - 1]);
          }
        }
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromDate, toDate]);

  const loadChartData = async () => {
    const endDate = new Date(chartEndYear, chartEndMonth + 1, 0);
    const minStartDate = new Date(2026, 0, 1);
    const rawStartDate = new Date(chartEndYear, chartEndMonth - 5, 1);
    const startDate = rawStartDate < minStartDate ? minStartDate : rawStartDate;
    const start = startDate.toISOString().slice(0, 10);
    const end = endDate.toISOString().slice(0, 10);

    const monthKey = (d: string) => d.slice(0, 7);
    const buildMonths = (startDateStr: string, endDateStr: string) => {
      const months: string[] = [];
      const cursor = new Date(startDateStr);
      cursor.setDate(1);
      const endCursor = new Date(endDateStr);
      endCursor.setDate(1);
      while (cursor <= endCursor) {
        const m = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;
        months.push(m);
        cursor.setMonth(cursor.getMonth() + 1);
      }
      return months.slice(-6);
    };

    const months = buildMonths(start, end);
    const base: Record<string, ChartPoint> = months.reduce((acc, m) => {
      acc[m] = { month: m, ventas: 0, costos: 0, gastos: 0 };
      return acc;
    }, {} as Record<string, ChartPoint>);

    const [{ data: rems }, { data: exps }] = await Promise.all([
      supabase
        .from("remisiones")
        .select("total, total_cost, fecha")
        .neq("status", "CANCELADA")
        .gte("fecha", start)
        .lte("fecha", end),
      supabase
        .from("expenses")
        .select("amount, date")
        .eq("active", true)
        .gte("date", start)
        .lte("date", end),
    ]);

    (rems || []).forEach((r) => {
      const m = monthKey((r as any).fecha);
      if (base[m]) {
        base[m].ventas += Number((r as any).total) || 0;
        base[m].costos += Number((r as any).total_cost) || 0;
      }
    });

    (exps || []).forEach((g) => {
      const m = monthKey((g as any).date);
      if (base[m]) {
        base[m].gastos += Number((g as any).amount) || 0;
      }
    });

    setChartData(months.map((m) => base[m]));
  };

  useEffect(() => {
    loadChartData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartEndMonth, chartEndYear]);

  const utilidadNetaRemisiones = useMemo(
    () => kpi.totalRemisiones - kpi.costosInsumos,
    [kpi]
  );

  const utilidadEnCaja = useMemo(
    () => kpi.remisionesCobradas - kpi.costosInsumosCobrados,
    [kpi.remisionesCobradas, kpi.costosInsumosCobrados]
  );

  const margen = useMemo(() => {
    if (!kpi.totalRemisiones) return 0;
    return (utilidadNetaRemisiones / kpi.totalRemisiones) * 100;
  }, [kpi.totalRemisiones, utilidadNetaRemisiones]);

  const netoPorCien = useMemo(() => {
    if (!kpi.totalRemisiones) return 0;
    return (margen / 100) * 100; // usa el margen ya calculado
  }, [kpi.totalRemisiones, margen]);

  const infoMessage = useMemo(() => {
    if (kpi.totalRemisiones === 0) return "No hay ventas registradas en el periodo seleccionado.";
    if (kpi.totalRemisiones > 0 && kpi.gastosOperativos === 0)
      return "Tip: Registra tus gastos para reflejar la utilidad real.";
    return null;
  }, [kpi]);

  const monthOverMonthMessage = useMemo(() => {
    const currentUtil = periods.current.ventas - periods.current.costos - periods.current.gastos;
    const prevUtil = periods.previous.ventas - periods.previous.costos - periods.previous.gastos;
    const diff = currentUtil - prevUtil;
    if (currentUtil === prevUtil) return "Tu utilidad es igual a la del mes pasado.";
    if (diff > 0) return `Este mes llevas ${fmtCurrency(diff)} más de utilidad que el mes pasado.`;
    return `Este mes llevas ${fmtCurrency(Math.abs(diff))} menos de utilidad que el mes pasado.`;
  }, [periods]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard financiero (Aura Limpia)</h1>
          <p className="text-sm text-gray-600">KPIs mensuales con filtro de fechas</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border rounded p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Pedidos pendientes</h2>
              <p className="text-sm text-gray-600">Pedidos aún no entregados</p>
            </div>
            {pendingOrders.length > 0 ? (
              <button
                onClick={() => setPendingOpen((open) => !open)}
                className="rounded border border-[var(--boho-primary)] px-3 py-1 text-sm font-medium text-[var(--boho-primary)] hover:bg-[var(--boho-primary)] hover:text-white"
              >
                {pendingOpen ? "Ocultar lista" : "Mostrar lista"}
              </button>
            ) : null}
          </div>
          {pendingOrders.length === 0 ? (
            <div className="text-sm text-gray-600">No tienes pedidos pendientes 🎉</div>
          ) : pendingOpen ? (
            <div className="divide-y border rounded">
              {pendingOrders.map((p) => (
                <div
                  key={p.id || p.folio || p.fecha}
                  onClick={() => router.push(`/dashboard/remisiones/${p.id}/editar`)}
                  className="flex items-center justify-between px-3 py-2 text-sm cursor-pointer hover:bg-gray-50"
                >
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-900">Folio: {p.folio ?? ""}</span>
                    <span className="text-gray-600">Cliente: {p.cliente ?? "Sin cliente"}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-800 font-medium">{fmtCurrency(Number(p.total) || 0)}</span>
                    <span className="text-red-600" title="Pendiente">
                      ❌
                    </span>
                  </div>
                </div>
              ))}
              {pendingOverflow > 0 ? (
                <div className="px-3 py-2 text-xs text-gray-500">+{pendingOverflow} más</div>
              ) : null}
            </div>
          ) : (
            <div className="text-sm text-gray-600">Toca "Mostrar lista" para ver los {pendingOrders.length} pedidos pendientes.</div>
          )}
        </div>

        <div className="bg-white border rounded p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Insumos por reabastecer</h2>
              <p className="text-sm text-gray-600">Insumos que están por debajo del stock mínimo</p>
            </div>
            {lowSupplies.length > 0 ? (
              <button
                onClick={() => setSuppliesOpen((open) => !open)}
                className="rounded border border-[var(--boho-primary)] px-3 py-1 text-sm font-medium text-[var(--boho-primary)] hover:bg-[var(--boho-primary)] hover:text-white"
              >
                {suppliesOpen ? "Ocultar lista" : "Mostrar lista"}
              </button>
            ) : null}
          </div>
          {lowSupplies.length === 0 ? (
            <div className="text-sm text-gray-600">Todo en orden, sin alertas.</div>
          ) : suppliesOpen ? (
            <div className="divide-y rounded border">
              {lowSupplies.map((s) => (
                <div key={s.id} className="flex items-center justify-between px-3 py-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex h-2.5 w-2.5 rounded-full ${s.status === "empty" ? "bg-red-500" : "bg-amber-400"}`} />
                    <span className="font-medium text-gray-900">{s.name}</span>
                  </div>
                  <span className="text-gray-700">Stock: {s.stock}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-600">Toca "Mostrar lista" para ver {lowSupplies.length} insumos en alerta.</div>
          )}
        </div>
      </div>

      <div className="bg-white border rounded p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[150px]">
            <label className="block text-xs text-gray-500">Mes</label>
            <select
              value={selectedMonth === null ? "" : String(selectedMonth)}
              onChange={(e) => {
                const next = e.target.value;
                if (next === "") return;
                setManualRange(false);
                setSelectedMonth(Number(next));
              }}
              className="w-full border rounded px-2 py-1.5 text-sm"
            >
              <option value="">Mes</option>
              {monthLabels.map((label, index) => (
                <option key={label} value={index}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-[110px]">
            <label className="block text-xs text-gray-500">Año</label>
            <select
              value={String(selectedYear)}
              onChange={(e) => {
                setManualRange(false);
                if (selectedMonth === null) {
                  setSelectedMonth(new Date().getMonth());
                }
                setSelectedYear(Number(e.target.value));
              }}
              className="w-full border rounded px-2 py-1.5 text-sm"
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-[160px]">
            <label className="block text-xs text-gray-500">Desde</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setManualRange(true);
                const nextFrom = e.target.value;
                setFromDate(nextFrom);
                syncSelectionFromRange(nextFrom, toDate);
              }}
              className="w-full border rounded px-2 py-1.5 text-sm"
            />
          </div>
          <div className="min-w-[160px]">
            <label className="block text-xs text-gray-500">Hasta</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setManualRange(true);
                const nextTo = e.target.value;
                setToDate(nextTo);
                syncSelectionFromRange(fromDate, nextTo);
              }}
              className="w-full border rounded px-2 py-1.5 text-sm"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white border rounded p-6 text-center">Cargando…</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {infoMessage ? (
            <div className="md:col-span-2 xl:col-span-3 bg-gray-50 border rounded p-3 text-sm text-gray-700">
              {infoMessage}
            </div>
          ) : null}
          <div className="bg-white border rounded p-4">
            <p className="text-sm text-gray-500">Total de remisiones</p>
            <p className="text-3xl font-semibold">{fmtCurrency(kpi.totalRemisiones)}</p>
            <p className="text-xs text-gray-600 mt-1">Total de ventas generadas, cobradas o pendientes de cobro.</p>
          </div>
          <div className="bg-white border rounded p-4">
            <p className="text-sm text-gray-500">Remisiones cobradas</p>
            <p className="text-3xl font-semibold">{fmtCurrency(kpi.remisionesCobradas)}</p>
            <p className="text-xs text-gray-600 mt-1">Suma de anticipos cobrados de las remisiones.</p>
          </div>
          <div className="bg-white border rounded p-4">
            <p className="text-sm text-gray-500">Costos (insumos)</p>
            <p className="text-3xl font-semibold">{fmtCurrency(kpi.costosInsumos)}</p>
            <p className="text-xs text-gray-600 mt-1">Costo de insumos usados en todas las remisiones.</p>
          </div>
          <div className="bg-white border rounded p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-gray-500">Gastos operativos</p>
                <p className="text-3xl font-semibold">{fmtCurrency(kpi.gastosOperativos)}</p>
                <p className="text-xs text-gray-600 mt-1">Gastos del negocio que no incluyen insumos ni costos de productos.</p>
              </div>
              <Link
                href="/dashboard/gastos"
                className="inline-flex items-center rounded border border-[var(--boho-primary)] px-3 py-1 text-sm font-medium text-[var(--boho-primary)] hover:bg-[var(--boho-primary)] hover:text-white"
              >
                Registrar gasto
              </Link>
            </div>
          </div>
          <div className="bg-white border rounded p-4">
            <p className="text-sm text-gray-500">Utilidad neta (remisiones)</p>
            <p className="text-3xl font-semibold">{fmtCurrency(utilidadNetaRemisiones)}</p>
            <p className="text-xs text-gray-600 mt-1">Total de remisiones menos costos de insumos.</p>
          </div>
          <div className="bg-white border rounded p-4">
            <p className="text-sm text-gray-500">Ganancia real (cobrada)</p>
            <p className="text-3xl font-semibold">{fmtCurrency(utilidadEnCaja)}</p>
            <p className="text-xs text-gray-600 mt-1">Ganancia obtenida únicamente de las remisiones ya cobradas, descontando su costo de insumos (no se restan gastos operativos). Dinero realmente ganado.</p>
          </div>
          <div className="bg-white border rounded p-4">
            <p className="text-sm text-gray-500">Margen (%)</p>
            <p className="text-3xl font-semibold">{margen.toFixed(1)}%</p>
            <p className="text-xs text-gray-600 mt-1">Margen de ganancia sobre ventas generadas.</p>
          </div>
          <div className="bg-white border rounded p-4">
            <p className="text-sm text-gray-500">Producto más vendido (global)</p>
            <p className="text-xs text-gray-600 mb-3">Histórico de remisiones activas, sin filtrar fechas.</p>
            {topProduct ? (
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-gray-900">{topProduct.name}</span>
                <span className="text-gray-700">Cantidad: {topProduct.quantity}</span>
              </div>
            ) : (
              <p className="text-sm text-gray-600">Sin datos históricos.</p>
            )}
          </div>
          <div className="bg-white border rounded p-4">
            <p className="text-sm text-gray-500">Producto menos vendido (global)</p>
            <p className="text-xs text-gray-600 mb-3">Histórico de remisiones activas, sin filtrar fechas.</p>
            {bottomProduct ? (
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-gray-900">{bottomProduct.name}</span>
                <span className="text-gray-700">Cantidad: {bottomProduct.quantity}</span>
              </div>
            ) : (
              <p className="text-sm text-gray-600">Sin datos históricos.</p>
            )}
          </div>
        </div>
      )}

      {!loading && chartData.length ? (
        <div className="bg-white border rounded p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-gray-800">Ventas, costos y gastos (últimos meses)</h3>
          </div>
          <div className="mb-4 flex flex-wrap items-end gap-3">
            <div className="min-w-[140px]">
              <label className="block text-xs text-gray-500">Año</label>
              <select
                value={String(chartEndYear)}
                onChange={(e) => setChartEndYear(Number(e.target.value))}
                className="w-full border rounded px-2 py-1.5 text-sm"
              >
                {[2026, 2027, 2028, 2029, 2030, 2031].map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <div className="min-w-[140px]">
              <label className="block text-xs text-gray-500">Mes</label>
              <select
                value={String(chartEndMonth)}
                onChange={(e) => setChartEndMonth(Number(e.target.value))}
                className="w-full border rounded px-2 py-1.5 text-sm"
              >
                {monthLabels.map((label, idx) => (
                  <option key={label} value={idx}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => {
                    const [y, m] = String(value).split("-");
                    const monthIndex = Number(m) - 1;
                    const names = [
                      "enero",
                      "febrero",
                      "marzo",
                      "abril",
                      "mayo",
                      "junio",
                      "julio",
                      "agosto",
                      "septiembre",
                      "octubre",
                      "noviembre",
                      "diciembre",
                    ];
                    if (!Number.isFinite(monthIndex)) return String(value);
                    const label = names[Math.max(0, Math.min(11, monthIndex))];
                    return `${label} ${y}`;
                  }}
                />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => fmtCurrency(Number(v))} />
                <Tooltip
                  cursor={{ fill: "#f9fafb" }}
                  formatter={(value) => fmtCurrency(Number(value ?? 0))}
                  labelFormatter={(value) => {
                    const [y, m] = String(value).split("-");
                    const monthIndex = Number(m) - 1;
                    const names = [
                      "enero",
                      "febrero",
                      "marzo",
                      "abril",
                      "mayo",
                      "junio",
                      "julio",
                      "agosto",
                      "septiembre",
                      "octubre",
                      "noviembre",
                      "diciembre",
                    ];
                    if (!Number.isFinite(monthIndex)) return String(value);
                    const label = names[Math.max(0, Math.min(11, monthIndex))];
                    return `${label} ${y}`;
                  }}
                />
                <Legend formatter={(value) => value.charAt(0).toUpperCase() + value.slice(1)} />
                <Bar dataKey="ventas" name="Ventas" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="costos" name="Costos" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="gastos" name="Gastos" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : null}

      {!loading ? (
        <div>
          <Link
            href="/dashboard/analisis"
            className="inline-flex items-center gap-2 rounded border border-[var(--boho-primary)] px-3 py-1.5 text-sm font-medium text-[var(--boho-primary)] hover:bg-[var(--boho-primary)] hover:text-white"
          >
            Ver análisis financiero →
          </Link>
        </div>
      ) : null}

      {!loading && kpi.totalRemisiones > 0 ? (
        <div className="bg-gray-50 border rounded p-3 text-sm text-gray-700">
          Por cada $100 vendidos, te quedas con {fmtCurrency(netoPorCien)}.
        </div>
      ) : null}

      {!loading && kpi.totalRemisiones > 0 ? (
        <div className="bg-white border rounded p-3 text-sm text-gray-700">
          {monthOverMonthMessage}
        </div>
      ) : null}
    </div>
  );
}
