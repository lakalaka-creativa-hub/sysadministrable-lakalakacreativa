"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  BarChart,
  Bar,
} from "recharts";

const fmtCurrency = (value: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  }).format(value);

const parseNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const months = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const buildMonthRange = (year: number, month: number) => {
  const start = new Date(year, month, 1).toISOString().slice(0, 10);
  const end = new Date(year, month + 1, 0).toISOString().slice(0, 10);
  return { start, end };
};

const formatShortDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit" });
};

type Summary = {
  ventas: number;
  costos: number;
  gastos: number;
  utilidad: number;
  margen: number;
  tickets: number;
  ticketPromedio: number;
};

type CobranzaSummary = {
  cobrado: number;
  pendiente: number;
  anticipoPromedio: number;
  remisiones: number;
};

type MarginRow = {
  name: string;
  total: number;
  profit: number;
  margin: number;
};

const buildDelta = (current: number, prev: number | null) => {
  if (prev === null || prev === 0) {
    return { label: "Sin comparativo", className: "text-gray-400" };
  }
  const diff = ((current - prev) / prev) * 100;
  const sign = diff > 0 ? "+" : "";
  const className = diff >= 0 ? "text-green-700" : "text-red-600";
  return { label: `${sign}${diff.toFixed(2)}% vs mes anterior`, className };
};

