"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { CalendarDays, ChevronLeft, ChevronRight, Plus, StickyNote } from "lucide-react";

type AppointmentStatus = "Pendiente" | "Confirmada" | "En progreso" | "Finalizada" | "Cancelada";
type AppointmentType = "cita" | "reunion" | "entrega" | string;

type Appointment = {
  id: string;
  date: string;
  time: string;
  title: string;
  type: AppointmentType;
  clientName: string;
  durationMin: number;
  status: AppointmentStatus;
  channel: string;
};

type Note = {
  id: string;
  date: string;
  title: string;
  detail: string;
  tag: "Recordatorio" | "Pendiente" | "Seguimiento" | string;
};

type AppointmentForm = {
  date: string;
  time: string;
  title: string;
  type: string;
  clientName: string;
  status: AppointmentStatus;
  channel: string;
  durationMin: string;
};

type NoteForm = {
  date: string;
  title: string;
  detail: string;
  tag: string;
};

type AgendaSettings = {
  statuses: AppointmentStatus[];
  types: string[];
  channels: string[];
  defaultStatus: AppointmentStatus;
  defaultType: string;
  defaultChannel: string;
  defaultDurationMin: number;
  statusColors: Record<string, string>;
};

type SettingsForm = {
  statuses: string;
  types: string;
  channels: string;
  defaultStatus: string;
  defaultType: string;
  defaultChannel: string;
  defaultDurationMin: string;
  statusColors: Record<string, string>;
};

const DEFAULT_SETTINGS: AgendaSettings = {
  statuses: ["Pendiente", "Confirmada", "En progreso", "Finalizada", "Cancelada"],
  types: ["cita", "reunion", "entrega"],
  channels: ["Web", "WhatsApp", "Llamada", "Mostrador"],
  defaultStatus: "Pendiente",
  defaultType: "cita",
  defaultChannel: "Web",
  defaultDurationMin: 30,
  statusColors: {
    Pendiente: "#FCD34D",
    Confirmada: "#6EE7B7",
    "En progreso": "#7DD3FC",
    Finalizada: "#D6D3D1",
    Cancelada: "#FDA4AF",
  },
};

const WEEK_DAYS = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"];
const STATUS_PALETTE = [
  "#FCD34D",
  "#6EE7B7",
  "#7DD3FC",
  "#D6D3D1",
  "#FDA4AF",
  "#C4B5FD",
  "#FDBA74",
];

const NOTE_TAGS: Record<string, string> = {
  Recordatorio: "bg-violet-200 text-violet-950",
  Pendiente: "bg-amber-200 text-amber-950",
  Seguimiento: "bg-emerald-200 text-emerald-950",
};

const pad = (value: number) => String(value).padStart(2, "0");
const toKey = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const buildCalendar = (year: number, month: number) => {
  const first = new Date(year, month, 1);
  const startOffset = (first.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - startOffset);
  return Array.from({ length: 42 }, (_, index) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + index));
};

const getMonthRange = (date: Date) => {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return { start: toKey(start), end: toKey(end) };
};

const formatMonth = (date: Date) =>
  new Intl.DateTimeFormat("es-MX", { month: "long" }).format(date);

const formatDay = (date: Date) =>
  new Intl.DateTimeFormat("es-MX", { weekday: "long", day: "numeric", month: "long" }).format(date);

const formatType = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);
const formatTime = (value: string) => value?.slice(0, 5) || "00:00";
const normalizeStatus = (value: string | null, statuses: AppointmentStatus[]) =>
  statuses.includes(value as AppointmentStatus) ? (value as AppointmentStatus) : statuses[0];
