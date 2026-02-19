"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Expense = {
  id: string;
  date: string;
  category: string;
  subcategory: string | null;
  description: string | null;
  amount: number;
};

export default function GastosPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const today = new Date().toISOString().slice(0, 10);
  const defaultFromDate = "2026-01-01";
  const [fromDate, setFromDate] = useState(defaultFromDate);
  const [toDate, setToDate] = useState(today);
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const [categoryFilter, setCategoryFilter] = useState("Todas");
  const [totalFiltered, setTotalFiltered] = useState(0);
  const [form, setForm] = useState({
    date: today,
    category: "Publicidad",
    subcategory: "",
    description: "",
    amount: "",
  });

  const monthLabels = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const yearOptions = Array.from({ length: 5 }, (_, i) => selectedYear - 2 + i);

  const buildMonthRange = (year: number, month: number) => {
    const start = new Date(year, month, 1).toISOString().slice(0, 10);
    const end = new Date(year, month + 1, 0).toISOString().slice(0, 10);
    return { start, end };
  };

  const resetForm = () => {
    setForm({
      date: today,
      category: "Publicidad",
      subcategory: "",
      description: "",
      amount: "",
    });
    setEditingId(null);
  };

  const loadExpenses = async () => {
    setLoading(true);
    let query = supabase
      .from("expenses")
      .select("id, date, category, subcategory, description, amount")
      .eq("active", true)
      .gte("date", fromDate)
      .lte("date", toDate)
      .order("date", { ascending: false });

    if (categoryFilter !== "Todas") {
      query = query.eq("category", categoryFilter);
    }

    const { data, error } = await query;

    if (error) {
      console.error(error);
    }

    const rows = data || [];
    setExpenses(rows);
    const total = rows.reduce((acc, r) => acc + Number(r.amount || 0), 0);
    setTotalFiltered(total);
    setLoading(false);
  };

  useEffect(() => {
    loadExpenses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromDate, toDate, categoryFilter]);

  useEffect(() => {
    const range = buildMonthRange(selectedYear, selectedMonth);
    setFromDate(range.start);
    setToDate(range.end);
  }, [selectedMonth, selectedYear]);

  const handleSave = async () => {
    if (!form.date || !form.category || !form.amount) {
      alert("Completa fecha, categoría y monto");
      return;
    }
    const amountNumber = Number(form.amount);
    if (Number.isNaN(amountNumber) || amountNumber <= 0) {
      alert("El monto debe ser mayor a 0");
      return;
    }

    setSaving(true);
    const payload = {
      date: form.date,
      category: form.category,
      subcategory: form.subcategory?.trim() || null,
      description: form.description?.trim() || null,
      amount: amountNumber,
      active: true,
    };

    let error;
    if (editingId) {
      ({ error } = await supabase.from("expenses").update(payload).eq("id", editingId));
    } else {
      ({ error } = await supabase.from("expenses").insert([payload]));
    }

    if (error) {
      alert("Error al guardar: " + error.message);
      setSaving(false);
      return;
    }

    resetForm();
    setShowForm(false);
    await loadExpenses();
    setSaving(false);
  };

  const startEdit = (expense: Expense) => {
    setForm({
      date: expense.date,
      category: expense.category,
      subcategory: expense.subcategory || "",
      description: expense.description || "",
      amount: expense.amount.toString(),
    });
    setEditingId(expense.id);
    setShowForm(true);
  };

  const handleDelete = async (expense: Expense) => {
    const confirmed = window.confirm("¿Eliminar este gasto?\nSe marcará como inactivo.");
    if (!confirmed) return;
    const { error } = await supabase.from("expenses").update({ active: false }).eq("id", expense.id);
    if (error) {
      alert("Error al eliminar: " + error.message);
      return;
    }
    await loadExpenses();
    if (editingId === expense.id) {
      resetForm();
      setShowForm(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Gastos</h1>
          <p className="text-sm text-muted-foreground">Registro de gastos operativos y publicidad</p>
        </div>
        <button
          type="button"
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="inline-flex items-center rounded border border-[var(--boho-primary)] bg-[var(--boho-primary)] px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
        >
          + Nuevo gasto
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 bg-white border rounded p-3 text-sm">
        <label className="space-y-1 text-gray-700">
          <span>Mes</span>
          <select
            value={String(selectedMonth)}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="w-full rounded border px-3 py-2"
          >
            {monthLabels.map((label, idx) => (
              <option key={label} value={idx}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-gray-700">
          <span>Año</span>
          <select
            value={String(selectedYear)}
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
        <label className="space-y-1 text-gray-700">
          <span>Fecha desde</span>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="w-full rounded border px-3 py-2"
          />
        </label>
        <label className="space-y-1 text-gray-700">
          <span>Fecha hasta</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="w-full rounded border px-3 py-2"
          />
        </label>
        <label className="space-y-1 text-gray-700">
          <span>Categoría</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full rounded border px-3 py-2"
          >
            <option value="Todas">Todas</option>
            <option value="Publicidad">Publicidad</option>
            <option value="Operativo">Operativo</option>
            <option value="Servicios">Servicios</option>
            <option value="Otros">Otros</option>
          </select>
        </label>
        <div className="flex items-end justify-end text-gray-800 font-medium">
          Total filtrado: ${totalFiltered.toFixed(2)}
        </div>
      </div>

      {showForm ? (
        <div className="bg-white border rounded p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <label className="text-sm text-gray-700 space-y-1">
              <span>Fecha</span>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full rounded border px-3 py-2"
              />
            </label>
            <label className="text-sm text-gray-700 space-y-1">
              <span>Categoría</span>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full rounded border px-3 py-2"
              >
                <option value="Publicidad">Publicidad</option>
                <option value="Operativo">Operativo</option>
                <option value="Servicios">Servicios</option>
                <option value="Otros">Otros</option>
              </select>
            </label>
            <label className="text-sm text-gray-700 space-y-1">
              <span>Subcategoría</span>
              <input
                type="text"
                value={form.subcategory}
                onChange={(e) => setForm({ ...form, subcategory: e.target.value })}
                placeholder="Ej. Redes sociales"
                className="w-full rounded border px-3 py-2"
              />
            </label>
            <label className="text-sm text-gray-700 space-y-1 md:col-span-2 lg:col-span-2">
              <span>Descripción</span>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Detalle breve"
                className="w-full rounded border px-3 py-2"
              />
            </label>
            <label className="text-sm text-gray-700 space-y-1">
              <span>Monto</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full rounded border px-3 py-2"
              />
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                resetForm();
                setShowForm(false);
              }}
              className="rounded border border-[var(--boho-primary)] px-3 py-1.5 text-sm text-[var(--boho-primary)] hover:bg-[var(--boho-primary)] hover:text-white"
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="rounded bg-[var(--boho-primary)] px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
              disabled={saving}
            >
              {saving ? "Guardando..." : editingId ? "Guardar cambios" : "Guardar"}
            </button>
          </div>
        </div>
      ) : null}

      {loading ? (
        <div>Cargando...</div>
      ) : expenses.length === 0 ? (
        <div className="text-sm text-gray-500">Aún no hay gastos registrados.</div>
      ) : (
        <div className="bg-white border rounded">
          <table className="w-full text-sm">
            <thead className="border-b">
              <tr>
                <th className="p-2 text-left">Fecha</th>
                <th className="p-2 text-left">Categoría</th>
                <th className="p-2 text-left">Descripción</th>
                <th className="p-2 text-right">Monto</th>
                <th className="p-2 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) => (
                <tr key={e.id} className="border-b last:border-0">
                  <td className="p-2">{e.date}</td>
                  <td className="p-2">{e.category}</td>
                  <td className="p-2">{e.description || "-"}</td>
                  <td className="p-2 text-right">
                    ${e.amount.toFixed(2)}
                  </td>
                  <td className="p-2 text-right">
                    <div className="inline-flex items-center gap-2 text-sm">
                      <button
                        type="button"
                        onClick={() => startEdit(e)}
                        className="text-[var(--boho-primary)] hover:underline"
                      >
                        ✏️
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(e)}
                        className="text-[var(--boho-secondary)] hover:underline"
                      >
                        ❌
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
