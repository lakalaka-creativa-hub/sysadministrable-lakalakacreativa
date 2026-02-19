"use client";

import { useEffect, useRef, useState } from "react";
import { useBranding } from "@/components/branding-provider";
import { Button } from "@/components/ui/button";
import {
  AtSign,
  Facebook,
  Globe,
  Instagram,
  Linkedin,
  MessageCircle,
  Twitter,
  Video,
  Youtube,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/useAuth";

type RoleOption = {
  id: string;
  name: string;
};

type AppUserRow = {
  id: string;
  username: string;
  role_id: string;
  is_active: boolean;
  auth_user_id: string | null;
  roles?: { name: string } | null;
};

const translateError = (message: string) => {
  const normalized = message.toLowerCase();
  if (normalized.includes("at least 6 characters")) {
    return "La contraseña debe tener al menos 6 caracteres.";
  }
  if (normalized.includes("invalid login credentials")) {
    return "Credenciales invalidas.";
  }
  if (normalized.includes("rate limit")) {
    return "Demasiados intentos. Intenta mas tarde.";
  }
  return message;
};

export default function ConfiguracionPage() {
  const { branding, setBranding } = useBranding();
  const { roleName } = useAuth();
  const [businessName, setBusinessName] = useState(branding.businessName);
  const [logoUrl, setLogoUrl] = useState(branding.logoUrl);
  const [contactPhone, setContactPhone] = useState(branding.contactPhone);
  const [contactEmail, setContactEmail] = useState(branding.contactEmail);
  const [contactWeb, setContactWeb] = useState(branding.contactWeb);
  const [contactAddress, setContactAddress] = useState(branding.contactAddress);
  const [footerThanks, setFooterThanks] = useState(branding.footerThanks);
  const [footerInfo, setFooterInfo] = useState(branding.footerInfo);
  const [footerClosing, setFooterClosing] = useState(branding.footerClosing);
  const [terms, setTerms] = useState(branding.terms);
  const [access1Label, setAccess1Label] = useState(branding.access1Label);
  const [access1Url, setAccess1Url] = useState(branding.access1Url);
  const [access2Label, setAccess2Label] = useState(branding.access2Label);
  const [access2Url, setAccess2Url] = useState(branding.access2Url);
  const [access3Label, setAccess3Label] = useState(branding.access3Label);
  const [access3Url, setAccess3Url] = useState(branding.access3Url);
  const [access4Label, setAccess4Label] = useState(branding.access4Label);
  const [access4Url, setAccess4Url] = useState(branding.access4Url);
  const [access5Label, setAccess5Label] = useState(branding.access5Label);
  const [access5Url, setAccess5Url] = useState(branding.access5Url);
  const [social1Network, setSocial1Network] = useState(branding.social1Network);
  const [social1Value, setSocial1Value] = useState(branding.social1Value);
  const [social2Network, setSocial2Network] = useState(branding.social2Network);
  const [social2Value, setSocial2Value] = useState(branding.social2Value);
  const [social3Network, setSocial3Network] = useState(branding.social3Network);
  const [social3Value, setSocial3Value] = useState(branding.social3Value);
  const [social4Network, setSocial4Network] = useState(branding.social4Network);
  const [social4Value, setSocial4Value] = useState(branding.social4Value);
  const [themeName, setThemeName] = useState(branding.themeName);
  const [appBg, setAppBg] = useState(branding.appBg);
  const [appCard, setAppCard] = useState(branding.appCard);
  const [appPrimary, setAppPrimary] = useState(branding.appPrimary);
  const [appSecondary, setAppSecondary] = useState(branding.appSecondary);
  const [appText, setAppText] = useState(branding.appText);
  const [pdfPrimary, setPdfPrimary] = useState(branding.pdfPrimary);
  const [pdfPrimaryDark, setPdfPrimaryDark] = useState(branding.pdfPrimaryDark);
  const [pdfAccent, setPdfAccent] = useState(branding.pdfAccent);
  const [pdfSoft, setPdfSoft] = useState(branding.pdfSoft);
  const [pdfText, setPdfText] = useState(branding.pdfText);
  const [pdfTextLight, setPdfTextLight] = useState(branding.pdfTextLight);
  const [pdfBorder, setPdfBorder] = useState(branding.pdfBorder);
  const [logoFileName, setLogoFileName] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [users, setUsers] = useState<AppUserRow[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [usersError, setUsersError] = useState("");
  const [creatingUser, setCreatingUser] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("operador");
  const [resettingUserId, setResettingUserId] = useState<string | null>(null);
  const [myPassword, setMyPassword] = useState("");
  const [myPasswordConfirm, setMyPasswordConfirm] = useState("");
  const [updatingMyPassword, setUpdatingMyPassword] = useState(false);
  const [currentAuthUserId, setCurrentAuthUserId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AppUserRow | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);


  useEffect(() => {
    setBusinessName(branding.businessName);
    setLogoUrl(branding.logoUrl);
    setContactPhone(branding.contactPhone);
    setContactEmail(branding.contactEmail);
    setContactWeb(branding.contactWeb);
    setContactAddress(branding.contactAddress);
    setFooterThanks(branding.footerThanks);
    setFooterInfo(branding.footerInfo);
    setFooterClosing(branding.footerClosing);
    setTerms(branding.terms);
    setAccess1Label(branding.access1Label);
    setAccess1Url(branding.access1Url);
    setAccess2Label(branding.access2Label);
    setAccess2Url(branding.access2Url);
    setAccess3Label(branding.access3Label);
    setAccess3Url(branding.access3Url);
    setAccess4Label(branding.access4Label);
    setAccess4Url(branding.access4Url);
    setAccess5Label(branding.access5Label);
    setAccess5Url(branding.access5Url);
    setSocial1Network(branding.social1Network);
    setSocial1Value(branding.social1Value);
    setSocial2Network(branding.social2Network);
    setSocial2Value(branding.social2Value);
    setSocial3Network(branding.social3Network);
    setSocial3Value(branding.social3Value);
    setSocial4Network(branding.social4Network);
    setSocial4Value(branding.social4Value);
    setThemeName(branding.themeName);
    setAppBg(branding.appBg);
    setAppCard(branding.appCard);
    setAppPrimary(branding.appPrimary);
    setAppSecondary(branding.appSecondary);
    setAppText(branding.appText);
    setPdfPrimary(branding.pdfPrimary);
    setPdfPrimaryDark(branding.pdfPrimaryDark);
    setPdfAccent(branding.pdfAccent);
    setPdfSoft(branding.pdfSoft);
    setPdfText(branding.pdfText);
    setPdfTextLight(branding.pdfTextLight);
    setPdfBorder(branding.pdfBorder);
    setLogoFileName("");
    setLogoFile(null);
    setLogoPreviewUrl(branding.logoUrl || "");
    setErrorMessage("");
    setSuccessMessage("");
  }, [branding]);

  const previewStyle = {
    "--boho-bg": appBg,
    "--boho-card": appCard,
    "--boho-primary": appPrimary,
    "--boho-secondary": appSecondary,
    "--boho-text": appText,
    "--background": appBg,
    "--foreground": appText,
    "--card": appCard,
    "--card-foreground": appText,
    "--primary": appPrimary,
    "--secondary": appSecondary,
    "--border": "color-mix(in srgb, var(--boho-text) 18%, transparent)",
    "--ring": appPrimary,
  } as React.CSSProperties;

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    let logoUrlToSave = logoUrl.trim();

    if (logoFile) {
      const ext = logoFile.name.split(".").pop()?.toLowerCase() || "png";
      const fileName = `logo-${Date.now()}.${ext}`;
      const filePath = `logos/${fileName}`;

      const { error: uploadError } = await supabase
        .storage
        .from("branding")
        .upload(filePath, logoFile, { upsert: true, contentType: logoFile.type });

      if (uploadError) {
        setErrorMessage("No se pudo subir el logo. Intenta de nuevo.");
        setSaving(false);
        return;
      }

      const { data: publicData } = supabase
        .storage
        .from("branding")
        .getPublicUrl(filePath);
      logoUrlToSave = publicData.publicUrl;
    }

    const payload = {
      id: "default",
      business_name: businessName.trim(),
      logo_url: logoUrlToSave,
      contact_phone: contactPhone.trim(),
      contact_email: contactEmail.trim(),
      contact_web: contactWeb.trim(),
      contact_address: contactAddress.trim(),
      footer_thanks: footerThanks.trim(),
      footer_info: footerInfo.trim(),
      footer_closing: footerClosing.trim(),
      terms: terms.trim(),
      access_1_label: access1Label.trim(),
      access_1_url: access1Url.trim(),
      access_2_label: access2Label.trim(),
      access_2_url: access2Url.trim(),
      access_3_label: access3Label.trim(),
      access_3_url: access3Url.trim(),
      access_4_label: access4Label.trim(),
      access_4_url: access4Url.trim(),
      access_5_label: access5Label.trim(),
      access_5_url: access5Url.trim(),
      social_1_network: social1Network.trim(),
      social_1_value: social1Value.trim(),
      social_2_network: social2Network.trim(),
      social_2_value: social2Value.trim(),
      social_3_network: social3Network.trim(),
      social_3_value: social3Value.trim(),
      social_4_network: social4Network.trim(),
      social_4_value: social4Value.trim(),
      theme_name: themeName,
      app_bg: appBg,
      app_card: appCard,
      app_primary: appPrimary,
      app_secondary: appSecondary,
      app_text: appText,
      pdf_primary: pdfPrimary,
      pdf_primary_dark: pdfPrimaryDark,
      pdf_accent: pdfAccent,
      pdf_soft: pdfSoft,
      pdf_text: pdfText,
      pdf_text_light: pdfTextLight,
      pdf_border: pdfBorder,
    };

    const { error: saveError } = await supabase
      .from("branding_settings")
      .upsert(payload, { onConflict: "id" });

    if (saveError) {
      setErrorMessage("No se pudo guardar la configuración.");
      setSuccessMessage("");
      setSaving(false);
      return;
    }

    setBranding({
      businessName: payload.business_name,
      logoUrl: payload.logo_url,
      contactPhone: payload.contact_phone,
      contactEmail: payload.contact_email,
      contactWeb: payload.contact_web,
      contactAddress: payload.contact_address,
      footerThanks: payload.footer_thanks,
      footerInfo: payload.footer_info,
      footerClosing: payload.footer_closing,
      terms: payload.terms,
      access1Label: payload.access_1_label,
      access1Url: payload.access_1_url,
      access2Label: payload.access_2_label,
      access2Url: payload.access_2_url,
      access3Label: payload.access_3_label,
      access3Url: payload.access_3_url,
      access4Label: payload.access_4_label,
      access4Url: payload.access_4_url,
      access5Label: payload.access_5_label,
      access5Url: payload.access_5_url,
      social1Network: payload.social_1_network,
      social1Value: payload.social_1_value,
      social2Network: payload.social_2_network,
      social2Value: payload.social_2_value,
      social3Network: payload.social_3_network,
      social3Value: payload.social_3_value,
      social4Network: payload.social_4_network,
      social4Value: payload.social_4_value,
      themeName: payload.theme_name,
      appBg: payload.app_bg,
      appCard: payload.app_card,
      appPrimary: payload.app_primary,
      appSecondary: payload.app_secondary,
      appText: payload.app_text,
      pdfPrimary: payload.pdf_primary,
      pdfPrimaryDark: payload.pdf_primary_dark,
      pdfAccent: payload.pdf_accent,
      pdfSoft: payload.pdf_soft,
      pdfText: payload.pdf_text,
      pdfTextLight: payload.pdf_text_light,
      pdfBorder: payload.pdf_border,
    });

    setLogoUrl(payload.logo_url);
    setLogoFile(null);
    setLogoFileName("");
    setLogoPreviewUrl(payload.logo_url || "");
    setSuccessMessage("Guardado con éxito");
    setSaving(false);
  };

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!/(image\/png|image\/jpeg)/.test(file.type)) {
      alert("Solo se permiten imágenes PNG o JPG.");
      event.target.value = "";
      return;
    }

    setLogoFileName(file.name);
    setLogoFile(file);

    const objectUrl = URL.createObjectURL(file);
    setLogoPreviewUrl((prev) => {
      if (prev && prev.startsWith("blob:")) {
        URL.revokeObjectURL(prev);
      }
      return objectUrl;
    });

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setLogoUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const hasLogo = Boolean(logoPreviewUrl || logoUrl);

  const themeOptions = [
    {
      key: "system",
      name: "Sistema",
      app: {
        bg: "#f2f4f8",
        card: "#ffffff",
        primary: "#1d4ed8",
        secondary: "#0f172a",
        text: "#0b1120",
      },
      pdf: {
        primary: "#1d4ed8",
        primaryDark: "#1e3a8a",
        accent: "#60a5fa",
        soft: "#f1f5f9",
        text: "#0b1120",
        textLight: "#334155",
        border: "#cbd5f5",
      },
    },
    {
      key: "boho",
      name: "Boho",
      app: {
        bg: "#f5f1eb",
        card: "#ffffff",
        primary: "#c97c5d",
        secondary: "#7a8f7a",
        text: "#3b2f2f",
      },
      pdf: {
        primary: "#b46e50",
        primaryDark: "#96553c",
        accent: "#dcb4a0",
        soft: "#fcf8f4",
        text: "#3c322d",
        textLight: "#826e64",
        border: "#e6d2c3",
      },
    },
    {
      key: "vulcano",
      name: "Vulcano",
      app: {
        bg: "#fff7f7",
        card: "#ffffff",
        primary: "#b91c1c",
        secondary: "#ef4444",
        text: "#3f1d1d",
      },
      pdf: {
        primary: "#b91c1c",
        primaryDark: "#7f1d1d",
        accent: "#fca5a5",
        soft: "#fff5f5",
        text: "#3f1d1d",
        textLight: "#7f1d1d",
        border: "#fecaca",
      },
    },
    {
      key: "blackwhite",
      name: "Black and White",
      app: {
        bg: "#f5f5f5",
        card: "#ffffff",
        primary: "#111111",
        secondary: "#6b7280",
        text: "#111111",
      },
      pdf: {
        primary: "#111111",
        primaryDark: "#000000",
        accent: "#d1d5db",
        soft: "#f9fafb",
        text: "#111111",
        textLight: "#6b7280",
        border: "#e5e7eb",
      },
    },
    {
      key: "nebula",
      name: "Nebula",
      app: {
        bg: "#f8f5ff",
        card: "#ffffff",
        primary: "#7c3aed",
        secondary: "#ec4899",
        text: "#2b1b3f",
      },
      pdf: {
        primary: "#7c3aed",
        primaryDark: "#5b21b6",
        accent: "#f472b6",
        soft: "#f7f1ff",
        text: "#2b1b3f",
        textLight: "#6b4c8a",
        border: "#e9d5ff",
      },
    },
    {
      key: "gold",
      name: "Gold",
      app: {
        bg: "#fffaf0",
        card: "#ffffff",
        primary: "#d97706",
        secondary: "#f59e0b",
        text: "#3a2a12",
      },
      pdf: {
        primary: "#d97706",
        primaryDark: "#92400e",
        accent: "#fcd34d",
        soft: "#fffbeb",
        text: "#3a2a12",
        textLight: "#8a5b2a",
        border: "#fde68a",
      },
    },
    {
      key: "neonpop",
      name: "Neon Pop",
      app: {
        bg: "#f4fff9",
        card: "#ffffff",
        primary: "#ff2d55",
        secondary: "#00e5ff",
        text: "#120a22",
      },
      pdf: {
        primary: "#ff2d55",
        primaryDark: "#b80036",
        accent: "#7cff2a",
        soft: "#fff0f6",
        text: "#120a22",
        textLight: "#4a2b6b",
        border: "#ffd1e8",
      },
    },
    {
      key: "emerald",
      name: "Emerald",
      app: {
        bg: "#f0fdf4",
        card: "#ffffff",
        primary: "#059669",
        secondary: "#0f766e",
        text: "#052e16",
      },
      pdf: {
        primary: "#059669",
        primaryDark: "#047857",
        accent: "#6ee7b7",
        soft: "#ecfdf5",
        text: "#052e16",
        textLight: "#166534",
        border: "#a7f3d0",
      },
    },
    {
      key: "aurora",
      name: "Aurora",
      app: {
        bg: "#f5f7ff",
        card: "#ffffff",
        primary: "#3b82f6",
        secondary: "#06b6d4",
        text: "#0b1324",
      },
      pdf: {
        primary: "#3b82f6",
        primaryDark: "#1d4ed8",
        accent: "#67e8f9",
        soft: "#eff6ff",
        text: "#0b1324",
        textLight: "#475569",
        border: "#bfdbfe",
      },
    },
    {
      key: "royal",
      name: "Royal",
      app: {
        bg: "#f5f3ff",
        card: "#ffffff",
        primary: "#4338ca",
        secondary: "#7c3aed",
        text: "#1f1147",
      },
      pdf: {
        primary: "#4338ca",
        primaryDark: "#312e81",
        accent: "#a78bfa",
        soft: "#f3f0ff",
        text: "#1f1147",
        textLight: "#4c1d95",
        border: "#ddd6fe",
      },
    },
    {
      key: "terracotta",
      name: "Terracotta",
      app: {
        bg: "#fff7f2",
        card: "#ffffff",
        primary: "#c2410c",
        secondary: "#f97316",
        text: "#3b1f14",
      },
      pdf: {
        primary: "#c2410c",
        primaryDark: "#9a3412",
        accent: "#fdba74",
        soft: "#fff3e8",
        text: "#3b1f14",
        textLight: "#7c2d12",
        border: "#fed7aa",
      },
    },
    {
      key: "sunset",
      name: "Sunset",
      app: {
        bg: "#fff7ed",
        card: "#ffffff",
        primary: "#ea580c",
        secondary: "#f97316",
        text: "#431407",
      },
      pdf: {
        primary: "#ea580c",
        primaryDark: "#c2410c",
        accent: "#fdba74",
        soft: "#fff1e6",
        text: "#431407",
        textLight: "#7c2d12",
        border: "#fed7aa",
      },
    },
    {
      key: "ocean",
      name: "Ocean",
      app: {
        bg: "#f0f9ff",
        card: "#ffffff",
        primary: "#0284c7",
        secondary: "#0ea5e9",
        text: "#0f172a",
      },
      pdf: {
        primary: "#0284c7",
        primaryDark: "#0369a1",
        accent: "#7dd3fc",
        soft: "#eaf6ff",
        text: "#0f172a",
        textLight: "#475569",
        border: "#bae6fd",
      },
    },
    {
      key: "linen",
      name: "Linen",
      app: {
        bg: "#faf7f2",
        card: "#ffffff",
        primary: "#a16207",
        secondary: "#6b7280",
        text: "#2d241b",
      },
      pdf: {
        primary: "#a16207",
        primaryDark: "#7c4a07",
        accent: "#facc15",
        soft: "#fff8eb",
        text: "#2d241b",
        textLight: "#6b5b4f",
        border: "#f1e4d1",
      },
    },
    {
      key: "slate",
      name: "Slate",
      app: {
        bg: "#f8fafc",
        card: "#ffffff",
        primary: "#0f172a",
        secondary: "#475569",
        text: "#0b1220",
      },
      pdf: {
        primary: "#0f172a",
        primaryDark: "#020617",
        accent: "#94a3b8",
        soft: "#f1f5f9",
        text: "#0b1220",
        textLight: "#334155",
        border: "#cbd5e1",
      },
    },
    {
      key: "cacao",
      name: "Cacao",
      app: {
        bg: "#f7f3f0",
        card: "#ffffff",
        primary: "#6b3f2a",
        secondary: "#a16207",
        text: "#2a1b14",
      },
      pdf: {
        primary: "#6b3f2a",
        primaryDark: "#4a2c1e",
        accent: "#f5d0b5",
        soft: "#fdf6f1",
        text: "#2a1b14",
        textLight: "#6b4f3f",
        border: "#edd7c9",
      },
    },
    {
      key: "coral",
      name: "Coral",
      app: {
        bg: "#fff1f2",
        card: "#ffffff",
        primary: "#e11d48",
        secondary: "#f43f5e",
        text: "#4c0519",
      },
      pdf: {
        primary: "#e11d48",
        primaryDark: "#be123c",
        accent: "#fda4af",
        soft: "#fff0f3",
        text: "#4c0519",
        textLight: "#881337",
        border: "#fecdd3",
      },
    },
    {
      key: "sage",
      name: "Sage",
      app: {
        bg: "#f3f7f2",
        card: "#ffffff",
        primary: "#4d7c63",
        secondary: "#6b8f71",
        text: "#1f2d25",
      },
      pdf: {
        primary: "#4d7c63",
        primaryDark: "#3b5f4c",
        accent: "#b7d4c4",
        soft: "#f3faf6",
        text: "#1f2d25",
        textLight: "#4b5f54",
        border: "#d6e6dc",
      },
    },
    {
      key: "forest",
      name: "Forest",
      app: {
        bg: "#f1f5f2",
        card: "#ffffff",
        primary: "#166534",
        secondary: "#15803d",
        text: "#0f2f1c",
      },
      pdf: {
        primary: "#166534",
        primaryDark: "#14532d",
        accent: "#86efac",
        soft: "#f0fdf4",
        text: "#0f2f1c",
        textLight: "#14532d",
        border: "#bbf7d0",
      },
    },
    {
      key: "laguna",
      name: "Laguna",
      app: {
        bg: "#eefbff",
        card: "#ffffff",
        primary: "#0ea5a5",
        secondary: "#14b8a6",
        text: "#0b2d2d",
      },
      pdf: {
        primary: "#0ea5a5",
        primaryDark: "#0f766e",
        accent: "#5eead4",
        soft: "#e6fffb",
        text: "#0b2d2d",
        textLight: "#3b6b6b",
        border: "#b2f5ea",
      },
    },
    {
      key: "obsidiana",
      name: "Obsidiana",
      app: {
        bg: "#f4f4f5",
        card: "#ffffff",
        primary: "#111827",
        secondary: "#374151",
        text: "#0b0f19",
      },
      pdf: {
        primary: "#111827",
        primaryDark: "#0b1220",
        accent: "#9ca3af",
        soft: "#f5f6f8",
        text: "#0b0f19",
        textLight: "#4b5563",
        border: "#d1d5db",
      },
    },
    {
      key: "citrus",
      name: "Citrus",
      app: {
        bg: "#fffceb",
        card: "#ffffff",
        primary: "#eab308",
        secondary: "#f97316",
        text: "#3b2a04",
      },
      pdf: {
        primary: "#eab308",
        primaryDark: "#ca8a04",
        accent: "#fde047",
        soft: "#fff9db",
        text: "#3b2a04",
        textLight: "#7a5c0a",
        border: "#fde68a",
      },
    },
    {
      key: "lavanda",
      name: "Lavanda",
      app: {
        bg: "#f8f5ff",
        card: "#ffffff",
        primary: "#8b5cf6",
        secondary: "#a78bfa",
        text: "#2b1b3f",
      },
      pdf: {
        primary: "#8b5cf6",
        primaryDark: "#6d28d9",
        accent: "#c4b5fd",
        soft: "#f3efff",
        text: "#2b1b3f",
        textLight: "#5b4b7a",
        border: "#ddd6fe",
      },
    },
    {
      key: "bonsai",
      name: "CMYK",
      app: {
        bg: "#f2d65f",
        card: "#fff4c8",
        primary: "#00a9c0",
        secondary: "#f03a9d",
        text: "#2c1e0a",
      },
      pdf: {
        primary: "#00a9c0",
        primaryDark: "#007b90",
        accent: "#ffd64a",
        soft: "#fff3bf",
        text: "#2c1e0a",
        textLight: "#6b4f12",
        border: "#d9b63a",
      },
    },
    {
      key: "rose",
      name: "Rose",
      app: {
        bg: "#fff5f7",
        card: "#ffffff",
        primary: "#db2777",
        secondary: "#f472b6",
        text: "#3b0a1d",
      },
      pdf: {
        primary: "#db2777",
        primaryDark: "#9d174d",
        accent: "#fbcfe8",
        soft: "#fff0f6",
        text: "#3b0a1d",
        textLight: "#7a2a4a",
        border: "#f9a8d4",
      },
    },
  ];

  const applyTheme = (key: string) => {
    const theme = themeOptions.find((t) => t.key === key);
    if (!theme) return;
    setThemeName(theme.key);
    setAppBg(theme.app.bg);
    setAppCard(theme.app.card);
    setAppPrimary(theme.app.primary);
    setAppSecondary(theme.app.secondary);
    setAppText(theme.app.text);
    setPdfPrimary(theme.pdf.primary);
    setPdfPrimaryDark(theme.pdf.primaryDark);
    setPdfAccent(theme.pdf.accent);
    setPdfSoft(theme.pdf.soft);
    setPdfText(theme.pdf.text);
    setPdfTextLight(theme.pdf.textLight);
    setPdfBorder(theme.pdf.border);
  };

  const socialOptions = [
    { value: "whatsapp", label: "WhatsApp", Icon: MessageCircle },
    { value: "instagram", label: "Instagram", Icon: Instagram },
    { value: "facebook", label: "Facebook", Icon: Facebook },
    { value: "tiktok", label: "TikTok", Icon: Video },
    { value: "x", label: "X", Icon: Twitter },
    { value: "youtube", label: "YouTube", Icon: Youtube },
    { value: "linkedin", label: "LinkedIn", Icon: Linkedin },
    { value: "web", label: "Web", Icon: Globe },
    { value: "otro", label: "Otro", Icon: AtSign },
  ];

  const getSocialIcon = (value: string) => {
    return socialOptions.find((opt) => opt.value === value)?.Icon || AtSign;
  };

  const loadRolesUsers = async () => {
    setLoadingUsers(true);
    setUsersError("");

    const { data: authData } = await supabase.auth.getUser();
    setCurrentAuthUserId(authData.user?.id ?? null);

    const [{ data: rolesData, error: rolesError }, { data: usersData, error: usersError }] = await Promise.all([
      supabase.from("roles").select("id, name").order("name"),
      supabase
        .from("app_users")
        .select("id, username, role_id, is_active, auth_user_id")
        .order("created_at", { ascending: true }),
    ]);

    if (rolesError) {
      setUsersError(translateError(rolesError.message || "No se pudieron cargar los roles."));
    } else {
      const nextRoles = rolesData || [];
      setRoles(nextRoles);
      if (nextRoles.length && !nextRoles.find((r) => r.name === newRole)) {
        setNewRole(nextRoles[0].name);
      }
    }

    if (usersError) {
      setUsersError(translateError(usersError.message || "No se pudieron cargar los usuarios."));
    } else {
      const nextRoles = rolesData || [];
      const nextUsers = (usersData || []).map((user) => {
        const role = nextRoles.find((r) => r.id === user.role_id);
        return {
          ...user,
          roles: role ? { name: role.name } : null,
        };
      });
      setUsers(nextUsers);
    }

    setLoadingUsers(false);
  };

  const getAccessToken = async () => {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) return "";
    if (sessionData.session?.access_token) return sessionData.session.access_token;

    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError) return "";
    return refreshData.session?.access_token ?? "";
  };

  const handleCreateUser = async () => {
    if (creatingUser) return;
    if (!newUsername.trim() || !newPassword.trim() || !newRole) {
      setUsersError("Completa usuario, contraseña y rol.");
      return;
    }

    setCreatingUser(true);
    setUsersError("");

    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData.session;
    if (!session?.access_token) {
      setUsersError("Sesión expirada. Inicia sesión de nuevo.");
      setCreatingUser(false);
      return;
    }

    const { data, error } = await supabase.functions.invoke("create-app-user", {
      body: { username: newUsername.trim(), password: newPassword.trim(), role: newRole },
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (error || !data?.ok) {
      const rawMessage = error?.message || (data as any)?.error || "No se pudo crear el usuario.";
      setUsersError(translateError(rawMessage));
      setCreatingUser(false);
      return;
    }

    setNewUsername("");
    setNewPassword("");
    await loadRolesUsers();
    setCreatingUser(false);
  };

  const handleToggleUser = async (user: AppUserRow) => {
    const next = !user.is_active;
    const { error } = await supabase
      .from("app_users")
      .update({ is_active: next })
      .eq("id", user.id);

    if (error) {
      setUsersError("No se pudo actualizar el estado.");
      return;
    }

    setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, is_active: next } : u)));
  };

  const handleChangeRole = async (user: AppUserRow, roleId: string) => {
    const { error } = await supabase
      .from("app_users")
      .update({ role_id: roleId })
      .eq("id", user.id);

    if (error) {
      setUsersError("No se pudo actualizar el rol.");
      return;
    }

    const role = roles.find((r) => r.id === roleId);
    setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, role_id: roleId, roles: role ? { name: role.name } : u.roles } : u)));
  };

  const handleResetPassword = async (user: AppUserRow) => {
    if (!user.auth_user_id) {
      setUsersError("El usuario no tiene auth_user_id.");
      return;
    }
    const next = window.prompt(`Nueva contraseña para ${user.username}`);
    if (!next) return;

    setResettingUserId(user.id);
    setUsersError("");

    const accessToken = await getAccessToken();
    if (!accessToken) {
      setUsersError("Sesión expirada. Inicia sesión de nuevo.");
      setResettingUserId(null);
      return;
    }

    const { data, error } = await supabase.functions.invoke("update-app-user", {
      body: { userId: user.auth_user_id, password: next },
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (error || !data?.ok) {
      const rawMessage = error?.message || (data as any)?.error || "No se pudo actualizar la contraseña.";
      setUsersError(translateError(rawMessage));
      setResettingUserId(null);
      return;
    }

    setResettingUserId(null);
  };

  const handleDeleteUser = async () => {
    if (!deleteTarget) return;
    if (deletingUserId) return;

    const accessToken = await getAccessToken();
    if (!accessToken) {
      setUsersError("Sesión expirada. Inicia sesión de nuevo.");
      return;
    }

    setDeletingUserId(deleteTarget.id);
    setUsersError("");

    const { data, error } = await supabase.functions.invoke("delete-app-user", {
      body: { appUserId: deleteTarget.id, authUserId: deleteTarget.auth_user_id },
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (error || !data?.ok) {
      const rawMessage = error?.message || (data as any)?.error || "No se pudo eliminar el usuario.";
      setUsersError(translateError(rawMessage));
      setDeletingUserId(null);
      return;
    }

    setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
    setDeleteTarget(null);
    setDeletingUserId(null);
  };

  const handleUpdateMyPassword = async () => {
    if (updatingMyPassword) return;
    if (!myPassword.trim() || myPassword !== myPasswordConfirm) {
      setUsersError("Las contraseñas no coinciden.");
      return;
    }

    setUpdatingMyPassword(true);
    setUsersError("");
    const { error } = await supabase.auth.updateUser({ password: myPassword.trim() });
    if (error) {
      setUsersError(translateError(error.message || "No se pudo actualizar tu contraseña."));
      setUpdatingMyPassword(false);
      return;
    }

    setMyPassword("");
    setMyPasswordConfirm("");
    setUpdatingMyPassword(false);
  };

  useEffect(() => {
    loadRolesUsers();
  }, []);

  return (
    <div
      className="min-h-screen space-y-6 bg-[var(--boho-bg)] text-[var(--boho-text)]"
      style={previewStyle}
    >
      <div>
        <h1 className="text-2xl font-semibold text-[var(--boho-text)]">Configuración</h1>
        <p className="text-sm text-gray-600">
          Personaliza el negocio y administra accesos básicos.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <section className="rounded border bg-white p-4 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Branding</h2>
            <p className="text-sm text-gray-600">
              Identidad del negocio.
            </p>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-sm mb-1 text-gray-700">Nombre del negocio</label>
              <input
                className="w-full rounded-lg border px-3 py-2"
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Escribe el nombre del negocio"
              />
            </div>
            <div>
              <label className="block text-sm mb-1 text-gray-700">Logo (PNG o JPG)</label>
              <div className="flex items-center gap-3">
                <input
                  ref={fileInputRef}
                  className="hidden"
                  type="file"
                  accept="image/png,image/jpeg"
                  onChange={handleLogoChange}
                />
                <Button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-[var(--boho-primary)] text-white hover:opacity-90"
                >
                  Explorar
                </Button>
                <span className="text-sm text-gray-600">
                  {logoFileName || "Ningun archivo seleccionado"}
                </span>
              </div>
              {hasLogo ? (
                <div className="mt-3 flex items-center gap-3">
                  <img
                    src={logoPreviewUrl || logoUrl}
                    alt="Logo actual"
                    className="h-16 w-16 rounded-xl object-cover border"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setLogoUrl("");
                      setLogoFileName("");
                      setLogoFile(null);
                      setLogoPreviewUrl("");
                      if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                      }
                    }}
                  >
                    Quitar logo
                  </Button>
                </div>
              ) : (
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-black text-white">
                    <span className="text-lg">:)</span>
                  </div>
                  <span className="text-xs text-gray-500">Logo de ejemplo</span>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="rounded border bg-white p-4 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Datos del negocio</h2>
            <p className="text-sm text-gray-600">
              Informacion que aparece en la nota de remision.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="block text-sm mb-1 text-gray-700">Teléfono</label>
              <input
                className="w-full rounded-lg border px-3 py-2"
                type="text"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="Ej. 55 1234 5678"
              />
            </div>
            <div>
              <label className="block text-sm mb-1 text-gray-700">Correo</label>
              <input
                className="w-full rounded-lg border px-3 py-2"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="ejemplo@correo.com"
              />
            </div>
            <div>
              <label className="block text-sm mb-1 text-gray-700">Sitio web</label>
              <input
                className="w-full rounded-lg border px-3 py-2"
                type="text"
                value={contactWeb}
                onChange={(e) => setContactWeb(e.target.value)}
                placeholder="www.tusitio.com"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm mb-1 text-gray-700">Dirección</label>
              <input
                className="w-full rounded-lg border px-3 py-2"
                type="text"
                value={contactAddress}
                onChange={(e) => setContactAddress(e.target.value)}
                placeholder="Calle, numero, ciudad"
              />
            </div>
          </div>
        </section>

        <section className="rounded border bg-white p-4 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Textos de la nota</h2>
            <p className="text-sm text-gray-600">
              Mensajes y terminos visibles en el PDF.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="block text-sm mb-1 text-gray-700">Mensaje de agradecimiento</label>
              <input
                className="w-full rounded-lg border px-3 py-2"
                type="text"
                value={footerThanks}
                onChange={(e) => setFooterThanks(e.target.value)}
                placeholder="Ej. Gracias por tu preferencia"
              />
            </div>
            <div>
              <label className="block text-sm mb-1 text-gray-700">Informacion adicional</label>
              <textarea
                className="w-full rounded-lg border px-3 py-2 min-h-[90px]"
                value={footerInfo}
                onChange={(e) => setFooterInfo(e.target.value)}
                placeholder="Ej. Horarios, politicas o notas importantes"
              />
            </div>
            <div>
              <label className="block text-sm mb-1 text-gray-700">Mensaje final</label>
              <input
                className="w-full rounded-lg border px-3 py-2"
                type="text"
                value={footerClosing}
                onChange={(e) => setFooterClosing(e.target.value)}
                placeholder="Ej. Esperamos verte pronto"
              />
            </div>
            <div>
              <label className="block text-sm mb-1 text-gray-700">Terminos y condiciones</label>
              <textarea
                className="w-full rounded-lg border px-3 py-2 min-h-[120px]"
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                placeholder="Escribe los terminos de tu negocio"
              />
            </div>
          </div>
        </section>

        <section className="rounded border bg-white p-4 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Redes sociales</h2>
            <p className="text-sm text-gray-600">
              Accesos y usuarios visibles en el PDF.
            </p>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-sm mb-1 text-gray-700">Red 1</label>
              <div className="flex items-center gap-2">
                {(() => {
                  const Icon = getSocialIcon(social1Network);
                  return <Icon className="h-4 w-4 text-gray-500" aria-hidden />;
                })()}
                <select
                  className="w-28 rounded-lg border px-2 py-2 text-sm"
                  value={social1Network}
                  onChange={(e) => setSocial1Network(e.target.value)}
                >
                  <option value="">Selecciona</option>
                  {socialOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <input
                  className="w-full rounded-lg border px-3 py-2"
                  type="text"
                  value={social1Value}
                  onChange={(e) => setSocial1Value(e.target.value)}
                  placeholder="usuario, URL o teléfono"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm mb-1 text-gray-700">Red 2</label>
              <div className="flex items-center gap-2">
                {(() => {
                  const Icon = getSocialIcon(social2Network);
                  return <Icon className="h-4 w-4 text-gray-500" aria-hidden />;
                })()}
                <select
                  className="w-28 rounded-lg border px-2 py-2 text-sm"
                  value={social2Network}
                  onChange={(e) => setSocial2Network(e.target.value)}
                >
                  <option value="">Selecciona</option>
                  {socialOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <input
                  className="w-full rounded-lg border px-3 py-2"
                  type="text"
                  value={social2Value}
                  onChange={(e) => setSocial2Value(e.target.value)}
                  placeholder="usuario, URL o teléfono"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm mb-1 text-gray-700">Red 3</label>
              <div className="flex items-center gap-2">
                {(() => {
                  const Icon = getSocialIcon(social3Network);
                  return <Icon className="h-4 w-4 text-gray-500" aria-hidden />;
                })()}
                <select
                  className="w-28 rounded-lg border px-2 py-2 text-sm"
                  value={social3Network}
                  onChange={(e) => setSocial3Network(e.target.value)}
                >
                  <option value="">Selecciona</option>
                  {socialOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <input
                  className="w-full rounded-lg border px-3 py-2"
                  type="text"
                  value={social3Value}
                  onChange={(e) => setSocial3Value(e.target.value)}
                  placeholder="usuario, URL o teléfono"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm mb-1 text-gray-700">Red 4</label>
              <div className="flex items-center gap-2">
                {(() => {
                  const Icon = getSocialIcon(social4Network);
                  return <Icon className="h-4 w-4 text-gray-500" aria-hidden />;
                })()}
                <select
                  className="w-28 rounded-lg border px-2 py-2 text-sm"
                  value={social4Network}
                  onChange={(e) => setSocial4Network(e.target.value)}
                >
                  <option value="">Selecciona</option>
                  {socialOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <input
                  className="w-full rounded-lg border px-3 py-2"
                  type="text"
                  value={social4Value}
                  onChange={(e) => setSocial4Value(e.target.value)}
                  placeholder="usuario, URL o teléfono"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="rounded border bg-white p-4 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Accesos</h2>
            <p className="text-sm text-gray-600">
              Personaliza hasta 5 botones. Deja en blanco para ocultar.
            </p>
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="text-sm font-semibold text-gray-700">Boton 1</div>
                <div className="text-xs text-gray-500">Nombre</div>
                <input
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  type="text"
                  value={access1Label}
                  onChange={(e) => setAccess1Label(e.target.value)}
                  placeholder="Nombre"
                  aria-label="Nombre del boton 1"
                />
                <div className="text-xs text-gray-500">Vinculo</div>
                <input
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  type="text"
                  value={access1Url}
                  onChange={(e) => setAccess1Url(e.target.value)}
                  placeholder="https://..."
                  aria-label="Vinculo del boton 1"
                />
              </div>
              <div className="space-y-2">
                <div className="text-sm font-semibold text-gray-700">Boton 2</div>
                <div className="text-xs text-gray-500">Nombre</div>
                <input
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  type="text"
                  value={access2Label}
                  onChange={(e) => setAccess2Label(e.target.value)}
                  placeholder="Nombre"
                  aria-label="Nombre del boton 2"
                />
                <div className="text-xs text-gray-500">Vinculo</div>
                <input
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  type="text"
                  value={access2Url}
                  onChange={(e) => setAccess2Url(e.target.value)}
                  placeholder="https://..."
                  aria-label="Vinculo del boton 2"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="text-sm font-semibold text-gray-700">Boton 3</div>
                <div className="text-xs text-gray-500">Nombre</div>
                <input
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  type="text"
                  value={access3Label}
                  onChange={(e) => setAccess3Label(e.target.value)}
                  placeholder="Nombre"
                  aria-label="Nombre del boton 3"
                />
                <div className="text-xs text-gray-500">Vinculo</div>
                <input
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  type="text"
                  value={access3Url}
                  onChange={(e) => setAccess3Url(e.target.value)}
                  placeholder="https://..."
                  aria-label="Vinculo del boton 3"
                />
              </div>
              <div className="space-y-2">
                <div className="text-sm font-semibold text-gray-700">Boton 4</div>
                <div className="text-xs text-gray-500">Nombre</div>
                <input
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  type="text"
                  value={access4Label}
                  onChange={(e) => setAccess4Label(e.target.value)}
                  placeholder="Nombre"
                  aria-label="Nombre del boton 4"
                />
                <div className="text-xs text-gray-500">Vinculo</div>
                <input
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  type="text"
                  value={access4Url}
                  onChange={(e) => setAccess4Url(e.target.value)}
                  placeholder="https://..."
                  aria-label="Vinculo del boton 4"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="space-y-2">
                <div className="text-sm font-semibold text-gray-700">Boton 5</div>
                <div className="text-xs text-gray-500">Nombre</div>
                <input
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  type="text"
                  value={access5Label}
                  onChange={(e) => setAccess5Label(e.target.value)}
                  placeholder="Nombre"
                  aria-label="Nombre del boton 5"
                />
                <div className="text-xs text-gray-500">Vinculo</div>
                <input
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  type="text"
                  value={access5Url}
                  onChange={(e) => setAccess5Url(e.target.value)}
                  placeholder="https://..."
                  aria-label="Vinculo del boton 5"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="rounded border bg-white p-4 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Temas</h2>
            <p className="text-sm text-gray-600">
              Elige un estilo para la app y la nota de remision.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {themeOptions.map((theme) => {
              const isActive = themeName === theme.key;
              return (
                <button
                  key={theme.key}
                  type="button"
                  onClick={() => applyTheme(theme.key)}
                  className={
                    "rounded-md border p-2 text-left transition " +
                    (isActive ? "border-gray-900" : "border-gray-200 hover:border-gray-400")
                  }
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-gray-800 truncate">{theme.name}</span>
                    {isActive ? (
                      <span className="text-[10px] font-medium text-gray-900">Activo</span>
                    ) : null}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <span
                      className="h-4 w-4 rounded-full border"
                      style={{ backgroundColor: theme.app.primary }}
                    />
                    <span
                      className="h-4 w-4 rounded-full border"
                      style={{ backgroundColor: theme.app.secondary }}
                    />
                    <span
                      className="h-4 w-4 rounded-full border"
                      style={{ backgroundColor: theme.app.card }}
                    />
                    <span
                      className="h-4 w-4 rounded-full border"
                      style={{ backgroundColor: theme.app.bg }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
          {errorMessage ? (
            <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMessage}
            </div>
          ) : null}
        </section>

        <div className="md:col-span-2 flex items-center gap-3">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-[var(--boho-primary)] text-white hover:opacity-90"
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </Button>
          {successMessage ? (
            <span className="text-sm text-[var(--boho-secondary)]">{successMessage}</span>
          ) : null}
          {errorMessage ? (
            <span className="text-sm text-red-600">{errorMessage}</span>
          ) : null}
        </div>

        <section className="rounded border bg-white p-4 space-y-4 md:col-span-2">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Usuarios</h2>
            <p className="text-sm text-gray-600">
              Administra roles y contraseñas de acceso.
            </p>
          </div>

          {usersError ? (
            <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {usersError}
            </div>
          ) : null}

          <div className="rounded border bg-gray-50 p-3 space-y-2">
            <div className="text-sm font-semibold text-gray-700">Crear usuario</div>
            <p className="text-xs text-gray-500">
              El usuario ingresa con este nombre y contraseña. Puedes cambiar el rol después.
            </p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              <div>
                <label className="block text-xs text-gray-500">Usuario</label>
                <input
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="Nombre de usuario"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500">Contraseña</label>
                <input
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="********"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500">Rol</label>
                <select
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                >
                  {roles.map((role) => (
                    <option key={role.id} value={role.name}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleCreateUser}
                  disabled={creatingUser}
                  className="w-full rounded bg-[var(--boho-primary)] px-3 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                >
                  {creatingUser ? "Creando..." : "Agregar usuario"}
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-semibold text-gray-700">Usuarios existentes</div>
            <p className="text-xs text-gray-500">
              Cambia el rol, activa/inactiva o restablece la contraseña.
            </p>
          </div>

          <div className="rounded border">
            {loadingUsers ? (
              <div className="p-3 text-sm text-gray-500">Cargando usuarios...</div>
            ) : users.length === 0 ? (
              <div className="p-3 text-sm text-gray-500">Sin usuarios registrados.</div>
            ) : (
              <div className="divide-y">
                {users.map((user) => {
                  const isCurrent = Boolean(
                    currentAuthUserId && user.auth_user_id === currentAuthUserId
                  );
                  return (
                    <div key={user.id} className="flex flex-wrap items-center justify-between gap-3 px-3 py-2">
                      <div className="min-w-[160px]">
                        <div className="text-sm font-medium text-gray-900">{user.username}</div>
                        <div className="text-xs text-gray-500">
                          {user.roles?.name || "sin rol"}
                          {isCurrent ? " · Tu cuenta" : ""}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          className="rounded border px-2 py-1 text-xs"
                          value={user.role_id}
                          onChange={(e) => handleChangeRole(user, e.target.value)}
                        >
                          {roles.map((role) => (
                            <option key={role.id} value={role.id}>
                              {role.name}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => handleToggleUser(user)}
                          disabled={isCurrent}
                          className={`rounded border px-2 py-1 text-xs ${
                            user.is_active
                              ? "border-[var(--boho-secondary)] text-[var(--boho-secondary)]"
                              : "border-gray-300 text-gray-500"
                          } ${isCurrent ? "opacity-50 cursor-not-allowed" : "hover:opacity-80"}`}
                        >
                          {user.is_active ? "Activo" : "Inactivo"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleResetPassword(user)}
                          disabled={resettingUserId === user.id}
                          className="rounded border border-[var(--boho-primary)] px-2 py-1 text-xs text-[var(--boho-primary)] hover:bg-[var(--boho-primary)] hover:text-white disabled:opacity-50"
                        >
                          {resettingUserId === user.id ? "Restableciendo..." : "Restablecer"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(user)}
                          disabled={isCurrent || deletingUserId === user.id}
                          className={`rounded border px-2 py-1 text-xs ${
                            isCurrent
                              ? "border-gray-300 text-gray-400 cursor-not-allowed"
                              : "border-red-300 text-red-600 hover:bg-red-50"
                          }`}
                        >
                          {deletingUserId === user.id ? "Eliminando..." : "Eliminar"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {roleName === "admin" ? (
            <div className="rounded border bg-gray-50 p-3 space-y-3">
              <div className="text-sm font-semibold text-gray-700">Mi contraseña</div>
              <p className="text-xs text-gray-500">
                Solo el admin puede cambiar su contraseña.
              </p>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <input
                  type="password"
                  className="w-full rounded border px-3 py-2 text-sm"
                  placeholder="Nueva contraseña"
                  value={myPassword}
                  onChange={(e) => setMyPassword(e.target.value)}
                />
                <input
                  type="password"
                  className="w-full rounded border px-3 py-2 text-sm"
                  placeholder="Confirmar contraseña"
                  value={myPasswordConfirm}
                  onChange={(e) => setMyPasswordConfirm(e.target.value)}
                />
                <button
                  type="button"
                  onClick={handleUpdateMyPassword}
                  disabled={updatingMyPassword}
                  className="rounded bg-[var(--boho-primary)] px-3 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                >
                  {updatingMyPassword ? "Guardando..." : "Cambiar mi contraseña"}
                </button>
              </div>
            </div>
          ) : null}
        </section>
      </div>

      {deleteTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900">Eliminar usuario</h3>
            <p className="mt-2 text-sm text-gray-600">
              Estas seguro de eliminar a <strong>{deleteTarget.username}</strong>? Esta accion no se puede deshacer.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded border px-3 py-2 text-sm"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                disabled={deletingUserId === deleteTarget.id}
                className="rounded bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
              >
                {deletingUserId === deleteTarget.id ? "Eliminando..." : "Eliminar definitivo"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
