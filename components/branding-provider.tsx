"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

export type BrandingSettings = {
  businessName: string;
  logoUrl: string;
  contactPhone: string;
  contactEmail: string;
  contactWeb: string;
  contactAddress: string;
  footerThanks: string;
  footerInfo: string;
  footerClosing: string;
  terms: string;
  access1Label: string;
  access1Url: string;
  access2Label: string;
  access2Url: string;
  access3Label: string;
  access3Url: string;
  access4Label: string;
  access4Url: string;
  access5Label: string;
  access5Url: string;
  social1Network: string;
  social1Value: string;
  social2Network: string;
  social2Value: string;
  social3Network: string;
  social3Value: string;
  social4Network: string;
  social4Value: string;
  themeName: string;
  appBg: string;
  appCard: string;
  appPrimary: string;
  appSecondary: string;
  appText: string;
  pdfPrimary: string;
  pdfPrimaryDark: string;
  pdfAccent: string;
  pdfSoft: string;
  pdfText: string;
  pdfTextLight: string;
  pdfBorder: string;
};

const defaultBranding: BrandingSettings = {
  businessName: "",
  logoUrl: "",
  contactPhone: "",
  contactEmail: "",
  contactWeb: "",
  contactAddress: "",
  footerThanks: "",
  footerInfo: "",
  footerClosing: "",
  terms: "",
  access1Label: "",
  access1Url: "",
  access2Label: "",
  access2Url: "",
  access3Label: "",
  access3Url: "",
  access4Label: "",
  access4Url: "",
  access5Label: "",
  access5Url: "",
  social1Network: "",
  social1Value: "",
  social2Network: "",
  social2Value: "",
  social3Network: "",
  social3Value: "",
  social4Network: "",
  social4Value: "",
  themeName: "system",
  appBg: "#f7f7f8",
  appCard: "#ffffff",
  appPrimary: "#2563eb",
  appSecondary: "#64748b",
  appText: "#111827",
  pdfPrimary: "#2563eb",
  pdfPrimaryDark: "#1e40af",
  pdfAccent: "#93c5fd",
  pdfSoft: "#f8fafc",
  pdfText: "#111827",
  pdfTextLight: "#6b7280",
  pdfBorder: "#e5e7eb",
};

type BrandingContextValue = {
  branding: BrandingSettings;
  setBranding: (next: BrandingSettings) => void;
};

