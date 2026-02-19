"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Product = {
  id: string;
  name: string;
  price: number;
};

type Client = {
  id: string;
  nombre: string;
  telefono: string | null;
  correo: string | null;
  direccion: string | null;
  colonia: string | null;
  ciudad: string | null;
  estado: string | null;
  codigo_postal: string | null;
};

type Item = {
  id?: string;
  product_id?: string;
  product_name: string;
  price: number;
  quantity: number;
  subtotal: number;
};

type CotizacionStatus = "ABIERTA" | "CANCELADA" | "CONVERTIDA";

export default function EditarCotizacionPage() {
  const params = useParams();
  const router = useRouter();

  const [folio, setFolio] = useState("");
  const [cliente, setCliente] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [fecha, setFecha] = useState("");
  const [status, setStatus] = useState<CotizacionStatus>("ABIERTA");
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false);
  const [activeClientIndex, setActiveClientIndex] = useState(0);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [initialState, setInitialState] = useState<string>("");

  const isLocked = status !== "ABIERTA";

  useEffect(() => {
    loadData();
  }, [params.id]);

  const loadData = async () => {
    const { data: productsData } = await supabase
      .from("products")
      .select("id, name, price")
      .eq("active", true)
      .order("name");

    setProducts(productsData || []);

    const { data: clientsData } = await supabase
      .from("clientes")
      .select("id, nombre, telefono, correo, direccion, colonia, ciudad, estado, codigo_postal")
      .order("nombre");

    setClients(clientsData || []);

    const { data: cotizacion } = await supabase
      .from("cotizaciones")
      .select("*")
      .eq("id", params.id)
      .single();

    if (cotizacion) {
      setFolio(cotizacion.folio);
      setCliente(cotizacion.cliente || "");
      setSelectedClientId(cotizacion.cliente_id || null);
      setTelefono(cotizacion.telefono || "");
      setDireccion(cotizacion.direccion || "");
      setFecha(cotizacion.fecha);
      setStatus(cotizacion.status || "ABIERTA");
    }

    const { data: itemsData } = await supabase
      .from("cotizacion_items")
      .select("*")
      .eq("cotizacion_id", params.id);

    setItems(itemsData || []);
    const snapshot = JSON.stringify({
      folio: cotizacion?.folio || "",
      cliente: cotizacion?.cliente || "",
      cliente_id: cotizacion?.cliente_id || null,
      telefono: cotizacion?.telefono || "",
      direccion: cotizacion?.direccion || "",
      fecha: cotizacion?.fecha || "",
      items: itemsData || [],
    });
    setInitialState(snapshot);
    setLoading(false);
  };

  useEffect(() => {
    if (!cliente.trim() || clients.length === 0) return;
    const match = clients.find(
      (c) => c.nombre.toLowerCase() === cliente.trim().toLowerCase()
    );
    if (match) setSelectedClientId(match.id);
  }, [cliente, clients]);

  const formatClientAddress = (client: Client) => {
    const parts = [
      client.direccion,
      client.colonia,
      client.ciudad,
      client.estado,
    ].filter(Boolean);

    if (client.codigo_postal) {
      parts.push(`CP ${client.codigo_postal}`);
    }

    return parts.join(", ");
  };

  const applyClient = (client: Client | null) => {
    if (!client) {
      setSelectedClientId(null);
      return;
    }

    setSelectedClientId(client.id);
    setCliente(client.nombre);
    setTelefono(client.telefono || "");
    setDireccion(formatClientAddress(client));
  };

  const clearClientSelection = () => {
    setSelectedClientId(null);
    setTelefono("");
    setDireccion("");
  };

  const filterValue = cliente.trim().toLowerCase();
  const filteredClients = filterValue
    ? clients.filter((c) => {
        const nameMatch = c.nombre.toLowerCase().includes(filterValue);
        const phoneMatch = (c.telefono || "").toLowerCase().includes(filterValue);
        return nameMatch || phoneMatch;
      })
    : clients;
  const displayClients = filteredClients.length > 0 ? filteredClients : clients;
  const showNoMatches = filterValue.length > 0 && filteredClients.length === 0;

  const handleClientSelect = (client: Client) => {
    applyClient(client);
    setClientDropdownOpen(false);
    setActiveClientIndex(0);
  };

  const handleClientKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!clientDropdownOpen && event.key === "ArrowDown") {
      setClientDropdownOpen(true);
      return;
    }

    if (!clientDropdownOpen) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveClientIndex((prev) =>
        Math.min(prev + 1, Math.max(displayClients.length - 1, 0))
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveClientIndex((prev) => Math.max(prev - 1, 0));
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const picked = displayClients[activeClientIndex];
      if (picked) handleClientSelect(picked);
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setClientDropdownOpen(false);
    }
  };

  const renderClientName = (name: string) => {
    if (!filterValue) return name;
    const idx = name.toLowerCase().indexOf(filterValue);
    if (idx === -1) return name;
    const before = name.slice(0, idx);
    const match = name.slice(idx, idx + filterValue.length);
    const after = name.slice(idx + filterValue.length);
    return (
      <span>
        {before}
        <span className="font-semibold text-[var(--boho-primary)]">{match}</span>
        {after}
      </span>
    );
  };

  const clearClient = () => {
    setSelectedClientId(null);
    setCliente("");
    setTelefono("");
    setDireccion("");
    setClientDropdownOpen(false);
  };

  const addProductItem = (product: Product) => {
    setItems((prev) => [
      ...prev,
      {
        product_id: product.id,
        product_name: product.name,
        price: product.price,
        quantity: 1,
        subtotal: product.price,
      },
    ]);
  };

  const addManualItem = () => {
    setItems((prev) => [
      ...prev,
      { product_name: "", price: 0, quantity: 1, subtotal: 0 },
    ]);
  };

  const updateItem = (index: number, field: keyof Item, value: any) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;

        if (field === "price" || field === "quantity") {
          const nextPrice = field === "price" ? Number(value) : item.price;
          const nextQuantity = field === "quantity" ? Number(value) : item.quantity;
          return {
            ...item,
            price: nextPrice,
            quantity: nextQuantity,
            subtotal: nextPrice * nextQuantity,
          };
        }

        if (field === "product_name") {
          return { ...item, product_name: value };
        }

        return item;
      })
    );
  };

  const removeItem = (index: number) => {
    if (!confirm("¿Eliminar este producto?")) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const total = items.reduce((sum, i) => sum + i.subtotal, 0);

  const hasChanges =
    initialState !==
    JSON.stringify({
      folio,
      cliente,
      cliente_id: selectedClientId,
      telefono,
      direccion,
      fecha,
      items,
    });

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!hasChanges) return;
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasChanges]);

  const saveCotizacion = async () => {
    if (isLocked) {
      alert("No se puede modificar una cotizacion cerrada");
      return;
    }

    if (saving) return;
    const snapshotItems = [...items];

    if (!cliente.trim()) return alert("El cliente es obligatorio");
    if (snapshotItems.some((i) => !i.product_name.trim())) {
      return alert("Todos los productos deben tener nombre");
    }
    if (!snapshotItems.length) return alert("No puedes guardar una cotizacion sin productos");

    setSaving(true);

    try {
      const { error: cotError } = await supabase
        .from("cotizaciones")
        .update({
          folio,
          cliente: cliente || "Venta mostrador",
          cliente_id: selectedClientId,
          telefono: telefono || null,
          direccion: direccion || null,
          fecha,
          total,
        })
        .eq("id", params.id);

      if (cotError) {
        alert("Error al actualizar: " + cotError.message);
        setSaving(false);
        return;
      }

      const { error: deleteError } = await supabase
        .from("cotizacion_items")
        .delete()
        .eq("cotizacion_id", params.id as string);

      if (deleteError) {
        alert("Error eliminando items previos: " + deleteError.message);
        setSaving(false);
        return;
      }

      const { error: insertError } = await supabase
        .from("cotizacion_items")
        .insert(
          snapshotItems.map((item) => ({
            cotizacion_id: params.id as string,
            product_id: item.product_id ?? null,
            product_name: item.product_name,
            price: item.price,
            quantity: item.quantity,
            subtotal: item.subtotal,
          }))
        );

      if (insertError) {
        alert("Error insertando items: " + insertError.message);
        throw insertError;
      }

      alert("Cotizacion actualizada correctamente");
      router.push("/dashboard/cotizaciones");
    } catch {
      alert("Error inesperado al guardar");
    } finally {
      setSaving(false);
    }
  };

  const cancelarCotizacion = async () => {
    if (status !== "ABIERTA") return;
    if (!confirm("¿Cancelar esta cotizacion?")) return;
    await supabase.from("cotizaciones").update({ status: "CANCELADA" }).eq("id", params.id);
    setStatus("CANCELADA");
  };

  if (loading) return <p>Cargando...</p>;

  return (
    <div className="space-y-6">
      {status === "CANCELADA" && (
        <div className="mb-4 p-3 rounded border border-red-200 bg-red-50 text-red-700 text-sm">
          Esta cotizacion esta <strong>CANCELADA</strong>. El contenido es de solo lectura.
        </div>
      )}
      {status === "CONVERTIDA" && (
        <div className="mb-4 p-3 rounded border border-blue-200 bg-blue-50 text-blue-700 text-sm">
          Esta cotizacion ya fue <strong>CONVERTIDA</strong>.
        </div>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Editar cotizacion</h1>
        <div className="flex gap-2">
          <button
            onClick={() => router.push("/dashboard/cotizaciones")}
            className="px-4 py-2 rounded border border-[var(--boho-primary)] text-[var(--boho-primary)] hover:bg-[var(--boho-primary)] hover:text-white"
          >
            ← Regresar
          </button>
          <button
            onClick={cancelarCotizacion}
            disabled={status !== "ABIERTA"}
            className="px-4 py-2 rounded border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            Cancelar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm mb-1">Folio</label>
          <input
            disabled={isLocked}
            value={folio}
            onChange={(e) => setFolio(e.target.value)}
            className="border p-2 rounded w-full"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Fecha</label>
          <input
            type="date"
            disabled={isLocked}
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="border p-2 rounded w-full"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm mb-2 font-medium">Datos del cliente</label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="relative">
              <input
                disabled={isLocked}
                value={cliente}
                onChange={(e) => {
                  const value = e.target.value;
                  setCliente(value);
                  setClientDropdownOpen(true);
                  setActiveClientIndex(0);
                  const match = clients.find(
                    (c) => c.nombre.toLowerCase() === value.toLowerCase()
                  );
                  if (match) {
                    applyClient(match);
                  } else if (selectedClientId) {
                    clearClientSelection();
                  }
                }}
                onFocus={() => {
                  if (!isLocked) setClientDropdownOpen(true);
                }}
                onBlur={() => {
                  window.setTimeout(() => setClientDropdownOpen(false), 150);
                  const match = clients.find(
                    (c) => c.nombre.toLowerCase() === cliente.trim().toLowerCase()
                  );
                  if (match) applyClient(match);
                }}
                onKeyDown={handleClientKeyDown}
                placeholder="Cliente"
                className="border p-2 rounded w-full"
              />
              {clientDropdownOpen && clients.length > 0 && !isLocked && (
                <div className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded border bg-white shadow">
                  {showNoMatches && (
                    <div className="px-3 py-2 text-xs text-gray-500">
                      Sin coincidencias, mostrando todos.
                    </div>
                  )}
                  {displayClients.map((c, index) => (
                    <button
                      key={c.id}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleClientSelect(c)}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 ${
                        index === activeClientIndex ? "bg-gray-50" : ""
                      }`}
                    >
                      {renderClientName(c.nombre)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <input
            disabled={isLocked}
            value={telefono}
            onChange={(e) => {
              const value = e.target.value;
              setTelefono(value);
              const inputDigits = value.replace(/\D+/g, "");
              if (!inputDigits) return;
              const match = clients.find((c) => {
                const phoneDigits = (c.telefono || "").replace(/\D+/g, "");
                return phoneDigits && phoneDigits === inputDigits;
              });
              if (match) applyClient(match);
            }}
            placeholder="Telefono"
            className="border p-2 rounded"
          />
          <input
            disabled={isLocked}
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
            placeholder="Direccion"
            className="border p-2 rounded"
          />
        </div>
        {selectedClientId && (
          <p className="text-xs text-gray-500 mt-2">
            Cliente seleccionado: datos cargados automaticamente.
          </p>
        )}
        <div className="mt-2">
          <button
            type="button"
            disabled={isLocked}
            onClick={clearClient}
            className="px-3 py-2 rounded border border-[var(--boho-secondary)] text-[var(--boho-secondary)] hover:bg-[var(--boho-secondary)] hover:text-white disabled:opacity-50"
          >
            Limpiar cliente
          </button>
        </div>
      </div>

      <div className="flex gap-4">
        <select
          disabled={isLocked}
          onChange={(e) => {
            const p = products.find((x) => x.id === e.target.value);
            if (p) addProductItem(p);
            e.target.value = "";
          }}
          className="border p-2 rounded"
          defaultValue=""
        >
          <option value="" disabled>
            Agregar producto del catalogo
          </option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} - ${p.price}
            </option>
          ))}
        </select>

        <button
          onClick={addManualItem}
          disabled={isLocked}
          className="px-4 py-2 rounded border border-[var(--boho-primary)] text-[var(--boho-primary)] hover:bg-[var(--boho-primary)] hover:text-white disabled:opacity-50"
        >
          + Manual
        </button>
      </div>

      <table className="w-full border bg-white">
        <thead className="bg-gray-50">
          <tr>
            <th className="p-2 text-left">Producto</th>
            <th className="p-2 text-right">Precio</th>
            <th className="p-2 text-center">Cantidad</th>
            <th className="p-2 text-right">Subtotal</th>
            <th className="p-2"></th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={idx} className="border-t">
              <td className="p-2">
                <input
                  disabled={isLocked}
                  value={item.product_name}
                  onChange={(e) => updateItem(idx, "product_name", e.target.value)}
                  className="border p-1 rounded w-full"
                />
              </td>
              <td className="p-2">
                <input
                  type="number"
                  disabled={isLocked}
                  value={item.price}
                  onChange={(e) => updateItem(idx, "price", Number(e.target.value))}
                  className="border p-1 rounded w-20 text-right"
                />
              </td>
              <td className="p-2 text-center">
                <input
                  type="number"
                  disabled={isLocked}
                  value={item.quantity}
                  onChange={(e) => updateItem(idx, "quantity", Number(e.target.value))}
                  className="border p-1 rounded w-16 text-center"
                  min="1"
                />
              </td>
              <td className="p-2 text-right">${item.subtotal.toFixed(2)}</td>
              <td className="p-2">
                <button
                  onClick={() => removeItem(idx)}
                  disabled={isLocked}
                  className="px-3 py-1 rounded bg-[var(--boho-secondary)] text-white text-sm hover:opacity-90 disabled:opacity-50"
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-end">
        <div className="bg-gray-50 border rounded-lg p-4 w-64 space-y-3">
          <div className="flex justify-between text-lg">
            <span>Total:</span>
            <span className="font-bold">${total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button
          onClick={() => router.push("/dashboard/cotizaciones")}
          className="px-6 py-2 rounded border border-[var(--boho-primary)] text-[var(--boho-primary)] hover:bg-[var(--boho-primary)] hover:text-white"
        >
          Cancelar
        </button>
        <button
          onClick={saveCotizacion}
          disabled={saving || isLocked}
          className="px-6 py-2 rounded bg-[var(--boho-primary)] text-white hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Guardando..." : "Guardar"}
        </button>
      </div>
    </div>
  );
}