const hexToRgb = (hex: string) => {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return null;
  const num = Number.parseInt(clean, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
};
const rgba = (hex: string, alpha: number) => {
  const rgb = hexToRgb(hex);
  if (!rgb) return "rgba(148,163,184,0.4)";
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
};
const getContrastColor = (hex: string) => {
  const rgb = hexToRgb(hex);
  if (!rgb) return "#0f172a";
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((value) => {
    const channel = value / 255;
    return channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
  });
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.6 ? "#1f2937" : "#0b1120";
};
const getDefaultForm = (dateKey: string, settings: AgendaSettings): AppointmentForm => ({
  date: dateKey,
  time: "09:00",
  title: "",
  type: settings.defaultType || settings.types[0],
  clientName: "",
  status: settings.defaultStatus || settings.statuses[0],
  channel: settings.defaultChannel || settings.channels[0],
  durationMin: String(settings.defaultDurationMin || 30),
});
const getDefaultNoteForm = (dateKey: string): NoteForm => ({
  date: dateKey,
  title: "",
  detail: "",
  tag: "Recordatorio",
});
const buildStatusColorMap = (statuses: AppointmentStatus[], current: Record<string, string>) => {
  const map: Record<string, string> = { ...current };
  statuses.forEach((status, index) => {
    if (!map[status]) {
      map[status] = STATUS_PALETTE[index % STATUS_PALETTE.length];
    }
  });
  return map;
};
const buildStatusStyles = (statuses: AppointmentStatus[], colors: Record<string, string>) => {
  const styles: Record<string, { chip: React.CSSProperties; bar: React.CSSProperties; border: React.CSSProperties }> = {};
  statuses.forEach((status, index) => {
    const hex = colors[status] || STATUS_PALETTE[index % STATUS_PALETTE.length];
    styles[status] = {
      chip: {
        backgroundColor: rgba(hex, 0.25),
        borderColor: hex,
        color: getContrastColor(hex),
      },
      bar: {
        backgroundColor: rgba(hex, 0.7),
      },
      border: {
        borderColor: hex,
      },
    };
  });
  return styles;
};
const parseList = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
const toSettingsForm = (settings: AgendaSettings): SettingsForm => ({
  statuses: settings.statuses.join(", "),
  types: settings.types.join(", "),
  channels: settings.channels.join(", "),
  defaultStatus: settings.defaultStatus,
  defaultType: settings.defaultType,
  defaultChannel: settings.defaultChannel,
  defaultDurationMin: String(settings.defaultDurationMin || 30),
  statusColors: settings.statusColors,
});

export default function AgendaPage() {
  const [cursorDate, setCursorDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [panelMode, setPanelMode] = useState<"agenda" | "notas">("agenda");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<AgendaSettings>(() => DEFAULT_SETTINGS);
  const [configOpen, setConfigOpen] = useState(false);
  const [settingsForm, setSettingsForm] = useState<SettingsForm>(() => toSettingsForm(DEFAULT_SETTINGS));
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingAppointmentId, setEditingAppointmentId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState<AppointmentForm>(() => getDefaultForm(toKey(new Date()), DEFAULT_SETTINGS));
  const [noteOpen, setNoteOpen] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteError, setNoteError] = useState<string | null>(null);
  const [noteForm, setNoteForm] = useState<NoteForm>(() => getDefaultNoteForm(toKey(new Date())));

  const currentYear = cursorDate.getFullYear();
  const currentMonth = cursorDate.getMonth();
  const calendarDays = useMemo(() => buildCalendar(currentYear, currentMonth), [currentYear, currentMonth]);
  const todayKey = useMemo(() => toKey(new Date()), []);
  const selectedKey = toKey(selectedDate);
  const statusList = settings.statuses.length ? settings.statuses : DEFAULT_SETTINGS.statuses;
  const statusColors = useMemo(
    () => buildStatusColorMap(statusList, settings.statusColors || DEFAULT_SETTINGS.statusColors),
    [statusList, settings.statusColors]
  );
  const statusStyles = useMemo(
    () => buildStatusStyles(statusList, statusColors),
    [statusList, statusColors]
  );
  const currentYearLabel = cursorDate.getFullYear();
  const yearOptions = Array.from({ length: 7 }, (_, index) => currentYearLabel - 3 + index);

  const changeMonth = (delta: number) => {
    const next = new Date(cursorDate.getFullYear(), cursorDate.getMonth() + delta, 1);
    setCursorDate(next);
    if (selectedDate.getMonth() !== next.getMonth() || selectedDate.getFullYear() !== next.getFullYear()) {
      setSelectedDate(next);
    }
  };

  const changeYear = (nextYear: number) => {
    const next = new Date(nextYear, cursorDate.getMonth(), 1);
    setCursorDate(next);
    if (selectedDate.getMonth() !== next.getMonth() || selectedDate.getFullYear() !== next.getFullYear()) {
      setSelectedDate(next);
    }
  };

  useEffect(() => {
    const loadSettings = async () => {
      const { data, error } = await supabase
        .from("agenda_settings")
        .select(
          "key, statuses, types, channels, default_status, default_type, default_channel, default_duration_min, status_colors"
        )
        .eq("key", "default")
        .maybeSingle();

      if (error || !data) {
        console.warn("No se pudieron cargar ajustes de agenda", error?.message);
        return;
      }

      const rowStatuses = (data.statuses as AppointmentStatus[]) || DEFAULT_SETTINGS.statuses;
      const rowTypes = (data.types as string[]) || DEFAULT_SETTINGS.types;
      const rowChannels = (data.channels as string[]) || DEFAULT_SETTINGS.channels;
      const rowStatusColors = (data.status_colors as Record<string, string>) || DEFAULT_SETTINGS.statusColors;

      const nextSettings: AgendaSettings = {
        statuses: rowStatuses.length ? rowStatuses : DEFAULT_SETTINGS.statuses,
        types: rowTypes.length ? rowTypes : DEFAULT_SETTINGS.types,
        channels: rowChannels.length ? rowChannels : DEFAULT_SETTINGS.channels,
        defaultStatus: (data.default_status as AppointmentStatus) || DEFAULT_SETTINGS.defaultStatus,
        defaultType: (data.default_type as string) || DEFAULT_SETTINGS.defaultType,
        defaultChannel: (data.default_channel as string) || DEFAULT_SETTINGS.defaultChannel,
        defaultDurationMin: Number(data.default_duration_min) || DEFAULT_SETTINGS.defaultDurationMin,
        statusColors: buildStatusColorMap(
          rowStatuses.length ? rowStatuses : DEFAULT_SETTINGS.statuses,
          rowStatusColors
        ),
      };

      setSettings(nextSettings);
      setSettingsForm(toSettingsForm(nextSettings));
    };

    loadSettings();
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { start, end } = getMonthRange(cursorDate);

    const [{ data: appointmentRows, error: appointmentError }, { data: noteRows, error: noteError }] = await Promise.all([
      supabase
        .from("appointments")
        .select("id, date, time, title, type, client_name, status, channel, duration_min")
        .gte("date", start)
        .lte("date", end)
        .order("time", { ascending: true }),
      supabase
        .from("appointment_notes")
        .select("id, date, title, detail, tag")
        .gte("date", start)
        .lte("date", end)
        .order("date", { ascending: true }),
    ]);

    if (appointmentError || noteError) {
      setError("No se pudieron cargar las citas. Revisa la conexion de Supabase.");
      setAppointments([]);
      setNotes([]);
      setLoading(false);
      return;
    }

    setAppointments(
      (appointmentRows || []).map((row) => ({
        id: row.id,
        date: row.date,
        time: formatTime(row.time),
        title: row.title || "(Sin titulo)",
        type: row.type?.trim() || "cita",
        clientName: row.client_name || "",
        durationMin: Number(row.duration_min) || 30,
        status: normalizeStatus(row.status, statusList),
        channel: row.channel || "Web",
      }))
    );

    setNotes(
      (noteRows || []).map((row) => ({
        id: row.id,
        date: row.date,
        title: row.title || "(Sin titulo)",
        detail: row.detail || "",
        tag: row.tag || "Recordatorio",
      }))
    );

    setLoading(false);
  }, [cursorDate, statusList]);

  useEffect(() => {
    load();
  }, [load]);

  const dailySummary = useMemo(() => {
    const map = new Map<string, { appointmentCount: number; noteCount: number; statusCount: Record<string, number> }>();
    appointments.forEach((item) => {
      const entry = map.get(item.date) || {
        appointmentCount: 0,
        noteCount: 0,
        statusCount: statusList.reduce((acc, status) => {
          acc[status] = 0;
          return acc;
        }, {} as Record<string, number>),
      };
      entry.appointmentCount += 1;
      entry.statusCount[item.status] = (entry.statusCount[item.status] || 0) + 1;
      map.set(item.date, entry);
    });

    notes.forEach((note) => {
      const entry = map.get(note.date) || {
        appointmentCount: 0,
        noteCount: 0,
        statusCount: statusList.reduce((acc, status) => {
          acc[status] = 0;
          return acc;
        }, {} as Record<string, number>),
      };
      entry.noteCount += 1;
      map.set(note.date, entry);
    });

    return map;
  }, [appointments, notes, statusList]);

  const dayAppointments = useMemo(
    () => appointments.filter((item) => item.date === selectedKey),
    [appointments, selectedKey]
  );

  const dayNotes = useMemo(
    () => notes.filter((item) => item.date === selectedKey),
    [notes, selectedKey]
  );
  const statusOptions = parseList(settingsForm.statuses);
  const typeOptions = parseList(settingsForm.types);
  const channelOptions = parseList(settingsForm.channels);
  const statusColorList = statusOptions.length ? statusOptions : DEFAULT_SETTINGS.statuses;

  const openCreate = () => {
    setForm(getDefaultForm(selectedKey, settings));
    setFormError(null);
    setEditingAppointmentId(null);
    setCreateOpen(true);
  };

  const openEditAppointment = (appointment: Appointment) => {
    setForm({
      date: appointment.date,
      time: appointment.time,
      title: appointment.title,
      type: appointment.type,
      clientName: appointment.clientName,
      status: appointment.status,
      channel: appointment.channel,
      durationMin: String(appointment.durationMin),
    });
    setFormError(null);
    setEditingAppointmentId(appointment.id);
    setCreateOpen(true);
  };

  const updateForm = (field: keyof AppointmentForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const openNoteCreate = () => {
    setNoteForm(getDefaultNoteForm(selectedKey));
    setNoteError(null);
    setEditingNoteId(null);
    setNoteOpen(true);
  };

  const openNoteEdit = (note: Note) => {
    setNoteForm({
      date: note.date,
      title: note.title,
      detail: note.detail,
      tag: note.tag,
    });
    setNoteError(null);
    setEditingNoteId(note.id);
    setNoteOpen(true);
  };

  const updateNoteForm = (field: keyof NoteForm, value: string) => {
    setNoteForm((prev) => ({ ...prev, [field]: value }));
  };

  const openConfig = () => {
    setSettingsForm(toSettingsForm(settings));
    setSettingsError(null);
    setConfigOpen(true);
  };

  const updateSettingsForm = (field: keyof SettingsForm, value: string) => {
    setSettingsForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateStatusColor = (status: string, value: string) => {
    setSettingsForm((prev) => ({
      ...prev,
      statusColors: {
        ...prev.statusColors,
        [status]: value,
      },
    }));
  };

  const saveSettings = async () => {
    setSettingsSaving(true);
    setSettingsError(null);
    const statuses = (parseList(settingsForm.statuses) as AppointmentStatus[]) || [];
    const types = parseList(settingsForm.types);
    const channels = parseList(settingsForm.channels);
    const nextStatuses = statuses.length ? statuses : DEFAULT_SETTINGS.statuses;
    const nextTypes = types.length ? types : DEFAULT_SETTINGS.types;
    const nextChannels = channels.length ? channels : DEFAULT_SETTINGS.channels;
    const nextDefaultStatus = (nextStatuses.includes(settingsForm.defaultStatus as AppointmentStatus)
      ? (settingsForm.defaultStatus as AppointmentStatus)
      : nextStatuses[0]) as AppointmentStatus;
    const nextDefaultType = nextTypes.includes(settingsForm.defaultType) ? settingsForm.defaultType : nextTypes[0];
    const nextDefaultChannel = nextChannels.includes(settingsForm.defaultChannel)
      ? settingsForm.defaultChannel
      : nextChannels[0];
    const nextDuration = Number(settingsForm.defaultDurationMin) || DEFAULT_SETTINGS.defaultDurationMin;
    const nextStatusColors = buildStatusColorMap(nextStatuses, settingsForm.statusColors || DEFAULT_SETTINGS.statusColors);

    const nextSettings: AgendaSettings = {
      statuses: nextStatuses,
      types: nextTypes,
      channels: nextChannels,
      defaultStatus: nextDefaultStatus,
      defaultType: nextDefaultType,
      defaultChannel: nextDefaultChannel,
      defaultDurationMin: nextDuration,
      statusColors: nextStatusColors,
    };

    const { error: saveError } = await supabase
      .from("agenda_settings")
      .upsert(
        {
          key: "default",
          statuses: nextSettings.statuses,
          types: nextSettings.types,
          channels: nextSettings.channels,
          default_status: nextSettings.defaultStatus,
          default_type: nextSettings.defaultType,
          default_channel: nextSettings.defaultChannel,
          default_duration_min: nextSettings.defaultDurationMin,
          status_colors: nextSettings.statusColors,
        },
        { onConflict: "key" }
      );

    if (saveError) {
      setSettingsError("No se pudo guardar la configuracion. Revisa tu conexion.");
      setSettingsSaving(false);
      return;
    }

    setSettings(nextSettings);
    setSettingsForm(toSettingsForm(nextSettings));
    setConfigOpen(false);
    setSettingsSaving(false);
  };

  const resetSettings = () => {
    setSettingsForm(toSettingsForm(DEFAULT_SETTINGS));
    setSettingsError(null);
  };

  const handleSaveAppointment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    if (!form.title.trim()) {
      setFormError("El titulo es obligatorio.");
      return;
    }

    setSaving(true);
    const payload = {
      date: form.date,
      time: form.time,
      title: form.title.trim(),
      type: form.type.trim() || "cita",
      client_name: form.clientName.trim() || null,
      status: form.status,
      channel: form.channel.trim() || null,
      duration_min: Number(form.durationMin) || 30,
    };

    const request = editingAppointmentId
      ? supabase.from("appointments").update(payload).eq("id", editingAppointmentId)
      : supabase.from("appointments").insert(payload);

    const { error: saveError } = await request;

    if (saveError) {
      setFormError("No se pudo guardar la cita. Verifica los campos.");
      setSaving(false);
      return;
    }

    setCreateOpen(false);
    setSaving(false);
    setEditingAppointmentId(null);
    await load();
  };

  const handleDeleteAppointment = async (appointmentId: string) => {
    if (!confirm("Deseas eliminar esta cita?")) return;
    const { error: deleteError } = await supabase.from("appointments").delete().eq("id", appointmentId);
    if (deleteError) {
      setError("No se pudo eliminar la cita.");
      return;
    }
    await load();
  };

  const handleSaveNote = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNoteError(null);

    if (!noteForm.title.trim()) {
      setNoteError("El titulo es obligatorio.");
      return;
    }

    setNoteSaving(true);
    const payload = {
      date: noteForm.date,
      title: noteForm.title.trim(),
      detail: noteForm.detail.trim(),
      tag: noteForm.tag.trim() || "Recordatorio",
    };

    const request = editingNoteId
      ? supabase.from("appointment_notes").update(payload).eq("id", editingNoteId)
      : supabase.from("appointment_notes").insert(payload);

    const { error: saveError } = await request;

    if (saveError) {
      setNoteError("No se pudo guardar la nota.");
      setNoteSaving(false);
      return;
    }

    setNoteOpen(false);
    setNoteSaving(false);
    setEditingNoteId(null);
    await load();
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm("Deseas eliminar esta nota?")) return;
    const { error: deleteError } = await supabase.from("appointment_notes").delete().eq("id", noteId);
    if (deleteError) {
      setError("No se pudo eliminar la nota.");
      return;
    }
    await load();
  };

  return (
    <div className="relative isolate min-h-[calc(100vh-7.5rem)]">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_20%,color-mix(in_srgb,var(--boho-primary)_22%,transparent),transparent_55%),radial-gradient(circle_at_85%_0%,color-mix(in_srgb,var(--boho-secondary)_20%,transparent),transparent_55%)]" />

      <div className="space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl text-[var(--boho-text)]">Agenda / Calendario</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="border-[var(--border)] bg-[var(--boho-card)]"
              onClick={openConfig}
            >
              <StickyNote />
              Configurar agenda
            </Button>
            <Button variant="outline" className="border-[var(--border)] bg-[var(--boho-card)]" onClick={openNoteCreate}>
              <StickyNote />
              Nueva nota
            </Button>
            <Button onClick={openCreate}>
              <Plus />
              Nueva cita
            </Button>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="rounded-3xl border bg-[var(--boho-card)] p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <CalendarDays className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-2xl capitalize">{formatMonth(cursorDate)}</h2>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Año:</span>
                  <select
                    className="h-9 rounded-md border border-[var(--border)] bg-white px-3"
                    value={currentYearLabel}
                    onChange={(event) => changeYear(Number(event.target.value))}
                  >
                    {yearOptions.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="border-[var(--border)]"
                  onClick={() => changeMonth(-1)}
                >
                  <ChevronLeft />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="border-[var(--border)]"
                  onClick={() => changeMonth(1)}
                >
                  <ChevronRight />
                </Button>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-7 text-xs uppercase tracking-[0.24em] text-muted-foreground">
              {WEEK_DAYS.map((day) => (
                <div key={day} className="px-2 pb-2">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid h-[calc(100vh-21rem)] grid-cols-7 grid-rows-6 gap-3">
              {calendarDays.map((date) => {
                const key = toKey(date);
                const isSelected = key === selectedKey;
                const isToday = key === todayKey;
                const inMonth = date.getMonth() === currentMonth;
                const summary = dailySummary.get(key);

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedDate(date)}
                    className={cn(
                      "flex h-full flex-col rounded-2xl border px-3 py-2 text-left transition hover:-translate-y-0.5 hover:shadow-md",
                      inMonth ? "bg-white" : "bg-muted/40 text-muted-foreground",
                      isSelected && "ring-2 ring-[var(--boho-primary)]",
                      isToday && "border-[var(--boho-primary)]"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className={cn("text-sm font-semibold", !inMonth && "text-muted-foreground")}>
                        {date.getDate()}
                      </span>
                      {summary ? (
                        <span className="text-[10px] text-muted-foreground">
                          C {summary.appointmentCount} · N {summary.noteCount}
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-auto space-y-1">
                      {statusList.map((status) => {
                        const count = summary?.statusCount[status] || 0;
                        if (count === 0) return null;
                        return (
                          <div key={status} className="flex items-center gap-2 text-[11px]">
                            <span className="h-1.5 w-6 rounded-full" style={statusStyles[status]?.bar} />
                            <span className="text-muted-foreground">
                              {status} ({count})
                            </span>
                          </div>
                        );
                      })}
                      {!summary && <p className="text-[11px] text-muted-foreground">Sin eventos</p>}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <aside className="flex h-full flex-col gap-4 rounded-3xl border bg-[var(--boho-card)] p-5 shadow-sm">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Agenda del dia</p>
              <h3 className="text-2xl capitalize">{formatDay(selectedDate)}</h3>
              <p className="text-sm text-muted-foreground">
                {dayAppointments.length} eventos, {dayNotes.length} notas
              </p>
              {loading && <p className="mt-2 text-xs text-muted-foreground">Cargando agenda...</p>}
              {error && <p className="mt-2 text-xs text-rose-600">{error}</p>}
            </div>

            <div className="flex rounded-full border bg-muted/40 p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setPanelMode("agenda")}
                className={cn(
                  "flex-1 rounded-full px-3 py-1 transition",
                  panelMode === "agenda" ? "bg-white shadow" : "text-muted-foreground"
                )}
              >
                Citas
              </button>
              <button
                type="button"
                onClick={() => setPanelMode("notas")}
                className={cn(
                  "flex-1 rounded-full px-3 py-1 transition",
                  panelMode === "notas" ? "bg-white shadow" : "text-muted-foreground"
                )}
              >
                Notas
              </button>
            </div>

            {panelMode === "agenda" ? (
              <div className="flex flex-1 flex-col gap-3 overflow-auto pr-1">
                {dayAppointments.length === 0 ? (
                  <div className="rounded-2xl border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
                    No hay eventos programados para este dia.
                  </div>
                ) : (
                  dayAppointments.map((item) => (
                    <article
                      key={item.id}
                      className="rounded-2xl border-l-4 bg-white p-4 shadow-sm transition"
                      style={statusStyles[item.status]?.border}
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{item.time}</span>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-[var(--border)] px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                            {formatType(item.type)}
                          </span>
                          <span
                            className="rounded-full border px-2 py-0.5 text-[11px] font-semibold"
                            style={statusStyles[item.status]?.chip}
                          >
                            {item.status}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="xs"
                            className="text-xs"
                            onClick={() => openEditAppointment(item)}
                          >
                            Editar
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="xs"
                            className="text-xs text-rose-600"
                            onClick={() => handleDeleteAppointment(item.id)}
                          >
                            Eliminar
                          </Button>
                        </div>
                      </div>
                      <h4 className="mt-2 text-base font-semibold text-[var(--boho-text)]">
                        {item.clientName || "(Sin cliente)"}
                      </h4>
                      <p className="text-sm text-muted-foreground">{item.title}</p>
                      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                        <span>{item.durationMin} min</span>
                        <span>{item.channel}</span>
                      </div>
                    </article>
                  ))
                )}
              </div>
            ) : (
              <div className="flex flex-1 flex-col gap-3 overflow-auto pr-1">
                {dayNotes.length === 0 ? (
                  <div className="rounded-2xl border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
                    No hay notas para este dia.
                  </div>
                ) : (
                  dayNotes.map((item) => (
                    <article key={item.id} className="rounded-2xl border bg-white p-4 shadow-sm">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-[var(--boho-text)]">{item.title}</h4>
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                              NOTE_TAGS[item.tag] || "bg-slate-200 text-slate-900"
                            )}
                          >
                            {item.tag}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="xs"
                            className="text-xs"
                            onClick={() => openNoteEdit(item)}
                          >
                            Editar
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="xs"
                            className="text-xs text-rose-600"
                            onClick={() => handleDeleteNote(item.id)}
                          >
                            Eliminar
                          </Button>
                        </div>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">{item.detail}</p>
                    </article>
                  ))
                )}
              </div>
            )}

          </aside>
        </div>
      </div>

      {configOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-3xl rounded-3xl border bg-[var(--boho-card)] p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Configuracion</p>
                <h2 className="text-2xl text-[var(--boho-text)]">Configurar agenda</h2>
                <p className="text-sm text-muted-foreground">Personaliza estados, tipos y valores por defecto.</p>
              </div>
              <Button variant="outline" className="border-[var(--border)]" onClick={() => setConfigOpen(false)}>
                Cerrar
              </Button>
            </div>

            <div className="mt-6 grid gap-4">
              <label className="grid gap-2 text-sm">
                Estados (separados por coma)
                <textarea
                  className="min-h-[96px] rounded-md border border-[var(--border)] bg-white px-3 py-2"
                  value={settingsForm.statuses}
                  onChange={(event) => updateSettingsForm("statuses", event.target.value)}
                />
              </label>

              <div className="rounded-2xl border bg-muted/30 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Colores por estado</p>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {statusColorList.map((status, index) => {
                    const color = settingsForm.statusColors[status] || STATUS_PALETTE[index % STATUS_PALETTE.length];
                    return (
                      <label key={status} className="grid gap-2 text-sm">
                        <span className="font-medium text-[var(--boho-text)]">{status}</span>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            className="h-10 w-12 cursor-pointer rounded-md border border-[var(--border)] bg-white"
                            value={color}
                            onChange={(event) => updateStatusColor(status, event.target.value)}
                          />
                          <input
                            type="text"
                            className="h-10 flex-1 rounded-md border border-[var(--border)] bg-white px-3"
                            value={color}
                            onChange={(event) => updateStatusColor(status, event.target.value)}
                          />
                          <span
                            className="rounded-full border px-2 py-1 text-xs font-semibold"
                            style={{
                              backgroundColor: rgba(color, 0.25),
                              borderColor: color,
                              color: getContrastColor(color),
                            }}
                          >
                            {status}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-sm">
                  Tipos (separados por coma)
                  <textarea
                    className="min-h-[80px] rounded-md border border-[var(--border)] bg-white px-3 py-2"
                    value={settingsForm.types}
                    onChange={(event) => updateSettingsForm("types", event.target.value)}
                  />
                </label>
                <label className="grid gap-2 text-sm">
                  Canales (separados por coma)
                  <textarea
                    className="min-h-[80px] rounded-md border border-[var(--border)] bg-white px-3 py-2"
                    value={settingsForm.channels}
                    onChange={(event) => updateSettingsForm("channels", event.target.value)}
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-4">
                <label className="grid gap-2 text-sm">
                  Estado por defecto
                  <select
                    className="h-10 rounded-md border border-[var(--border)] bg-white px-3"
                    value={settingsForm.defaultStatus}
                    onChange={(event) => updateSettingsForm("defaultStatus", event.target.value)}
                  >
                    {(statusOptions.length ? statusOptions : DEFAULT_SETTINGS.statuses).map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-2 text-sm">
                  Tipo por defecto
                  <select
                    className="h-10 rounded-md border border-[var(--border)] bg-white px-3"
                    value={settingsForm.defaultType}
                    onChange={(event) => updateSettingsForm("defaultType", event.target.value)}
                  >
                    {(typeOptions.length ? typeOptions : DEFAULT_SETTINGS.types).map((type) => (
                      <option key={type} value={type}>
                        {formatType(type)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-2 text-sm">
                  Canal por defecto
                  <select
                    className="h-10 rounded-md border border-[var(--border)] bg-white px-3"
                    value={settingsForm.defaultChannel}
                    onChange={(event) => updateSettingsForm("defaultChannel", event.target.value)}
                  >
                    {(channelOptions.length ? channelOptions : DEFAULT_SETTINGS.channels).map((channel) => (
                      <option key={channel} value={channel}>
                        {channel}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-2 text-sm">
                  Duracion por defecto
                  <input
                    type="number"
                    min={5}
                    className="h-10 rounded-md border border-[var(--border)] bg-white px-3"
                    value={settingsForm.defaultDurationMin}
                    onChange={(event) => updateSettingsForm("defaultDurationMin", event.target.value)}
                  />
                </label>
              </div>

              {settingsError && <p className="text-sm text-rose-600">{settingsError}</p>}

              <div className="flex flex-wrap justify-between gap-2">
                <Button type="button" variant="outline" className="border-[var(--border)]" onClick={resetSettings}>
                  Restaurar por defecto
                </Button>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" className="border-[var(--border)]" onClick={() => setConfigOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="button" onClick={saveSettings} disabled={settingsSaving}>
                    {settingsSaving ? "Guardando..." : "Guardar configuracion"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-3xl border bg-[var(--boho-card)] p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Nueva cita</p>
                <h2 className="text-2xl text-[var(--boho-text)]">Crear evento</h2>
                <p className="text-sm text-muted-foreground">Agrega una cita, reunion o entrega.</p>
              </div>
              <Button variant="outline" className="border-[var(--border)]" onClick={() => setCreateOpen(false)}>
                Cerrar
              </Button>
            </div>

            <form onSubmit={handleSaveAppointment} className="mt-6 grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-sm">
                  Fecha
                  <input
                    type="date"
                    className="h-10 rounded-md border border-[var(--border)] bg-white px-3"
                    value={form.date}
                    onChange={(event) => updateForm("date", event.target.value)}
                    required
                  />
                </label>
                <label className="grid gap-2 text-sm">
                  Hora
                  <input
                    type="time"
                    className="h-10 rounded-md border border-[var(--border)] bg-white px-3"
                    value={form.time}
                    onChange={(event) => updateForm("time", event.target.value)}
                    required
                  />
                </label>
              </div>

              <label className="grid gap-2 text-sm">
                Titulo
                <input
                  type="text"
                  className="h-10 rounded-md border border-[var(--border)] bg-white px-3"
                  value={form.title}
                  onChange={(event) => updateForm("title", event.target.value)}
                  placeholder="Consulta, reunion o entrega"
                  required
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-sm">
                  Tipo
                  <select
                    className="h-10 rounded-md border border-[var(--border)] bg-white px-3"
                    value={form.type}
                    onChange={(event) => updateForm("type", event.target.value)}
                  >
                    {(settings.types.length ? settings.types : DEFAULT_SETTINGS.types).map((type) => (
                      <option key={type} value={type}>
                        {formatType(type)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-2 text-sm">
                  Cliente
                  <input
                    type="text"
                    className="h-10 rounded-md border border-[var(--border)] bg-white px-3"
                    value={form.clientName}
                    onChange={(event) => updateForm("clientName", event.target.value)}
                    placeholder="Nombre del cliente"
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <label className="grid gap-2 text-sm">
                  Estado
                  <select
                    className="h-10 rounded-md border border-[var(--border)] bg-white px-3"
                    value={form.status}
                    onChange={(event) => updateForm("status", event.target.value)}
                  >
                    {statusList.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-2 text-sm">
                  Canal
                  <select
                    className="h-10 rounded-md border border-[var(--border)] bg-white px-3"
                    value={form.channel}
                    onChange={(event) => updateForm("channel", event.target.value)}
                  >
                    {(settings.channels.length ? settings.channels : DEFAULT_SETTINGS.channels).map((channel) => (
                      <option key={channel} value={channel}>
                        {channel}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-2 text-sm">
                  Duracion (min)
                  <input
                    type="number"
                    className="h-10 rounded-md border border-[var(--border)] bg-white px-3"
                    value={form.durationMin}
                    onChange={(event) => updateForm("durationMin", event.target.value)}
                    min={5}
                  />
                </label>
              </div>

              {formError && <p className="text-sm text-rose-600">{formError}</p>}

              <div className="flex flex-wrap justify-end gap-2">
                <Button type="button" variant="outline" className="border-[var(--border)]" onClick={() => setCreateOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Guardando..." : editingAppointmentId ? "Guardar cambios" : "Guardar cita"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {noteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-3xl border bg-[var(--boho-card)] p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Notas</p>
                <h2 className="text-2xl text-[var(--boho-text)]">
                  {editingNoteId ? "Editar nota" : "Nueva nota"}
                </h2>
                <p className="text-sm text-muted-foreground">Registra recordatorios o pendientes del dia.</p>
              </div>
              <Button variant="outline" className="border-[var(--border)]" onClick={() => setNoteOpen(false)}>
                Cerrar
              </Button>
            </div>

            <form onSubmit={handleSaveNote} className="mt-6 grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-sm">
                  Fecha
                  <input
                    type="date"
                    className="h-10 rounded-md border border-[var(--border)] bg-white px-3"
                    value={noteForm.date}
                    onChange={(event) => updateNoteForm("date", event.target.value)}
                    required
                  />
                </label>
                <label className="grid gap-2 text-sm">
                  Tag
                  <select
                    className="h-10 rounded-md border border-[var(--border)] bg-white px-3"
                    value={noteForm.tag}
                    onChange={(event) => updateNoteForm("tag", event.target.value)}
                  >
                    <option value="Recordatorio">Recordatorio</option>
                    <option value="Pendiente">Pendiente</option>
                    <option value="Seguimiento">Seguimiento</option>
                  </select>
                </label>
              </div>

              <label className="grid gap-2 text-sm">
                Titulo
                <input
                  type="text"
                  className="h-10 rounded-md border border-[var(--border)] bg-white px-3"
                  value={noteForm.title}
                  onChange={(event) => updateNoteForm("title", event.target.value)}
                  placeholder="Seguimiento, pendiente, recordatorio"
                  required
                />
              </label>

              <label className="grid gap-2 text-sm">
                Detalle
                <textarea
                  className="min-h-[120px] rounded-md border border-[var(--border)] bg-white px-3 py-2"
                  value={noteForm.detail}
                  onChange={(event) => updateNoteForm("detail", event.target.value)}
                  placeholder="Escribe el detalle de la nota"
                />
              </label>

              {noteError && <p className="text-sm text-rose-600">{noteError}</p>}

              <div className="flex flex-wrap justify-end gap-2">
                <Button type="button" variant="outline" className="border-[var(--border)]" onClick={() => setNoteOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={noteSaving}>
                  {noteSaving ? "Guardando..." : editingNoteId ? "Guardar cambios" : "Guardar nota"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