const BrandingContext = createContext<BrandingContextValue | null>(null);

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const [branding, setBrandingState] = useState<BrandingSettings>(defaultBranding);

  useEffect(() => {
    const loadBranding = async () => {
      const { data, error } = await supabase
        .from("branding_settings")
        .select(
          "business_name, logo_url, contact_phone, contact_email, contact_web, contact_address, footer_thanks, footer_info, footer_closing, terms, access_1_label, access_1_url, access_2_label, access_2_url, access_3_label, access_3_url, access_4_label, access_4_url, access_5_label, access_5_url, social_1_network, social_1_value, social_2_network, social_2_value, social_3_network, social_3_value, social_4_network, social_4_value, theme_name, app_bg, app_card, app_primary, app_secondary, app_text, pdf_primary, pdf_primary_dark, pdf_accent, pdf_soft, pdf_text, pdf_text_light, pdf_border"
        )
        .eq("id", "default")
        .maybeSingle();

      if (error) {
        console.error("No se pudo cargar branding", error.message);
        setBrandingState(defaultBranding);
        return;
      }

      if (!data) {
        setBrandingState(defaultBranding);
        return;
      }

      setBrandingState({
        businessName: data.business_name ?? "",
        logoUrl: data.logo_url ?? "",
        contactPhone: data.contact_phone ?? "",
        contactEmail: data.contact_email ?? "",
        contactWeb: data.contact_web ?? "",
        contactAddress: data.contact_address ?? "",
        footerThanks: data.footer_thanks ?? "",
        footerInfo: data.footer_info ?? "",
        footerClosing: data.footer_closing ?? "",
        terms: data.terms ?? "",
        access1Label: data.access_1_label ?? "",
        access1Url: data.access_1_url ?? "",
        access2Label: data.access_2_label ?? "",
        access2Url: data.access_2_url ?? "",
        access3Label: data.access_3_label ?? "",
        access3Url: data.access_3_url ?? "",
        access4Label: data.access_4_label ?? "",
        access4Url: data.access_4_url ?? "",
        access5Label: data.access_5_label ?? "",
        access5Url: data.access_5_url ?? "",
        social1Network: data.social_1_network ?? "",
        social1Value: data.social_1_value ?? "",
        social2Network: data.social_2_network ?? "",
        social2Value: data.social_2_value ?? "",
        social3Network: data.social_3_network ?? "",
        social3Value: data.social_3_value ?? "",
        social4Network: data.social_4_network ?? "",
        social4Value: data.social_4_value ?? "",
        themeName: data.theme_name ?? defaultBranding.themeName,
        appBg: data.app_bg ?? defaultBranding.appBg,
        appCard: data.app_card ?? defaultBranding.appCard,
        appPrimary: data.app_primary ?? defaultBranding.appPrimary,
        appSecondary: data.app_secondary ?? defaultBranding.appSecondary,
        appText: data.app_text ?? defaultBranding.appText,
        pdfPrimary: data.pdf_primary ?? defaultBranding.pdfPrimary,
        pdfPrimaryDark: data.pdf_primary_dark ?? defaultBranding.pdfPrimaryDark,
        pdfAccent: data.pdf_accent ?? defaultBranding.pdfAccent,
        pdfSoft: data.pdf_soft ?? defaultBranding.pdfSoft,
        pdfText: data.pdf_text ?? defaultBranding.pdfText,
        pdfTextLight: data.pdf_text_light ?? defaultBranding.pdfTextLight,
        pdfBorder: data.pdf_border ?? defaultBranding.pdfBorder,
      });
    };

    loadBranding();
  }, []);

  const value = useMemo(() => ({ branding, setBranding: setBrandingState }), [branding]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.style.setProperty("--boho-bg", branding.appBg);
    root.style.setProperty("--boho-card", branding.appCard);
    root.style.setProperty("--boho-primary", branding.appPrimary);
    root.style.setProperty("--boho-secondary", branding.appSecondary);
    root.style.setProperty("--boho-text", branding.appText);
    root.style.setProperty("--background", branding.appBg);
    root.style.setProperty("--foreground", branding.appText);
    root.style.setProperty("--card", branding.appCard);
    root.style.setProperty("--card-foreground", branding.appText);
    root.style.setProperty("--primary", branding.appPrimary);
    root.style.setProperty("--primary-foreground", "#ffffff");
    root.style.setProperty("--secondary", branding.appSecondary);
    root.style.setProperty("--secondary-foreground", "#ffffff");
    root.style.setProperty(
      "--border",
      "color-mix(in srgb, var(--boho-text) 18%, transparent)"
    );
    root.style.setProperty("--ring", branding.appPrimary);
    root.style.setProperty("--accent", branding.appSecondary);
    root.style.setProperty("--accent-foreground", "#ffffff");
    root.style.setProperty("--muted", branding.appBg);
    root.style.setProperty("--muted-foreground", branding.appText);
    root.style.setProperty("--popover", branding.appCard);
    root.style.setProperty("--popover-foreground", branding.appText);
    root.style.setProperty("--input", branding.appCard);
  }, [branding]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const payload = {
      appBg: branding.appBg,
      appCard: branding.appCard,
      appPrimary: branding.appPrimary,
      appSecondary: branding.appSecondary,
      appText: branding.appText,
    };
    window.localStorage.setItem("branding-theme", JSON.stringify(payload));
  }, [branding]);

  return <BrandingContext.Provider value={value}>{children}</BrandingContext.Provider>;
}

export function useBranding() {
  const ctx = useContext(BrandingContext);
  if (!ctx) {
    throw new Error("useBranding must be used within BrandingProvider");
  }
  return ctx;
}
