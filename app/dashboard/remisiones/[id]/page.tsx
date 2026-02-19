"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Remision = {
  id: string;
  folio: string;
  cliente: string;
  telefono: string | null;
  direccion: string | null;
  fecha: string;
  total: number;
  status: "ACTIVA" | "CANCELADA";
};

type Item = {
  id: string;
  remision_id: string;
  description: string;
  price: number;
  quantity: number;
  subtotal: number;
};

export default function RemisionDetallePage() {
  const params = useParams();
  const router = useRouter();
  const [remision, setRemision] = useState<Remision | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRemision();
  }, []);

  const loadRemision = async () => {
    const { data: remisionData } = await supabase
      .from("remisiones")
      .select("*")
      .eq("id", params.id)
      .single();

    const { data: itemsData } = await supabase
      .from("remision_items")
      .select("*")
      .eq("remision_id", params.id);

    setRemision(remisionData);
    setItems(itemsData || []);
    setLoading(false);
  };

  if (loading) return <p>Cargando...</p>;
  if (!remision) return <p>Remisión no encontrada</p>;

  // Estilos inline para compatibilidad con PDF
  const th = {
    border: "1px solid #ccc",
    padding: "8px",
    textAlign: "left" as const,
    backgroundColor: "#2563eb",
    color: "#fff",
    fontWeight: "bold",
  };

  const td = {
    border: "1px solid #ccc",
    padding: "8px",
  };

  return (
    <div
      style={{
        maxWidth: "800px",
        margin: "0 auto",
        backgroundColor: "#fff",
        padding: "32px",
        fontFamily: "Arial, sans-serif",
        fontSize: "13px",
        color: "#000",
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
      }}
    >
      {/* 1️⃣ ENCABEZADO */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "30px",
          alignItems: "flex-start",
        }}
      >
        <div>
          <h1 style={{ fontSize: "22px", marginBottom: "8px", fontWeight: "bold" }}>
            REMISIÓN
          </h1>
          <p style={{ margin: "4px 0" }}>
            <strong>Folio:</strong> {remision.folio}
          </p>
          <p style={{ margin: "4px 0" }}>
            <strong>Fecha:</strong> {new Date(remision.fecha).toLocaleDateString("es-MX")}
          </p>
          <p style={{ margin: "4px 0" }}>
            <strong>Estado:</strong> {remision.status}
          </p>
        </div>

        <div>
          <span
            style={{
              padding: "6px 12px",
              backgroundColor: remision.status === "ACTIVA" ? "#dcfce7" : "#fee2e2",
              color: remision.status === "ACTIVA" ? "#166534" : "#991b1b",
              fontWeight: "bold",
              borderRadius: "4px",
              display: "inline-block",
            }}
          >
            {remision.status}
          </span>
        </div>
      </div>

      {/* 2️⃣ DATOS DEL CLIENTE */}
      <div
        style={{
          border: "1px solid #d1d5db",
          borderRadius: "6px",
          padding: "16px",
          marginBottom: "30px",
          backgroundColor: "#f9fafb",
        }}
      >
        <p style={{ fontWeight: "bold", marginBottom: "12px" }}>Datos del cliente</p>

        <p style={{ margin: "4px 0" }}>
          <strong>Cliente:</strong> {remision.cliente || "Venta mostrador"}
        </p>
        <p style={{ margin: "4px 0" }}>
          <strong>Teléfono:</strong> {remision.telefono || "—"}
        </p>
        <p style={{ margin: "4px 0" }}>
          <strong>Dirección:</strong> {remision.direccion || "—"}
        </p>
      </div>

      {/* 3️⃣ TABLA DE PRODUCTOS */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "30px" }}>
        <thead>
          <tr>
            <th style={th}>Descripción</th>
            <th style={{ ...th, textAlign: "right" }}>Precio</th>
            <th style={{ ...th, textAlign: "center" }}>Cantidad</th>
            <th style={{ ...th, textAlign: "right" }}>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td style={{ ...td, textAlign: "center", padding: "20px" }} colSpan={4}>
                No hay productos en esta remisión
              </td>
            </tr>
          ) : (
            items.map((item) => (
              <tr key={item.id}>
                <td style={td}>{item.description}</td>
                <td style={{ ...td, textAlign: "right" }}>${item.price.toFixed(2)}</td>
                <td style={{ ...td, textAlign: "center" }}>{item.quantity}</td>
                <td style={{ ...td, textAlign: "right" }}>${item.subtotal.toFixed(2)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* 4️⃣ TOTAL */}
      <div style={{ marginTop: "30px", textAlign: "right", fontSize: "18px" }}>
        <div
          style={{
            display: "inline-block",
            border: "2px solid #374151",
            borderRadius: "6px",
            padding: "16px 24px",
          }}
        >
          <strong>Total: ${remision.total.toFixed(2)}</strong>
        </div>
      </div>

      {/* 5️⃣ PIE DE NOTA */}
      <p
        style={{
          marginTop: "40px",
          fontSize: "11px",
          textAlign: "center",
          color: "#6b7280",
        }}
      >
        Documento sin valor fiscal · Gracias por su compra
      </p>

      {/* 6️⃣ BOTÓN VOLVER */}
      <div style={{ marginTop: "32px", textAlign: "center" }}>
        <button
          onClick={() => router.push("/dashboard/remisiones")}
          style={{
            padding: "8px 24px",
            border: "1px solid var(--boho-primary)",
            borderRadius: "6px",
            backgroundColor: "var(--boho-card)",
            color: "var(--boho-primary)",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          ← Volver al listado
        </button>
      </div>
    </div>
  );
}
