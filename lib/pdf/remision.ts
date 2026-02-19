import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type Item = {
  product_name: string;
  description?: string;
  price: number;
  quantity: number;
  subtotal: number;
};

type RemisionPDF = {
  folio: string;
  date: string;
  cliente: string | null;
  telefono: string | null;
  direccion: string | null;
  total: number;
  anticipo: number;
  status: string;
  delivered?: boolean | null;
  paymentMethod?: string | null;
  noteTitle?: string;
  showDeliveryPayment?: boolean;
  items: Item[];
  branding?: {
    businessName?: string;
    logoDataUrl?: string;
    contactPhone?: string;
    contactEmail?: string;
    contactWeb?: string;
    contactAddress?: string;
    footerThanks?: string;
    footerInfo?: string;
    footerClosing?: string;
    terms?: string;
    social1Network?: string;
    social1Value?: string;
    social2Network?: string;
    social2Value?: string;
    social3Network?: string;
    social3Value?: string;
    social4Network?: string;
    social4Value?: string;
    social1IconDataUrl?: string;
    social2IconDataUrl?: string;
    social3IconDataUrl?: string;
    social4IconDataUrl?: string;
    primaryColor?: string;
    primaryDarkColor?: string;
    accentColor?: string;
    softColor?: string;
    textColor?: string;
    textLightColor?: string;
    borderColor?: string;
  };
};