export default function AnalisisPage() {
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const initialRange = buildMonthRange(today.getFullYear(), today.getMonth());
  const [fromDate, setFromDate] = useState(initialRange.start);
  const [toDate, setToDate] = useState(initialRange.end);
  const [manualRange, setManualRange] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [remisiones, setRemisiones] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [topClients, setTopClients] = useState<{ name: string; total: number }[]>([]);
  const [topProducts, setTopProducts] = useState<{ name: string; total: number; qty: number }[]>([]);
  const [yearSummary, setYearSummary] = useState<
    { month: string; ventas: number; costos: number; gastos: number; utilidad: number; margen: number }[]
  >([]);
  const [prevSummary, setPrevSummary] = useState<Summary | null>(null);
  const [cobranza, setCobranza] = useState<CobranzaSummary>({
    cobrado: 0,
    pendiente: 0,
    anticipoPromedio: 0,
    remisiones: 0,
  });
  const [topClientMargins, setTopClientMargins] = useState<MarginRow[]>([]);
  const [topProductMargins, setTopProductMargins] = useState<MarginRow[]>([]);

  useEffect(() => {
    if (manualRange) return;
    const range = buildMonthRange(selectedYear, selectedMonth);
    setFromDate(range.start);
    setToDate(range.end);
  }, [manualRange, selectedMonth, selectedYear]);

  const yearOptions = useMemo(() => {
    const base = today.getFullYear();
    return Array.from({ length: 7 }, (_, idx) => base - 5 + idx);
  }, [today]);

  useEffect(() => {
    let active = true;
    const loadData = async () => {
      setLoadingData(true);

      const { data: remData, error: remErr } = await supabase
        .from("remisiones")
        .select("id, folio, fecha, cliente, total, total_cost, anticipo, status, created_at")
        .gte("fecha", fromDate)
        .lte("fecha", toDate)
        .neq("status", "CANCELADA");

      if (!active) return;
      if (remErr) {
        alert("Error al cargar ventas: " + remErr.message);
        setLoadingData(false);
        return;
      }

      const { data: expData, error: expErr } = await supabase
        .from("expenses")
        .select("date, category, description, amount")
        .eq("active", true)
        .gte("date", fromDate)
        .lte("date", toDate);

      if (!active) return;
      if (expErr) {
        alert("Error al cargar gastos: " + expErr.message);
        setLoadingData(false);
        return;
      }

      const remList = remData || [];
      const expList = expData || [];
      setRemisiones(remList);
      setExpenses(expList);

      const buildSummary = (remListData: any[], expListData: any[]): Summary => {
        const ventas = remListData.reduce((acc, r) => acc + parseNumber(r.total), 0);
        const costos = remListData.reduce((acc, r) => acc + parseNumber(r.total_cost), 0);
        const gastos = expListData.reduce((acc, r) => acc + parseNumber(r.amount), 0);
        const utilidad = ventas - costos - gastos;
        const margen = ventas ? (utilidad / ventas) * 100 : 0;
        const tickets = remListData.length;
        const ticketPromedio = tickets ? ventas / tickets : 0;
        return { ventas, costos, gastos, utilidad, margen, tickets, ticketPromedio };
      };

      const prevFrom = new Date(selectedYear, selectedMonth - 1, 1)
        .toISOString()
        .slice(0, 10);
      const prevTo = new Date(selectedYear, selectedMonth, 0)
        .toISOString()
        .slice(0, 10);

      const { data: prevRem } = await supabase
        .from("remisiones")
        .select("total, total_cost, fecha, status")
        .gte("fecha", prevFrom)
        .lte("fecha", prevTo)
        .neq("status", "CANCELADA");

      const { data: prevExp } = await supabase
        .from("expenses")
        .select("amount, date")
        .eq("active", true)
        .gte("date", prevFrom)
        .lte("date", prevTo);

      setPrevSummary(buildSummary(prevRem || [], prevExp || []));

      const cobranzaTotal = remList.reduce(
        (acc, r) => acc + Math.min(parseNumber(r.anticipo), parseNumber(r.total)),
        0
      );
      const cobranzaPendiente = remList.reduce((acc, r) => {
        const total = parseNumber(r.total);
        const anticipo = parseNumber(r.anticipo);
        return acc + Math.max(total - anticipo, 0);
      }, 0);
      const anticipoPromedio = remList.length ? cobranzaTotal / remList.length : 0;

      setCobranza({
        cobrado: cobranzaTotal,
        pendiente: cobranzaPendiente,
        anticipoPromedio,
        remisiones: remList.length,
      });

      const clientMarginMap = new Map<string, { total: number; profit: number }>();
      remList.forEach((r) => {
        const name = r.cliente || "Venta mostrador";
        const total = parseNumber(r.total);
        const profit = total - parseNumber(r.total_cost);
        const current = clientMarginMap.get(name) || { total: 0, profit: 0 };
        current.total += total;
        current.profit += profit;
        clientMarginMap.set(name, current);
      });

      const clientMarginRows = Array.from(clientMarginMap.entries())
        .map(([name, data]) => ({
          name,
          total: data.total,
          profit: data.profit,
          margin: data.total ? (data.profit / data.total) * 100 : 0,
        }))
        .sort((a, b) => b.margin - a.margin)
        .slice(0, 6);

      setTopClientMargins(clientMarginRows);

      const yearStart = new Date(selectedYear, 0, 1).toISOString().slice(0, 10);
      const yearEnd = new Date(selectedYear, 11, 31).toISOString().slice(0, 10);

      const { data: remYear } = await supabase
        .from("remisiones")
        .select("fecha, total, total_cost, status")
        .gte("fecha", yearStart)
        .lte("fecha", yearEnd)
        .neq("status", "CANCELADA");

      const { data: expYear } = await supabase
        .from("expenses")
        .select("date, amount")
        .eq("active", true)
        .gte("date", yearStart)
        .lte("date", yearEnd);

      const yearMap = new Map<number, { ventas: number; costos: number; gastos: number }>();
      for (let i = 0; i < 12; i += 1) {
        yearMap.set(i, { ventas: 0, costos: 0, gastos: 0 });
      }

      (remYear || []).forEach((r: any) => {
        const date = new Date(r.fecha);
        if (Number.isNaN(date.getTime())) return;
        const bucket = yearMap.get(date.getMonth());
        if (!bucket) return;
        bucket.ventas += parseNumber(r.total);
        bucket.costos += parseNumber(r.total_cost);
      });

      (expYear || []).forEach((e: any) => {
        const date = new Date(e.date);
        if (Number.isNaN(date.getTime())) return;
        const bucket = yearMap.get(date.getMonth());
        if (!bucket) return;
        bucket.gastos += parseNumber(e.amount);
      });

      const yearRows = months.map((label, idx) => {
        const bucket = yearMap.get(idx) || { ventas: 0, costos: 0, gastos: 0 };
        const utilidad = bucket.ventas - bucket.costos - bucket.gastos;
        const margen = bucket.ventas ? (utilidad / bucket.ventas) * 100 : 0;
        return {
          month: label,
          ventas: bucket.ventas,
          costos: bucket.costos,
          gastos: bucket.gastos,
          utilidad,
          margen,
        };
      });

      setYearSummary(yearRows);

      const clientMap = new Map<string, number>();
      remList.forEach((r) => {
        const key = r.cliente || "Venta mostrador";
        clientMap.set(key, (clientMap.get(key) || 0) + parseNumber(r.total));
      });

      const clientRank = Array.from(clientMap.entries())
        .map(([name, total]) => ({ name, total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 6);

      setTopClients(clientRank);

      if (remList.length === 0) {
        setTopProducts([]);
        setLoadingData(false);
        return;
      }

      const ids = remList.map((r) => r.id);
      const { data: itemsData } = await supabase
        .from("remision_items")
        .select("product_name, quantity, subtotal, remision_id")
        .in("remision_id", ids);

      if (!active) return;

      const productMap = new Map<string, { total: number; qty: number }>();
      (itemsData || []).forEach((item: any) => {
        const name = item.product_name || "Producto";
        const current = productMap.get(name) || { total: 0, qty: 0 };
        current.total += parseNumber(item.subtotal);
        current.qty += parseNumber(item.quantity);
        productMap.set(name, current);
      });

      const remProfitMap = new Map<string, { profit: number; total: number }>();
      remList.forEach((r) => {
        const total = parseNumber(r.total);
        const profit = total - parseNumber(r.total_cost);
        remProfitMap.set(r.id, { profit, total });
      });

      const productMarginMap = new Map<string, { total: number; profit: number }>();
      (itemsData || []).forEach((item: any) => {
        const rem = remProfitMap.get(item.remision_id);
        if (!rem || rem.total <= 0) return;
        const subtotal = parseNumber(item.subtotal);
        const share = subtotal / rem.total;
        const profitShare = rem.profit * share;
        const name = item.product_name || "Producto";
        const current = productMarginMap.get(name) || { total: 0, profit: 0 };
        current.total += subtotal;
        current.profit += profitShare;
        productMarginMap.set(name, current);
      });

      const productMarginRows = Array.from(productMarginMap.entries())
        .map(([name, data]) => ({
          name,
          total: data.total,
          profit: data.profit,
          margin: data.total ? (data.profit / data.total) * 100 : 0,
        }))
        .sort((a, b) => b.margin - a.margin)
        .slice(0, 6);

      setTopProductMargins(productMarginRows);

      const productRank = Array.from(productMap.entries())
        .map(([name, data]) => ({ name, total: data.total, qty: data.qty }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 6);

      setTopProducts(productRank);
      setLoadingData(false);
    };

    loadData();
    return () => {
      active = false;
    };
  }, [fromDate, toDate, selectedYear]);

  const summary = useMemo(() => {
    const ventas = remisiones.reduce((acc, r) => acc + parseNumber(r.total), 0);
    const costos = remisiones.reduce((acc, r) => acc + parseNumber(r.total_cost), 0);
    const gastos = expenses.reduce((acc, r) => acc + parseNumber(r.amount), 0);
    const utilidad = ventas - costos - gastos;
    const margen = ventas ? (utilidad / ventas) * 100 : 0;
    const tickets = remisiones.length;
    const ticketPromedio = tickets ? ventas / tickets : 0;

    return {
      ventas,
      costos,
      gastos,
      utilidad,
      margen,
      tickets,
      ticketPromedio,
    };
  }, [remisiones, expenses]);

  const chartData = useMemo(() => {
    const byDate = new Map<string, { date: string; ventas: number; costos: number; gastos: number }>();

    remisiones.forEach((r) => {
      const dateKey = r.fecha || r.created_at || "";
      if (!dateKey) return;
      const entry = byDate.get(dateKey) || { date: dateKey, ventas: 0, costos: 0, gastos: 0 };
      entry.ventas += parseNumber(r.total);
      entry.costos += parseNumber(r.total_cost);
      byDate.set(dateKey, entry);
    });

    expenses.forEach((e) => {
      const dateKey = e.date || "";
      if (!dateKey) return;
      const entry = byDate.get(dateKey) || { date: dateKey, ventas: 0, costos: 0, gastos: 0 };
      entry.gastos += parseNumber(e.amount);
      byDate.set(dateKey, entry);
    });

    return Array.from(byDate.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((item) => ({
        ...item,
        utilidad: item.ventas - item.costos - item.gastos,
        label: formatShortDate(item.date),
      }));
  }, [remisiones, expenses]);

  const ventasDelta = buildDelta(summary.ventas, prevSummary?.ventas ?? null);
  const utilidadDelta = buildDelta(summary.utilidad, prevSummary?.utilidad ?? null);
  const gastosDelta = buildDelta(summary.gastos, prevSummary?.gastos ?? null);
  const ticketDelta = buildDelta(summary.ticketPromedio, prevSummary?.ticketPromedio ?? null);

  const heatmap = useMemo(() => {
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const firstDay = new Date(selectedYear, selectedMonth, 1).getDay();
    const salesByDay = new Map<number, number>();

    remisiones.forEach((r) => {
      const dateValue = r.fecha || r.created_at || "";
      const date = new Date(dateValue);
      if (Number.isNaN(date.getTime())) return;
      if (date.getMonth() !== selectedMonth || date.getFullYear() !== selectedYear) return;
      const day = date.getDate();
      salesByDay.set(day, (salesByDay.get(day) || 0) + parseNumber(r.total));
    });

    const cells: { day: number | null; value: number }[] = [];
    for (let i = 0; i < firstDay; i += 1) {
      cells.push({ day: null, value: 0 });
    }
    for (let day = 1; day <= daysInMonth; day += 1) {
      cells.push({ day, value: salesByDay.get(day) || 0 });
    }

    const maxValue = Math.max(0, ...cells.map((c) => c.value));
    return { cells, maxValue };
  }, [remisiones, selectedMonth, selectedYear]);

  const heatmapColor = (value: number) => {
    if (!heatmap.maxValue || value <= 0) return "#f3f4f6";
    const ratio = Math.min(1, value / heatmap.maxValue);
    const alpha = 0.15 + ratio * 0.75;
    return `rgba(201, 124, 93, ${alpha})`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Analisis financiero</h1>
        <p className="text-sm text-gray-600">Indicadores, tendencias y rankings del negocio</p>
      </div>

      <div className="bg-white border rounded p-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <label className="text-xs text-gray-500 space-y-1">
            <span>Mes</span>
            <select
              value={selectedMonth}
              onChange={(e) => {
                setManualRange(false);
                setSelectedMonth(Number(e.target.value));
              }}
              className="w-full rounded border px-2 py-1.5 text-sm text-gray-800"
            >
              {months.map((label, idx) => (
                <option key={label} value={idx}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-gray-500 space-y-1">
            <span>Año</span>
            <select
              value={selectedYear}
              onChange={(e) => {
                setManualRange(false);
                setSelectedYear(Number(e.target.value));
              }}
              className="w-full rounded border px-2 py-1.5 text-sm text-gray-800"
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-gray-500 space-y-1">
            <span>Desde</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setManualRange(true);
                setFromDate(e.target.value);
              }}
              className="w-full rounded border px-2 py-1.5 text-sm text-gray-800"
            />
          </label>
          <label className="text-xs text-gray-500 space-y-1">
            <span>Hasta</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setManualRange(true);
                setToDate(e.target.value);
              }}
              className="w-full rounded border px-2 py-1.5 text-sm text-gray-800"
            />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white border rounded p-4">
          <p className="text-xs text-gray-500">Ventas</p>
          <p className="text-2xl font-semibold">{fmtCurrency(summary.ventas)}</p>
          <p className={`text-xs ${ventasDelta.className}`}>{ventasDelta.label}</p>
          <p className="text-xs text-gray-400">Tickets: {summary.tickets}</p>
        </div>
        <div className="bg-white border rounded p-4">
          <p className="text-xs text-gray-500">Utilidad</p>
          <p className="text-2xl font-semibold text-green-700">{fmtCurrency(summary.utilidad)}</p>
          <p className={`text-xs ${utilidadDelta.className}`}>{utilidadDelta.label}</p>
          <p className="text-xs text-gray-400">Margen: {summary.margen.toFixed(2)}%</p>
        </div>
        <div className="bg-white border rounded p-4">
          <p className="text-xs text-gray-500">Costos</p>
          <p className="text-2xl font-semibold">{fmtCurrency(summary.costos)}</p>
          <p className={`text-xs ${ticketDelta.className}`}>{ticketDelta.label}</p>
          <p className="text-xs text-gray-400">Ticket prom.: {fmtCurrency(summary.ticketPromedio)}</p>
        </div>
        <div className="bg-white border rounded p-4">
          <p className="text-xs text-gray-500">Gastos</p>
          <p className="text-2xl font-semibold text-red-600">{fmtCurrency(summary.gastos)}</p>
          <p className={`text-xs ${gastosDelta.className}`}>{gastosDelta.label}</p>
          <p className="text-xs text-gray-400">Periodo seleccionado</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="bg-white border rounded p-4 xl:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Calendario de ventas</h3>
            <span className="text-xs text-gray-500">Intensidad por dia</span>
          </div>
          <div className="mt-4 grid grid-cols-7 gap-2 text-xs text-gray-500">
            {["D", "L", "M", "M", "J", "V", "S"].map((d, idx) => (
              <div key={`${d}-${idx}`} className="text-center">
                {d}
              </div>
            ))}
          </div>
          <div className="mt-2 grid grid-cols-7 gap-2">
            {heatmap.cells.map((cell, idx) => {
              if (!cell.day) {
                return <div key={`empty-${idx}`} className="h-8" />;
              }
              const label = new Date(selectedYear, selectedMonth, cell.day).toLocaleDateString("es-MX");
              return (
                <div
                  key={cell.day}
                  title={`${label} • ${fmtCurrency(cell.value)}`}
                  className="h-8 rounded"
                  style={{ backgroundColor: heatmapColor(cell.value) }}
                />
              );
            })}
          </div>
        </div>

        <div className="bg-white border rounded p-4 space-y-3">
          <h3 className="font-semibold">Cobranza</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Cobrado</span>
              <span className="font-semibold">{fmtCurrency(cobranza.cobrado)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Pendiente</span>
              <span className="font-semibold text-red-600">{fmtCurrency(cobranza.pendiente)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Anticipo promedio</span>
              <span className="font-semibold">{fmtCurrency(cobranza.anticipoPromedio)}</span>
            </div>
            <div className="text-xs text-gray-400">
              Remisiones: {cobranza.remisiones}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white border rounded p-4">
          <h3 className="font-semibold">Margen por cliente</h3>
          {loadingData ? (
            <p className="text-sm text-gray-500 mt-3">Cargando...</p>
          ) : topClientMargins.length === 0 ? (
            <p className="text-sm text-gray-500 mt-3">Sin datos en el periodo.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {topClientMargins.map((row) => (
                <div key={row.name} className="flex items-center justify-between text-sm">
                  <div>
                    <div className="text-gray-700">{row.name}</div>
                    <div className="text-xs text-gray-400">Ventas: {fmtCurrency(row.total)}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-green-700">{row.margin.toFixed(2)}%</div>
                    <div className="text-xs text-gray-400">{fmtCurrency(row.profit)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border rounded p-4">
          <h3 className="font-semibold">Margen por producto</h3>
          {loadingData ? (
            <p className="text-sm text-gray-500 mt-3">Cargando...</p>
          ) : topProductMargins.length === 0 ? (
            <p className="text-sm text-gray-500 mt-3">Sin datos en el periodo.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {topProductMargins.map((row) => (
                <div key={row.name} className="flex items-center justify-between text-sm">
                  <div>
                    <div className="text-gray-700">{row.name}</div>
                    <div className="text-xs text-gray-400">Ventas: {fmtCurrency(row.total)}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-green-700">{row.margin.toFixed(2)}%</div>
                    <div className="text-xs text-gray-400">{fmtCurrency(row.profit)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="bg-white border rounded p-4 xl:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Tendencia del mes</h3>
            <span className="text-xs text-gray-500">Ventas / Gastos / Utilidad</span>
          </div>
          <div className="h-72">
            {loadingData ? (
              <p className="text-sm text-gray-500 mt-4">Cargando grafica...</p>
            ) : chartData.length === 0 ? (
              <p className="text-sm text-gray-500 mt-4">No hay datos en este periodo.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 12, right: 16, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="label" fontSize={12} />
                  <YAxis fontSize={12} tickFormatter={(value) => `$${value}`} />
                  <Tooltip formatter={(value: any) => fmtCurrency(Number(value))} />
                  <Legend />
                  <Line type="monotone" dataKey="ventas" stroke="#c97c5d" strokeWidth={2} name="Ventas" />
                  <Line type="monotone" dataKey="gastos" stroke="#ef4444" strokeWidth={2} name="Gastos" />
                  <Line type="monotone" dataKey="utilidad" stroke="#16a34a" strokeWidth={2} name="Utilidad" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-white border rounded p-4">
          <h3 className="font-semibold">Top clientes</h3>
          {loadingData ? (
            <p className="text-sm text-gray-500 mt-3">Cargando...</p>
          ) : topClients.length === 0 ? (
            <p className="text-sm text-gray-500 mt-3">Sin ventas en el periodo.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {topClients.map((client) => (
                <div key={client.name} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{client.name}</span>
                  <span className="font-semibold">{fmtCurrency(client.total)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="bg-white border rounded p-4 xl:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Top productos</h3>
            <span className="text-xs text-gray-500">Por ventas</span>
          </div>
          {loadingData ? (
            <p className="text-sm text-gray-500 mt-3">Cargando...</p>
          ) : topProducts.length === 0 ? (
            <p className="text-sm text-gray-500 mt-3">Sin productos en el periodo.</p>
          ) : (
            <div className="h-64 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProducts} margin={{ top: 8, right: 16, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="name" hide />
                  <YAxis tickFormatter={(value) => `$${value}`} fontSize={12} />
                  <Tooltip formatter={(value: any) => fmtCurrency(Number(value))} />
                  <Bar dataKey="total" name="Ventas" fill="#7a8f7a" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="bg-white border rounded p-4">
          <h3 className="font-semibold">Detalle top productos</h3>
          {loadingData ? (
            <p className="text-sm text-gray-500 mt-3">Cargando...</p>
          ) : topProducts.length === 0 ? (
            <p className="text-sm text-gray-500 mt-3">Sin datos.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {topProducts.map((product) => (
                <div key={product.name} className="flex items-center justify-between text-sm">
                  <div>
                    <div className="text-gray-700">{product.name}</div>
                    <div className="text-xs text-gray-400">{product.qty} unidades</div>
                  </div>
                  <span className="font-semibold">{fmtCurrency(product.total)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white border rounded p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Resumen financiero por mes</h3>
          <span className="text-xs text-gray-500">Año {selectedYear}</span>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2">Mes</th>
                <th className="py-2">Ventas</th>
                <th className="py-2">Costos</th>
                <th className="py-2">Gastos</th>
                <th className="py-2">Utilidad</th>
                <th className="py-2">Margen</th>
              </tr>
            </thead>
            <tbody>
              {yearSummary.map((row) => (
                <tr key={row.month} className="border-b last:border-b-0">
                  <td className="py-2 font-medium">{row.month}</td>
                  <td className="py-2">{fmtCurrency(row.ventas)}</td>
                  <td className="py-2">{fmtCurrency(row.costos)}</td>
                  <td className="py-2">{fmtCurrency(row.gastos)}</td>
                  <td className="py-2 text-green-700">{fmtCurrency(row.utilidad)}</td>
                  <td className="py-2">{row.margen.toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
