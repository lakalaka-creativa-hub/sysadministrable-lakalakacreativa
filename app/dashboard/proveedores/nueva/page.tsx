"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function NuevaProveedorPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const nameRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  const save = async () => {
    if (saving) return;
    if (!name.trim()) return alert("El nombre es obligatorio");
    if (email && !email.includes("@")) return alert("Email no válido");

    setSaving(true);
    try {
      const { error } = await supabase.from("providers").insert({
        name: name.trim(),
        phone: phone.trim() || null,
        email: email.trim() || null,
        address: address.trim() || null,
        notes: notes.trim() || null,
        active: true,
      });

      if (error) {
        alert("Error al crear proveedor: " + error.message);
        return;
      }

      router.push("/dashboard/proveedores");
    } catch (err) {
      console.error(err);
      alert("Error inesperado al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Nuevo proveedor</h1>
        <button
          onClick={() => router.push("/dashboard/proveedores")}
          className="px-4 py-2 rounded border border-[var(--boho-primary)] text-[var(--boho-primary)] hover:bg-[var(--boho-primary)] hover:text-white"
        >
          ← Cancelar
        </button>
      </div>

      <div className="space-y-4 bg-white p-4 rounded border">
        <div>
          <label className="block text-sm mb-1">Nombre *</label>
          <input
            ref={nameRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") save();
            }}
            className="border p-2 rounded w-full"
            placeholder="Nombre del proveedor"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Teléfono</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="border p-2 rounded w-full"
              placeholder="Teléfono"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border p-2 rounded w-full"
              placeholder="correo@ejemplo.com"
            />
          </div>
        </div>

        <div>
          <label className="text-sm">Dirección</label>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Dirección del proveedor"
            className="w-full border rounded px-3 py-2"
            rows={2}
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Notas</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="border p-2 rounded w-full"
            rows={3}
            placeholder="Notas internas"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button
          onClick={() => router.push("/dashboard/proveedores")}
          className="px-6 py-2 rounded border border-[var(--boho-primary)] text-[var(--boho-primary)] hover:bg-[var(--boho-primary)] hover:text-white"
        >
          Cancelar
        </button>
        <button
          onClick={save}
          disabled={saving}
          className="px-6 py-2 rounded bg-[var(--boho-primary)] text-white hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Guardando..." : "Guardar"}
        </button>
      </div>
    </div>
  );
}