export function generarPDFRemision(
  data: RemisionPDF,
  options: { mode?: "download" | "preview" } = {}
) {
  const doc = new jsPDF("p", "mm", "letter");
  const pageWidth = 215.9;  // Letter width
  const pageHeight = 279.4; // Letter height
  const margin = 15;
  const FONT = {
    body: 9,
    small: 8,
    heading: 10,
  };

  const businessName = data.branding?.businessName?.trim() || "";
  const logoDataUrl = data.branding?.logoDataUrl?.trim() || "";
  const contactPhone = data.branding?.contactPhone?.trim() || "";
  const contactEmail = data.branding?.contactEmail?.trim() || "";
  const contactWeb = data.branding?.contactWeb?.trim() || "";
  const contactAddress = data.branding?.contactAddress?.trim() || "";
  const footerThanks = data.branding?.footerThanks?.trim() || "";
  const footerInfo = data.branding?.footerInfo?.trim() || "";
  const footerClosing = data.branding?.footerClosing?.trim() || "";
  const termsText = data.branding?.terms?.trim() || "";
  const social1Network = data.branding?.social1Network?.trim() || "";
  const social1Value = data.branding?.social1Value?.trim() || "";
  const social2Network = data.branding?.social2Network?.trim() || "";
  const social2Value = data.branding?.social2Value?.trim() || "";
  const social3Network = data.branding?.social3Network?.trim() || "";
  const social3Value = data.branding?.social3Value?.trim() || "";
  const social4Network = data.branding?.social4Network?.trim() || "";
  const social4Value = data.branding?.social4Value?.trim() || "";
  const social1IconDataUrl = data.branding?.social1IconDataUrl?.trim() || "";
  const social2IconDataUrl = data.branding?.social2IconDataUrl?.trim() || "";
  const social3IconDataUrl = data.branding?.social3IconDataUrl?.trim() || "";
  const social4IconDataUrl = data.branding?.social4IconDataUrl?.trim() || "";

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

  // ===== PALETA (configurable) =====
  const COLORS = {
    primary: hexToRgb(data.branding?.primaryColor || "#b46e50", [180, 110, 80]),
    primaryDark: hexToRgb(data.branding?.primaryDarkColor || "#96553c", [150, 85, 60]),
    accent: hexToRgb(data.branding?.accentColor || "#dcb4a0", [220, 180, 160]),
    soft: hexToRgb(data.branding?.softColor || "#fcf8f4", [252, 248, 244]),
    text: hexToRgb(data.branding?.textColor || "#3c322d", [60, 50, 45]),
    textLight: hexToRgb(data.branding?.textLightColor || "#826e64", [130, 110, 100]),
    white: [255, 255, 255] as [number, number, number],
    border: hexToRgb(data.branding?.borderColor || "#e6d2c3", [230, 210, 195]),
  };

  // =====================================================
  // HEADER PRINCIPAL
  // =====================================================
  
  // Banda superior decorativa
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageWidth, 8, "F");
  
  // Fondo del header
  doc.setFillColor(...COLORS.soft);
  doc.rect(0, 8, pageWidth, 58, "F");

  // Logo y nombre de empresa
  const headerY = 12;
  
  // Logo desde data URL (PNG/JPG) o fallback a texto
  const resolveLogoFormat = (value: string) => {
    if (value.startsWith("data:image/png")) return "PNG" as const;
    if (value.startsWith("data:image/jpeg") || value.startsWith("data:image/jpg")) return "JPEG" as const;
    return "PNG" as const;
  };

  const logoBoxW = 70;
  const logoBoxH = 32;
  let logoRendered = false;

  if (logoDataUrl) {
    try {
      const props = doc.getImageProperties(logoDataUrl);
      const ratio = props.width / props.height;
      let drawW = logoBoxW;
      let drawH = drawW / ratio;
      if (drawH > logoBoxH) {
        drawH = logoBoxH;
        drawW = drawH * ratio;
      }
      const offsetX = margin;
      const offsetY = headerY + (logoBoxH - drawH) / 2;
      doc.addImage(logoDataUrl, resolveLogoFormat(logoDataUrl), offsetX, offsetY, drawW, drawH);
      logoRendered = true;
    } catch {
      logoRendered = false;
    }
  }

  if (!logoRendered) {
    if (businessName) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(...COLORS.primary);
      const nameLines = doc.splitTextToSize(businessName.toUpperCase(), logoBoxW);
      const limitedLines = nameLines.slice(0, 2);
      limitedLines.forEach((line: string, idx: number) => {
        doc.text(line, margin, headerY + 10 + idx * 6);
      });
    }
  }

  // Info de contacto (debajo del slogan)
  doc.setFont("helvetica", "normal");
  doc.setFontSize(FONT.small);
  doc.setTextColor(...COLORS.text);
  
  const contactY = headerY + logoBoxH + 8;
  const contactLines = [
    contactAddress || "",
    contactPhone ? `Tel: ${contactPhone}` : "",
    contactEmail,
    contactWeb,
  ];
  contactLines.forEach((line: string, idx: number) => {
    if (line) {
      doc.text(line, margin, contactY + idx * 4);
    }
  });

  // ── CUADRO DE NOTA (lado derecho) ──
  const notaBoxW = 70;
  const notaBoxH = 46;
  const notaBoxX = pageWidth - margin - notaBoxW;
  const notaBoxY = 14;

  // Fondo del cuadro
  doc.setFillColor(...COLORS.white);
  doc.setDrawColor(...COLORS.primary);
  doc.setLineWidth(0.4);
  doc.roundedRect(notaBoxX, notaBoxY, notaBoxW, notaBoxH, 4, 4, "FD");

  // Encabezado del cuadro
  doc.setFillColor(...COLORS.primary);
  doc.roundedRect(notaBoxX, notaBoxY, notaBoxW, 10, 4, 4, "F");
  doc.rect(notaBoxX, notaBoxY + 6, notaBoxW, 4, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.white);
  const noteTitle = data.noteTitle?.trim() || "NOTA DE VENTA";
  doc.text(noteTitle, notaBoxX + notaBoxW / 2, notaBoxY + 7, { align: "center" });

  // Contenido del cuadro
  doc.setTextColor(...COLORS.text);
  doc.setFontSize(FONT.body);

  const labelX = notaBoxX + 6;
  const valueX = notaBoxX + notaBoxW - 6;
  const rowStartY = notaBoxY + 16;
  const rowGap = 6;
  const estadoTexto = data.status === "completed" ? "Pagado" : data.status === "pending" ? "Pendiente" : data.status;
  const showDeliveryPayment = data.showDeliveryPayment !== false;
  const entregaTexto = data.status === "CANCELADA" ? "—" : data.delivered ? "Entregada" : "Pendiente";
  const metodoRaw = (data.paymentMethod || "").trim();
  const metodoTexto = (data.anticipo || 0) > 0 ? (metodoRaw || "—") : "—";
  const rows = [
    { label: "Folio", value: data.folio },
    { label: "Fecha", value: data.date },
    { label: "Estado", value: estadoTexto },
  ];

  if (showDeliveryPayment) {
    rows.push(
      { label: "Entrega", value: entregaTexto },
      { label: "Método", value: metodoTexto }
    );
  }

  rows.forEach((row, idx) => {
    const yPos = rowStartY + rowGap * idx;
    doc.setFont("helvetica", "bold");
    doc.text(row.label, labelX, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(String(row.value), valueX, yPos, { align: "right" });
  });

  // =====================================================
  // DATOS DEL CLIENTE
  // =====================================================
  let y = 72;

  // Título de sección
  doc.setFillColor(...COLORS.primary);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 8, 2, 2, "F");
  doc.rect(margin, y + 4, pageWidth - margin * 2, 4, "F");
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(FONT.heading);
  doc.setTextColor(...COLORS.white);
  doc.text("DATOS DEL CLIENTE", margin + 5, y + 5.5);

  // Contenido del cliente
  y += 8;
  doc.setFillColor(...COLORS.soft);
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.3);
  doc.rect(margin, y, pageWidth - margin * 2, 20, "FD");

  doc.setTextColor(...COLORS.text);
  doc.setFontSize(FONT.body);

  const col1X = margin + 5;
  const col2X = margin + 100;
  const clienteY = y + 7;
  const labelGap = 20;

  doc.setFont("helvetica", "bold");
  doc.text("Cliente:", col1X, clienteY);
  doc.setFont("helvetica", "normal");
  doc.text(data.cliente || "Venta mostrador", col1X + labelGap, clienteY);

  doc.setFont("helvetica", "bold");
  doc.text("Teléfono:", col2X, clienteY);
  doc.setFont("helvetica", "normal");
  doc.text(data.telefono || "—", col2X + 22, clienteY);

  doc.setFont("helvetica", "bold");
  doc.text("Dirección:", col1X, clienteY + 8);
  doc.setFont("helvetica", "normal");
  const direccionTexto = data.direccion || "—";
  const direccionMaxW = pageWidth - margin * 2 - (col1X + labelGap - margin);
  const direccionLines = doc.splitTextToSize(direccionTexto, direccionMaxW);
  doc.text(direccionLines, col1X + labelGap, clienteY + 8);

  // =====================================================
  // TABLA DE PRODUCTOS
  // =====================================================
  const tableY = y + 28;

  autoTable(doc, {
    startY: tableY,
    head: [["#", "Descripción", "Precio Unit.", "Cant.", "Subtotal"]],
    body: data.items.map((item, index) => [
      (index + 1).toString(),
      item.product_name || "",
      `$${item.price.toFixed(2)}`,
      item.quantity.toString(),
      `$${item.subtotal.toFixed(2)}`,
    ]),
    theme: "plain",
    margin: { left: margin, right: margin },
    headStyles: {
      fillColor: COLORS.primary,
      textColor: COLORS.white,
      fontStyle: "bold",
      halign: "center",
      fontSize: FONT.body,
      cellPadding: 4,
    },
    bodyStyles: {
      textColor: COLORS.text,
      fontSize: FONT.body,
      cellPadding: 4,
      lineColor: COLORS.border,
      lineWidth: 0.3,
    },
    alternateRowStyles: {
      fillColor: COLORS.soft,
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 12 },
      1: { halign: "left", cellWidth: "auto" },
      2: { halign: "right", cellWidth: 28 },
      3: { halign: "center", cellWidth: 18 },
      4: { halign: "right", cellWidth: 28 },
    },
    didDrawCell: (data) => {
      // Agregar bordes a las celdas
      if (data.section === "body") {
        doc.setDrawColor(...COLORS.border);
        doc.setLineWidth(0.3);
        doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, "S");
      }
    },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 8;

  // Calcular el total sumando los subtotales de los items
  const totalCalculado = data.items.reduce((sum, item) => sum + item.subtotal, 0);
  const resto = totalCalculado - (data.anticipo || 0);

  // =====================================================
  // RESUMEN Y TOTAL
  // =====================================================
  const resumenX = pageWidth - margin - 70;
  const resumenW = 70;

  // Caja del total (ajustada para 3 líneas)
  doc.setFillColor(...COLORS.soft);
  doc.setDrawColor(...COLORS.primary);
  doc.setLineWidth(0.5);
  doc.roundedRect(resumenX, finalY, resumenW, 32, 2, 2, "FD");

  // Subtotal
  doc.setFont("helvetica", "normal");
  doc.setFontSize(FONT.body);
  doc.setTextColor(...COLORS.text);
  doc.text("Subtotal:", resumenX + 5, finalY + 8);
  doc.text(`$${totalCalculado.toFixed(2)}`, resumenX + resumenW - 5, finalY + 8, { align: "right" });

  // Anticipo
  doc.text("Anticipo:", resumenX + 5, finalY + 16);
  doc.text(`$${(data.anticipo || 0).toFixed(2)}`, resumenX + resumenW - 5, finalY + 16, { align: "right" });

  // Línea separadora
  doc.setDrawColor(...COLORS.border);
  doc.line(resumenX + 5, finalY + 20, resumenX + resumenW - 5, finalY + 20);

  // Resto (destacado)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(FONT.heading);
  doc.setTextColor(...COLORS.primaryDark);
  doc.text("Resto:", resumenX + 5, finalY + 28);
  doc.text(`$${resto.toFixed(2)}`, resumenX + resumenW - 5, finalY + 28, { align: "right" });

  // =====================================================
  // FOOTER UNIFICADO - Ancho completo como el header
  // =====================================================
  const footerHeight = 56;
  const footerY = pageHeight - footerHeight - 6; // 6 para la banda inferior
  const footerInnerX = margin;
  const footerInnerWidth = pageWidth - footerInnerX * 2;

  // Fondo del footer (ancho completo)
  doc.setFillColor(...COLORS.soft);
  doc.rect(0, footerY, pageWidth, footerHeight, "F");

  // Banda decorativa superior del footer
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, footerY, pageWidth, 2, "F");
  
  // Mensaje de agradecimiento
  const footerGap = 6;
  let cursorY = footerY + footerGap;

  if (footerThanks) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(FONT.heading);
    doc.setTextColor(...COLORS.primaryDark);
    doc.text(footerThanks, pageWidth / 2, cursorY + 5, { align: "center" });
    cursorY += 6;
  }
  if (footerClosing) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(FONT.small);
    doc.setTextColor(...COLORS.textLight);
    doc.text(footerClosing, pageWidth / 2, cursorY + 4, { align: "center" });
    cursorY += 6;
  }
  
  // Redes sociales
  const formatSocial = (network: string, value: string) => {
    if (!network || !value) return "";
    const labelMap: Record<string, string> = {
      whatsapp: "WhatsApp",
      instagram: "Instagram",
      facebook: "Facebook",
      tiktok: "TikTok",
      x: "X",
      youtube: "YouTube",
      linkedin: "LinkedIn",
      web: "Web",
      otro: "Red",
    };
    const label = labelMap[network] || "Red";
    return `${label}: ${value}`;
  };

  const fitText = (text: string, maxWidth: number) => {
    if (doc.getTextWidth(text) <= maxWidth) return text;
    let shortened = text;
    while (shortened.length > 1 && doc.getTextWidth(`${shortened}…`) > maxWidth) {
      shortened = shortened.slice(0, -1);
    }
    return `${shortened}…`;
  };


  const socialLines = [
    { network: social1Network, value: social1Value, icon: social1IconDataUrl },
    { network: social2Network, value: social2Value, icon: social2IconDataUrl },
    { network: social3Network, value: social3Value, icon: social3IconDataUrl },
    { network: social4Network, value: social4Value, icon: social4IconDataUrl },
  ]
    .map((item) => ({
      text: formatSocial(item.network, item.value),
      icon: item.icon,
    }))
    .filter((item) => item.text);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(FONT.small);
  doc.setTextColor(...COLORS.textLight);

  if (socialLines.length) {
    const baseY = cursorY + 6;
    const iconSize = 5;
    const iconGap = 2;
    const itemGap = 10;
    const items = socialLines.slice(0, 4);
    const availableWidth = footerInnerWidth;
    const gapTotal = itemGap * Math.max(items.length - 1, 0);
    const itemWidth = (availableWidth - gapTotal) / items.length;
    const textMaxWidth = Math.max(itemWidth - iconSize - iconGap, 10);
    const totalWidth = itemWidth * items.length + gapTotal;
    const startX = footerInnerX + (availableWidth - totalWidth) / 2;

    items.forEach((line, idx) => {
      const x = startX + idx * (itemWidth + itemGap);
      const textX = x + iconSize + iconGap;
      const text = fitText(line.text, textMaxWidth);

      if (line.icon) {
        try {
          doc.addImage(line.icon, "PNG", x, baseY - iconSize + 2, iconSize, iconSize);
        } catch {
          // ignore icon rendering errors
        }
      }
      doc.text(text, textX, baseY);
    });
  }

  // Términos y condiciones (dentro del mismo cuadro)
  if (termsText) {
    const termsStartY = cursorY + 14;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(FONT.small);
    doc.setTextColor(...COLORS.text);
    doc.text("TÉRMINOS Y CONDICIONES:", footerInnerX, termsStartY);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(FONT.small);
    doc.setTextColor(...COLORS.textLight);
    
    const splitTerminos = doc.splitTextToSize(termsText, footerInnerWidth);
    doc.text(splitTerminos, footerInnerX, termsStartY + 6);
    cursorY = termsStartY + 6 + splitTerminos.length * 4;
  }

  if (footerInfo) {
    const infoY = Math.max(cursorY + 4, footerY + 38);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(FONT.small);
    doc.setTextColor(...COLORS.textLight);
    const splitInfo = doc.splitTextToSize(footerInfo, footerInnerWidth);
    doc.text(splitInfo, footerInnerX, infoY);
  }

  // Banda inferior decorativa
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, pageHeight - 6, pageWidth, 6, "F");

  // Marca de agua y aviso si está cancelada (al final para que quede encima)
  if (data.status === "CANCELADA") {
    doc.saveGraphicsState();
    doc.setTextColor(190, 40, 40); // rojo sellado
    doc.setFont("helvetica", "bold");
    doc.setFontSize(72);

    const w = doc.internal.pageSize.getWidth();
    const h = doc.internal.pageSize.getHeight();
    doc.text("CANCELADA", w / 2, h / 2, { align: "center", angle: -25 });

    doc.restoreGraphicsState();

    doc.setTextColor(180, 0, 0);
    doc.setFontSize(12);
    doc.text("ESTE DOCUMENTO ESTÁ CANCELADO", margin - 1, 20);
    doc.setTextColor(...COLORS.text);
  }

  if (options.mode === "preview") {
    const url = doc.output("bloburl");
    if (typeof window !== "undefined") {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  } else {
    doc.save(`Nota-${data.folio}.pdf`);
  }
}
