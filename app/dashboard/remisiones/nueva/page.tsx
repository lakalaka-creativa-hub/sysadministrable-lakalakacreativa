"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

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
  product_id?: string;
  description: string;
  price: number;
  quantity: number;
};

export default function NuevaRemisionPage() {
  const router = useRouter();

  const [folio, setFolio] = useState("");
  const [cliente, setCliente] = useState("Venta mostrador");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [anticipo, setAnticipo] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false);
  const [activeClientIndex, setActiveClientIndex] = useState(0);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const paymentOptions = [
    { value: "", label: "Sin pago" },
    { value: "Efectivo", label: "Efectivo" },
    { value: "Transferencia", label: "Transferencia" },
    { value: "Terminal", label: "Terminal" },
    { value: "Link de pago", label: "Link de pago" },
    { value: "Cheque", label: "Cheque" },
    { value: "Otros", label: "Otros" },
  ];

  /* ===============================
     CARGA INICIAL
  =============================== */
  useEffect(() => {
    if (!initialized) {
      loadProducts();
      loadClients();
      generateFolio();
      setInitialized(true);
    }
  }, [initialized]);

  const loadProducts = async () => {
    const { data } = await supabase
      .from("products")
      .select("id, name, price")
      .eq("active", true)
      .order("name");

    setProducts(data || []);
  };

  const loadClients = async () => {
    const { data } = await supabase
      .from("clientes")
      .select("id, nombre, telefono, correo, direccion, colonia, ciudad, estado, codigo_postal")
      .order("nombre");

    setClients(data || []);
  };

  const generateFolio = async () => {
    const { count } = await supabase
      .from("remisiones")
      .select("*", { count: "exact", head: true });

    const next = (count ?? 0) + 1;
    setFolio(`A${String(next).padStart(3, "0")}`);
  };

  /* ===============================
     ITEMS
  =============================== */
  const addProductItem = (product: Product) => {
    setItems([
      ...items,
      {
        product_id: product.id,
        description: product.name,
        price: product.price,
        quantity: 1,
      },
    ]);
  };

  const addManualItem = () => {
    setItems([
      ...items,
      { description: "", price: 0, quantity: 1 },
    ]);
  };

  const updateItem = (index: number, field: keyof Item, value: any) => {
    const copy = [...items];
    copy[index] = { ...copy[index], [field]: value };
    setItems(copy);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const total = items.reduce(
    (sum, i) => sum + i.price * i.quantity,
    0
  );

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

  /* ===============================
     GUARDAR
  =============================== */
  const saveRemision = async () => {
    if (!cliente.trim()) return alert("El cliente es obligatorio");
    if (!items.length) return alert("Agrega al menos un producto");
    if (loading) return; // Prevenir doble clic

    setLoading(true);

    let totalCost = 0;
    for (const item of items) {
      if (!item.product_id) continue;
      const { data, error } = await supabase.rpc("get_product_cost", {
        p_product_id: item.product_id,
      });
      if (error) {
        console.error("Error obteniendo costo:", error.message);
        continue;
      }
      const unitCost = Number(data ?? 0);
      totalCost += unitCost * Number(item.quantity || 0);
    }

    // Fecha local (corrige desfase de zona horaria)
    const now = new Date();
    const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 10);

    const paymentMethodValue = anticipo > 0 ? paymentMethod : "";

    const { data: remision, error } = await supabase
      .from("remisiones")
      .insert({
        folio,
        cliente: cliente || "Venta mostrador",
        cliente_id: selectedClientId,
        telefono: telefono || null,
        direccion: direccion || null,
        fecha: localDate,
        total,
        total_cost: totalCost,
        anticipo,
        payment_method: paymentMethodValue || null,
        status: "ACTIVA",
      })
      .select()
      .single();

    if (error) {
      setLoading(false);
      return alert("Error creando remisión: " + error.message);
    }

    if (!remision) {
      setLoading(false);
      return alert("No se pudo crear la remisión");
    }

    const rows = items.map((i) => ({
      remision_id: remision.id,
      product_id: i.product_id ?? null,
      product_name: i.description,
      price: i.price,
      quantity: i.quantity,
      subtotal: i.price * i.quantity,
    }));

    const { error: itemsError } = await supabase
      .from("remision_items")
      .insert(rows);

    if (itemsError) {
      console.error("Error guardando items:", itemsError);
      alert("Error guardando productos: " + itemsError.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard/remisiones");
  };

  /* ===============================
     UI
  =============================== */
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Nueva remisión</h1>

      {/* Folio */}
      <div>
        <label className="block text-sm mb-1">Folio</label>
        <input
          value={folio}
          onChange={(e) => setFolio(e.target.value)}
          className="border p-2 rounded w-40"
        />
      </div>

      {/* Cliente */}
      <div>
        <label className="block text-sm mb-2 font-medium">Datos del cliente</label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="relative">
              <input
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
                onFocus={() => setClientDropdownOpen(true)}
                onBlur={() => {
                  window.setTimeout(() => setClientDropdownOpen(false), 150);
                  const match = clients.find(
                    (c) => c.nombre.toLowerCase() === cliente.trim().toLowerCase()
                  );
                  if (match) applyClient(match);
                }}
                onKeyDown={handleClientKeyDown}
                placeholder="Cliente"
                className="border p-2 rounded text-gray-700 w-full"
              />
              {clientDropdownOpen && clients.length > 0 && (
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
            onClick={clearClient}
            className="px-3 py-2 rounded border border-[var(--boho-secondary)] text-[var(--boho-secondary)] hover:bg-[var(--boho-secondary)] hover:text-white"
          >
            Limpiar cliente
          </button>
        </div>
      </div>

      {/* Agregar productos */}
      <div className="flex gap-4">
        <select
          onChange={(e) => {
            const p = products.find((x) => x.id === e.target.value);
            if (p) addProductItem(p);
          }}
          className="border p-2 rounded"
          defaultValue=""
        >
          <option value="" disabled>
            Agregar producto
          </option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <button
          onClick={addManualItem}
          className="px-4 py-2 rounded bg-[var(--boho-secondary)] text-white hover:opacity-90"
        >
          + Producto manual
        </button>
      </div>

      {/* Tabla */}
      <table className="w-full bg-white border">
        <thead>
          <tr className="border-b">
            <th className="p-2 text-left">Descripción</th>
            <th className="p-2">Precio</th>
            <th className="p-2">Cantidad</th>
            <th className="p-2">Subtotal</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {items.map((i, idx) => (
            <tr key={idx} className="border-b">
              <td className="p-2">
                <input
                  value={i.description}
                  onChange={(e) =>
                    updateItem(idx, "description", e.target.value)
                  }
                  className="border p-1 rounded w-full"
                />
              </td>
              <td className="p-2">
                <input
                  type="number"
                  value={i.price}
                  onChange={(e) =>
                    updateItem(idx, "price", Number(e.target.value))
                  }
                  className="border p-1 rounded w-24"
                />
              </td>
              <td className="p-2">
                <input
                  type="number"
                  value={i.quantity}
                  onChange={(e) =>
                    updateItem(idx, "quantity", Number(e.target.value))
                  }
                  className="border p-1 rounded w-16"
                />
              </td>
              <td className="p-2">
                ${i.price * i.quantity}
              </td>
              <td className="p-2">
                <button
                  onClick={() => removeItem(idx)}
                  className="px-2 py-1 rounded border border-[var(--boho-secondary)] text-[var(--boho-secondary)] hover:bg-[var(--boho-secondary)] hover:text-white"
                >
                  ✕
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Total, Anticipo y Restante */}
      <div className="flex justify-end">
        <div className="bg-gray-50 border rounded-lg p-4 w-64 space-y-3">
          <div className="flex justify-between text-lg">
            <span>Total:</span>
            <span className="font-bold">${total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
            <label className="text-sm">Anticipo:</label>
            <input
              type="number"
              value={anticipo}
              onChange={(e) => setAnticipo(Number(e.target.value))}
              placeholder="0"
              className="border p-1 rounded w-28 text-right"
            />
          </div>
          <div className="flex justify-between items-center">
            <label className="text-sm">Metodo de pago:</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="border p-1 rounded w-28 text-right"
            >
              {paymentOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="border-t pt-2 flex justify-between text-lg font-bold text-[var(--boho-primary)]">
            <span>Restante:</span>
            <span>${(total - anticipo).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Guardar */}
      <div className="flex justify-end">
        <button
          onClick={saveRemision}
          disabled={loading}
          className="px-6 py-3 rounded bg-[var(--boho-primary)] text-white hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Guardando…" : "Guardar remisión"}
        </button>
      </div>
    </div>
  );
}
