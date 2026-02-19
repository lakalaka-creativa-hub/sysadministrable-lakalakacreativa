"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import JSZip from "jszip";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useBranding } from "@/components/branding-provider";

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

const downloadCsv = (fileName: string, content: string) => {
  const blob = new Blob(["\uFEFF", content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const downloadBlob = (fileName: string, blob: Blob) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const escapeCsv = (val: string) => `"${val.replace(/"/g, '""')}"`;

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

const hexToRgb = (hex: string, fallback: [number, number, number]) => {
  const clean = hex.replace("#", "").trim();
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    if (Number.isFinite(r) && Number.isFinite(g) && Number.isFinite(b)) return [r, g, b] as [number, number, number];
    return fallback;
  }
  if (clean.length === 6) {
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    if (Number.isFinite(r) && Number.isFinite(g) && Number.isFinite(b)) return [r, g, b] as [number, number, number];
    return fallback;
  }
  return fallback;
};

export default function ReportesPage() {
  const { branding } = useBranding();
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number | null>(today.getMonth());
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const initialRange = buildMonthRange(today.getFullYear(), today.getMonth());
  const [fromDate, setFromDate] = useState(initialRange.start);
  const [toDate, setToDate] = useState(initialRange.end);
  const [exporting, setExporting] = useState(false);
  const [exportingVentas, setExportingVentas] = useState(false);
  const [exportingGastos, setExportingGastos] = useState(false);
  const [exportingClientes, setExportingClientes] = useState(false);
  const [exportingResumenMensual, setExportingResumenMensual] = useState(false);
  const [exportingTodo, setExportingTodo] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingCartera, setExportingCartera] = useState(false);

  useEffect(() => {
    if (selectedMonth === null) {
      const start = new Date(selectedYear, 0, 1).toISOString().slice(0, 10);
      const end = new Date(selectedYear, 11, 31).toISOString().slice(0, 10);
      setFromDate(start);
      setToDate(end);
      return;
    }
    const range = buildMonthRange(selectedYear, selectedMonth);
    setFromDate(range.start);
    setToDate(range.end);
  }, [selectedMonth, selectedYear]);

  const yearOptions = useMemo(() => {
    const base = today.getFullYear();
    return Array.from({ length: 7 }, (_, idx) => base - 5 + idx);
  }, [today]);

  const buildYearSummary = async () => {
    const yearStart = new Date(selectedYear, 0, 1).toISOString().slice(0, 10);
    const yearEnd = new Date(selectedYear, 11, 31).toISOString().slice(0, 10);

    const { data: remYear, error: remErr } = await supabase
      .from("remisiones")
      .select("fecha, total, total_cost, status")
      .gte("fecha", yearStart)
      .lte("fecha", yearEnd)
      .neq("status", "CANCELADA");

    if (remErr) {
      alert("Error al calcular ventas/costos: " + remErr.message);
      return null;
    }

    const { data: expYear, error: expErr } = await supabase
      .from("expenses")
      .select("date, amount")
      .eq("active", true)
      .gte("date", yearStart)
      .lte("date", yearEnd);

    if (expErr) {
      alert("Error al calcular gastos: " + expErr.message);
      return null;
    }

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

    return months.map((label, idx) => {
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
  };

  const buildResumenPeriodo = async () => {
    const { data: remisiones, error: remErr } = await supabase
      .from("remisiones")
      .select("id, cliente, total, total_cost, anticipo, fecha, status")
      .gte("fecha", fromDate)
      .lte("fecha", toDate)
      .neq("status", "CANCELADA");

    if (remErr) {
      alert("Error al calcular ventas/costos: " + remErr.message);
      return null;
    }

    const { data: expenses, error: expErr } = await supabase
      .from("expenses")
      .select("amount, date")
      .eq("active", true)
      .gte("date", fromDate)
      .lte("date", toDate);

    if (expErr) {
      alert("Error al calcular gastos: " + expErr.message);
      return null;
    }

    const ventas = remisiones?.reduce((acc, r) => acc + Number((r as any).total), 0) || 0;
    const costos = remisiones?.reduce((acc, r) => acc + Number((r as any).total_cost), 0) || 0;
    const gastos = expenses?.reduce((acc, r) => acc + Number((r as any).amount), 0) || 0;
    const utilidad = ventas - costos - gastos;
    const margen = ventas ? (utilidad / ventas) * 100 : 0;

    return {
      ventas,
      costos,
      gastos,
      utilidad,
      margen,
      remisiones: remisiones || [],
    };
  };

  const buildResumenCsv = async () => {
    const data = await buildResumenPeriodo();
    if (!data) return null;

    const periodo = `${fromDate} a ${toDate}`;
    const headers = ["Periodo", "Ventas", "Costos", "Gastos", "Utilidad", "Margen"];
    const row = [
      periodo,
      fmtCurrency(data.ventas),
      fmtCurrency(data.costos),
      fmtCurrency(data.gastos),
      fmtCurrency(data.utilidad),
      `${data.margen.toFixed(2)}%`,
    ];

    const csv = `${headers.map(escapeCsv).join(",")}\n${row.map(escapeCsv).join(",")}`;
    return { fileName: `resumen-financiero-${fromDate}-a-${toDate}.csv`, csv };
  };

  const buildVentasCsv = async () => {
    const { data, error } = await supabase
      .from("remisiones")
      .select("folio, fecha, cliente, total, total_cost, status")
      .gte("fecha", fromDate)
      .lte("fecha", toDate)
      .neq("status", "CANCELADA");

    if (error) {
      alert("Error al obtener ventas: " + error.message);
      return null;
    }

    const headers = ["Folio", "Fecha", "Cliente", "Total", "Costo", "Utilidad", "Status"];
    const rows = (data || []).map((r: any) => {
      const total = Number(r.total) || 0;
      const costo = Number(r.total_cost) || 0;
      const utilidad = total - costo;
      return [
        r.folio ?? "",
        r.fecha ?? "",
        r.cliente ?? "",
        fmtCurrency(total),
        fmtCurrency(costo),
        fmtCurrency(utilidad),
        r.status ?? "",
      ].map((v) => escapeCsv(String(v))).join(",");
    });

    const csv = `${headers.map(escapeCsv).join(",")}\n${rows.join("\n")}`;
    return { fileName: `ventas-${fromDate}-a-${toDate}.csv`, csv };
  };

  const buildGastosCsv = async () => {
    const { data, error } = await supabase
      .from("expenses")
      .select("date, category, description, amount")
      .eq("active", true)
      .gte("date", fromDate)
      .lte("date", toDate);

    if (error) {
      alert("Error al obtener gastos: " + error.message);
      return null;
    }

    const headers = ["Fecha", "Categoría", "Descripción", "Monto"];
    const rows = (data || []).map((r: any) => {
      const monto = Number(r.amount) || 0;
      return [r.date ?? "", r.category ?? "", r.description ?? "", fmtCurrency(monto)]
        .map((v) => escapeCsv(String(v)))
        .join(",");
    });

    const csv = `${headers.map(escapeCsv).join(",")}\n${rows.join("\n")}`;
    return { fileName: `gastos-${fromDate}-a-${toDate}.csv`, csv };
  };

  const buildResumenMensualCsv = async () => {
    const rows = await buildYearSummary();
    if (!rows) return null;

    const headers = ["Mes", "Ventas", "Costos", "Gastos", "Utilidad", "Margen"];
    const csvRows = rows.map((row) => [
      row.month,
      fmtCurrency(row.ventas),
      fmtCurrency(row.costos),
      fmtCurrency(row.gastos),
      fmtCurrency(row.utilidad),
      `${row.margen.toFixed(2)}%`,
    ].map((v) => escapeCsv(String(v))).join(","));

    const csv = `${headers.map(escapeCsv).join(",")}\n${csvRows.join("\n")}`;
    return { fileName: `resumen-mensual-${selectedYear}.csv`, csv };
  };

  const buildClientesCsv = async () => {
    const { data, error } = await supabase
      .from("clientes")
      .select("nombre, telefono, correo, direccion, colonia, ciudad, estado, codigo_postal, canal, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      alert("Error al exportar clientes: " + error.message);
      return null;
    }

    const headers = [
      "Nombre",
      "Telefono",
      "Correo",
      "Direccion",
      "Colonia",
      "Ciudad",
      "Estado",
      "Codigo postal",
      "Canal",
      "Fecha de alta",
    ];

    const rows = (data || []).map((c: any) => [
      c.nombre ?? "",
      c.telefono ?? "",
      c.correo ?? "",
      c.direccion ?? "",
      c.colonia ?? "",
      c.ciudad ?? "",
      c.estado ?? "",
      c.codigo_postal ?? "",
      c.canal ?? "",
      c.created_at ?? "",
    ].map((v) => escapeCsv(String(v))).join(","));

    const csv = `${headers.map(escapeCsv).join(",")}\n${rows.join("\n")}`;
    const monthLabel = selectedMonth === null
      ? "todos"
      : String(selectedMonth + 1).padStart(2, "0");
    return { fileName: `clientes-${selectedYear}-${monthLabel}.csv`, csv };
  };

  const buildCarteraCsv = async () => {
    const { data, error } = await supabase
      .from("remisiones")
      .select("folio, fecha, cliente, telefono, total, anticipo, status")
      .gte("fecha", fromDate)
      .lte("fecha", toDate)
      .neq("status", "CANCELADA");

    if (error) {
      alert("Error al obtener cartera vencida: " + error.message);
      return null;
    }

    const rowsData = (data || []).filter((r: any) => {
      const total = parseNumber(r.total);
      const anticipo = parseNumber(r.anticipo);
      return total - anticipo > 0;
    });

    const headers = ["Folio", "Fecha", "Cliente", "Telefono", "Total", "Anticipo", "Pendiente"];
    const rows = rowsData.map((r: any) => {
      const total = parseNumber(r.total);
      const anticipo = parseNumber(r.anticipo);
      const pendiente = Math.max(total - anticipo, 0);
      return [
        r.folio ?? "",
        r.fecha ?? "",
        r.cliente ?? "",
        r.telefono ?? "",
        fmtCurrency(total),
        fmtCurrency(anticipo),
        fmtCurrency(pendiente),
      ].map((v) => escapeCsv(String(v))).join(",");
    });

    const csv = `${headers.map(escapeCsv).join(",")}\n${rows.join("\n")}`;
    return { fileName: `cartera-vencida-${fromDate}-a-${toDate}.csv`, csv };
  };

  const handleExportResumen = async () => {
    setExporting(true);
    const result = await buildResumenCsv();
    if (result) downloadCsv(result.fileName, result.csv);
    setExporting(false);
  };

  const handleExportVentas = async () => {
    setExportingVentas(true);
    const result = await buildVentasCsv();
    if (result) downloadCsv(result.fileName, result.csv);
    setExportingVentas(false);
  };

  const handleExportGastos = async () => {
    setExportingGastos(true);
    const result = await buildGastosCsv();
    if (result) downloadCsv(result.fileName, result.csv);
    setExportingGastos(false);
  };

  const handleExportResumenMensual = async () => {
    if (exportingResumenMensual) return;
    setExportingResumenMensual(true);
    const result = await buildResumenMensualCsv();
    if (result) downloadCsv(result.fileName, result.csv);
    setExportingResumenMensual(false);
  };

  const handleExportClientes = async () => {
    if (exportingClientes) return;
    setExportingClientes(true);
    const result = await buildClientesCsv();
    if (result) downloadCsv(result.fileName, result.csv);
    setExportingClientes(false);
  };

  const handleExportCartera = async () => {
    if (exportingCartera) return;
    setExportingCartera(true);
    const result = await buildCarteraCsv();
    if (result) downloadCsv(result.fileName, result.csv);
    setExportingCartera(false);
  };

  const handleExportPdfResumen = async () => {
    if (exportingPdf) return;
    setExportingPdf(true);

    const resumen = await buildResumenPeriodo();
    if (!resumen) {
      setExportingPdf(false);
      return;
    }

    const yearSummary = await buildYearSummary();
    const remList = resumen.remisiones || [];
    const cobranzaTotal = remList.reduce(
      (acc: number, r: any) => acc + Math.min(parseNumber(r.anticipo), parseNumber(r.total)),
      0
    );
    const cobranzaPendiente = remList.reduce((acc: number, r: any) => {
      const total = parseNumber(r.total);
      const anticipo = parseNumber(r.anticipo);
      return acc + Math.max(total - anticipo, 0);
    }, 0);
    const anticipoPromedio = remList.length ? cobranzaTotal / remList.length : 0;

    const clientMap = new Map<string, { total: number; profit: number }>();
    remList.forEach((r: any) => {
      const name = r.cliente || "Venta mostrador";
      const total = parseNumber(r.total);
      const profit = total - parseNumber(r.total_cost);
      const current = clientMap.get(name) || { total: 0, profit: 0 };
      current.total += total;
      current.profit += profit;
      clientMap.set(name, current);
    });

    const topClients = Array.from(clientMap.entries())
      .map(([name, data]) => ({
        name,
        total: data.total,
        profit: data.profit,
        margin: data.total ? (data.profit / data.total) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);

    const remIdList = remList.map((r: any) => r.id).filter(Boolean);
    const remMap = new Map<string, { total: number; profit: number }>();
    remList.forEach((r: any) => {
      if (!r.id) return;
      const total = parseNumber(r.total);
      const profit = total - parseNumber(r.total_cost);
      remMap.set(r.id, { total, profit });
    });

    let topProducts: { name: string; total: number; profit: number; margin: number }[] = [];
    if (remIdList.length) {
      const { data: items } = await supabase
        .from("remision_items")
        .select("remision_id, product_name, subtotal")
        .in("remision_id", remIdList);

      const productMap = new Map<string, { total: number; profit: number }>();
      (items || []).forEach((item: any) => {
        const name = item.product_name || "Producto";
        const subtotal = parseNumber(item.subtotal);
        const rem = remMap.get(item.remision_id);
        if (!rem || rem.total <= 0) return;
        const profitShare = rem.profit * (subtotal / rem.total);
        const current = productMap.get(name) || { total: 0, profit: 0 };
        current.total += subtotal;
        current.profit += profitShare;
        productMap.set(name, current);
      });

      topProducts = Array.from(productMap.entries())
        .map(([name, data]) => ({
          name,
          total: data.total,
          profit: data.profit,
          margin: data.total ? (data.profit / data.total) * 100 : 0,
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 6);
    }

    const doc = new jsPDF("p", "mm", "letter");
    const logoDataUrl = await getLogoDataUrl(branding.logoUrl || "");
    const COLORS = {
      primary: hexToRgb(branding.pdfPrimary, [37, 99, 235]),
      primaryDark: hexToRgb(branding.pdfPrimaryDark, [30, 64, 175]),
      accent: hexToRgb(branding.pdfAccent, [147, 197, 253]),
      soft: hexToRgb(branding.pdfSoft, [248, 250, 252]),
      text: hexToRgb(branding.pdfText, [17, 24, 39]),
      textLight: hexToRgb(branding.pdfTextLight, [107, 114, 128]),
      border: hexToRgb(branding.pdfBorder, [229, 231, 235]),
    };

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const addHeader = () => {
      doc.setFillColor(...COLORS.primary);
      doc.rect(0, 0, pageWidth, 8, "F");
      doc.setFillColor(...COLORS.soft);
      doc.rect(0, 8, pageWidth, 24, "F");

      if (logoDataUrl) {
        try {
          doc.addImage(logoDataUrl, "PNG", 12, 12, 16, 16);
        } catch {
          // ignore logo errors
        }
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(...COLORS.text);
      doc.text("Reporte financiero ejecutivo", 32, 19);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...COLORS.textLight);
      const brandName = branding.businessName || "";
      const contact = [branding.contactPhone, branding.contactEmail].filter(Boolean).join(" | ");
      if (brandName) doc.text(brandName, 32, 24);
      if (contact) doc.text(contact, 32, 28);

      doc.setTextColor(...COLORS.textLight);
      doc.text(`Periodo: ${fromDate} a ${toDate}`, pageWidth - 80, 24);
      return 36;
    };

    const ensureSpace = (y: number, minHeight: number) => {
      if (y + minHeight > pageHeight - 12) {
        doc.addPage();
        return addHeader();
      }
      return y;
    };

    let cursorY = addHeader();

    autoTable(doc, {
      startY: cursorY,
      head: [["Ventas", "Costos", "Gastos", "Utilidad", "Margen"]],
      body: [[
        fmtCurrency(resumen.ventas),
        fmtCurrency(resumen.costos),
        fmtCurrency(resumen.gastos),
        fmtCurrency(resumen.utilidad),
        `${resumen.margen.toFixed(2)}%`,
      ]],
      styles: { fontSize: 9, textColor: COLORS.text },
      headStyles: { fillColor: COLORS.primary, textColor: [255, 255, 255] },
    });

    cursorY = (doc as any).lastAutoTable.finalY + 4;
    autoTable(doc, {
      startY: cursorY,
      head: [["Cobrado", "Pendiente", "Anticipo prom.", "Remisiones"]],
      body: [[
        fmtCurrency(cobranzaTotal),
        fmtCurrency(cobranzaPendiente),
        fmtCurrency(anticipoPromedio),
        String(remList.length),
      ]],
      styles: { fontSize: 8.5, textColor: COLORS.text },
      headStyles: { fillColor: COLORS.primaryDark, textColor: [255, 255, 255] },
    });

    cursorY = (doc as any).lastAutoTable.finalY + 4;
    const gastosMap = new Map<string, number>();
    const { data: expList } = await supabase
      .from("expenses")
      .select("category, amount, date")
      .eq("active", true)
      .gte("date", fromDate)
      .lte("date", toDate);
    (expList || []).forEach((e: any) => {
      const key = e.category || "Sin categoria";
      gastosMap.set(key, (gastosMap.get(key) || 0) + parseNumber(e.amount));
    });
    const gastosRows = Array.from(gastosMap.entries())
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);

    cursorY = ensureSpace(cursorY, 24);
    if (gastosRows.length) {
      autoTable(doc, {
        startY: cursorY,
        head: [["Gastos por categoria", "Monto"]],
        body: gastosRows.map((g) => [g.category, fmtCurrency(g.total)]),
        styles: { fontSize: 8.5, textColor: COLORS.text },
        headStyles: { fillColor: COLORS.accent, textColor: COLORS.text },
        columnStyles: { 1: { halign: "right" } },
      });
      cursorY = (doc as any).lastAutoTable.finalY + 4;
    }

    const carteraRows = remList
      .map((r: any) => {
        const total = parseNumber(r.total);
        const anticipo = parseNumber(r.anticipo);
        const pendiente = Math.max(total - anticipo, 0);
        return {
          folio: r.folio || "",
          cliente: r.cliente || "Venta mostrador",
          pendiente,
        };
      })
      .filter((r: any) => r.pendiente > 0)
      .sort((a: any, b: any) => b.pendiente - a.pendiente)
      .slice(0, 10);

    cursorY = ensureSpace(cursorY, 28);
    if (carteraRows.length) {
      autoTable(doc, {
        startY: cursorY,
        head: [["Cartera vencida (top)", "Cliente", "Pendiente"]],
        body: carteraRows.map((c: any) => [c.folio, c.cliente, fmtCurrency(c.pendiente)]),
        styles: { fontSize: 8.5, textColor: COLORS.text },
        headStyles: { fillColor: COLORS.primaryDark, textColor: [255, 255, 255] },
        columnStyles: { 2: { halign: "right" } },
      });
      cursorY = (doc as any).lastAutoTable.finalY + 6;
    }

    cursorY = ensureSpace(cursorY, 60);
    const chartStartY = cursorY;
    if (yearSummary && yearSummary.length) {
      doc.setFontSize(9);
      doc.setTextColor(...COLORS.text);
      doc.text(`Resumen mensual ${selectedYear}`, 14, chartStartY);

      const chartX = 14;
      const chartY = chartStartY + 4;
      const chartW = 182;
      const chartH = 50;
      const maxValue = Math.max(
        ...yearSummary.map((m) => Math.max(m.ventas, m.costos, m.gastos))
      );

      doc.setDrawColor(...COLORS.border);
      doc.rect(chartX, chartY, chartW, chartH);

      const groupW = chartW / 12;
      const barW = Math.min(4, groupW / 4);
      yearSummary.forEach((row, idx) => {
        const baseX = chartX + idx * groupW + 2;
        const scale = maxValue ? chartH / maxValue : 0;

        const ventasH = row.ventas * scale;
        doc.setFillColor(...COLORS.primary);
        doc.rect(baseX, chartY + chartH - ventasH, barW, ventasH, "F");

        const costosH = row.costos * scale;
        doc.setFillColor(...COLORS.accent);
        doc.rect(baseX + barW + 1, chartY + chartH - costosH, barW, costosH, "F");

        const gastosH = row.gastos * scale;
        doc.setFillColor(...COLORS.primaryDark);
        doc.rect(baseX + (barW + 1) * 2, chartY + chartH - gastosH, barW, gastosH, "F");

        doc.setFontSize(7);
        doc.setTextColor(...COLORS.textLight);
        const label = months[idx].slice(0, 3);
        doc.text(label, baseX, chartY + chartH + 4);
      });
    }

    doc.addPage();
    cursorY = addHeader();
    doc.setFontSize(11);
    doc.setTextColor(...COLORS.text);
    doc.text("Top clientes", 14, cursorY);
    autoTable(doc, {
      startY: cursorY + 4,
      head: [["Cliente", "Ventas", "Utilidad", "Margen"]],
      body: topClients.map((c) => [
        c.name,
        fmtCurrency(c.total),
        fmtCurrency(c.profit),
        `${c.margin.toFixed(2)}%`,
      ]),
      styles: { fontSize: 8.5, textColor: COLORS.text },
      headStyles: { fillColor: COLORS.primary, textColor: [255, 255, 255] },
    });

    const afterClientsY = (doc as any).lastAutoTable.finalY + 6;
    doc.setFontSize(11);
    doc.setTextColor(...COLORS.text);
    doc.text("Top productos", 14, afterClientsY);
    autoTable(doc, {
      startY: afterClientsY + 4,
      head: [["Producto", "Ventas", "Utilidad", "Margen"]],
      body: topProducts.map((p) => [
        p.name,
        fmtCurrency(p.total),
        fmtCurrency(p.profit),
        `${p.margin.toFixed(2)}%`,
      ]),
      styles: { fontSize: 8.5, textColor: COLORS.text },
      headStyles: { fillColor: COLORS.primaryDark, textColor: [255, 255, 255] },
    });

    if (yearSummary && yearSummary.length) {
      const afterProductsY = (doc as any).lastAutoTable.finalY + 6;
      doc.setFontSize(11);
      doc.text(`Resumen mensual ${selectedYear}`, 14, afterProductsY);
      autoTable(doc, {
        startY: afterProductsY + 4,
        head: [["Mes", "Ventas", "Costos", "Gastos", "Utilidad", "Margen"]],
        body: yearSummary.map((row) => [
          row.month,
          fmtCurrency(row.ventas),
          fmtCurrency(row.costos),
          fmtCurrency(row.gastos),
          fmtCurrency(row.utilidad),
          `${row.margen.toFixed(2)}%`,
        ]),
        styles: { fontSize: 8, textColor: COLORS.text },
        headStyles: { fillColor: COLORS.primary, textColor: [255, 255, 255] },
      });
    }

    doc.save(`reporte-ejecutivo-${fromDate}-a-${toDate}.pdf`);
    setExportingPdf(false);
  };

  const handleExportAll = async () => {
    if (exportingTodo) return;
    setExportingTodo(true);

    const zip = new JSZip();
    const results = await Promise.all([
      buildResumenCsv(),
      buildVentasCsv(),
      buildGastosCsv(),
      buildResumenMensualCsv(),
      buildClientesCsv(),
      buildCarteraCsv(),
    ]);

    results.forEach((result) => {
      if (result) {
        zip.file(result.fileName, `\uFEFF${result.csv}`);
      }
    });

    const blob = await zip.generateAsync({ type: "blob" });
    const monthLabel = selectedMonth === null
      ? "todos"
      : String(selectedMonth + 1).padStart(2, "0");
    downloadBlob(
      `reportes-${selectedYear}-${monthLabel}.zip`,
      blob
    );

    setExportingTodo(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Reportes financieros</h1>
        <p className="text-sm text-gray-600">Exportaciones directas de ventas, gastos, clientes y resumen</p>
      </div>

      <div className="bg-white border rounded p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <label className="text-sm text-gray-700 space-y-1">
              <span>Mes</span>
              <select
                value={selectedMonth === null ? "ALL" : String(selectedMonth)}
                onChange={(e) => {
                  const value = e.target.value;
                  setSelectedMonth(value === "ALL" ? null : Number(value));
                }}
                className="w-full rounded border px-3 py-2"
              >
                <option value="ALL">Todos</option>
                {months.map((label, idx) => (
                  <option key={label} value={idx}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm text-gray-700 space-y-1">
              <span>Año</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-full rounded border px-3 py-2"
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm text-gray-700 space-y-1">
              <span>Desde</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full rounded border px-3 py-2"
              />
            </label>
            <label className="text-sm text-gray-700 space-y-1">
              <span>Hasta</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full rounded border px-3 py-2"
              />
            </label>
        </div>

        <div className="flex flex-wrap gap-2 justify-start">
          <button
            type="button"
            onClick={handleExportAll}
            disabled={exportingTodo}
            className="rounded bg-[var(--boho-primary)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {exportingTodo ? "Exportando..." : "Exportar todo (ZIP)"}
          </button>
          <button
            type="button"
            onClick={handleExportPdfResumen}
            disabled={exportingPdf}
            className="rounded border border-[var(--boho-primary)] px-4 py-2 text-sm font-medium text-[var(--boho-primary)] hover:bg-[var(--boho-primary)] hover:text-white disabled:opacity-50"
          >
            {exportingPdf ? "Exportando..." : "Exportar PDF ejecutivo"}
          </button>
          <button
            type="button"
            onClick={handleExportResumen}
            disabled={exporting}
            className="rounded border border-[var(--boho-primary)] px-4 py-2 text-sm font-medium text-[var(--boho-primary)] hover:bg-[var(--boho-primary)] hover:text-white disabled:opacity-50"
          >
            {exporting ? "Exportando..." : "Exportar resumen financiero"}
          </button>
          <button
            type="button"
            onClick={handleExportVentas}
            disabled={exportingVentas}
            className="rounded border border-[var(--boho-primary)] px-4 py-2 text-sm font-medium text-[var(--boho-primary)] hover:bg-[var(--boho-primary)] hover:text-white disabled:opacity-50"
          >
            {exportingVentas ? "Exportando..." : "Exportar ventas"}
          </button>
          <button
            type="button"
            onClick={handleExportGastos}
            disabled={exportingGastos}
            className="rounded border border-[var(--boho-primary)] px-4 py-2 text-sm font-medium text-[var(--boho-primary)] hover:bg-[var(--boho-primary)] hover:text-white disabled:opacity-50"
          >
            {exportingGastos ? "Exportando..." : "Exportar gastos"}
          </button>
          <button
            type="button"
            onClick={handleExportResumenMensual}
            disabled={exportingResumenMensual}
            className="rounded border border-[var(--boho-primary)] px-4 py-2 text-sm font-medium text-[var(--boho-primary)] hover:bg-[var(--boho-primary)] hover:text-white disabled:opacity-50"
          >
            {exportingResumenMensual ? "Exportando..." : "Exportar resumen mensual"}
          </button>
          <button
            type="button"
            onClick={handleExportCartera}
            disabled={exportingCartera}
            className="rounded border border-[var(--boho-primary)] px-4 py-2 text-sm font-medium text-[var(--boho-primary)] hover:bg-[var(--boho-primary)] hover:text-white disabled:opacity-50"
          >
            {exportingCartera ? "Exportando..." : "Exportar cartera vencida"}
          </button>
          <button
            type="button"
            onClick={handleExportClientes}
            disabled={exportingClientes}
            className="rounded border border-[var(--boho-primary)] px-4 py-2 text-sm font-medium text-[var(--boho-primary)] hover:bg-[var(--boho-primary)] hover:text-white disabled:opacity-50"
          >
            {exportingClientes ? "Exportando..." : "Exportar clientes"}
          </button>
        </div>
      </div>
    </div>
  );
}
