import jsPDF from "jspdf";

export const generarComprobantePDF = (venta) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(26, 26, 46);
  doc.rect(0, 0, pageWidth, 40, "F");

  doc.setTextColor(217, 119, 6);
  doc.setFontSize(18);
  doc.text("Los Pollos Hermanos", pageWidth / 2, 18, { align: "center" });

  doc.setTextColor(148, 163, 184);
  doc.setFontSize(9);
  doc.text("Sistema de Gestion de Repartos", pageWidth / 2, 26, { align: "center" });

  doc.setTextColor(226, 232, 240);
  doc.setFontSize(11);
  doc.text(`Comprobante: ${venta.numero_comprobante}`, pageWidth / 2, 35, { align: "center" });

  let y = 50;

  doc.setTextColor(60, 60, 60);
  doc.setFontSize(10);

  const addLine = (label, value) => {
    doc.setFont(undefined, "bold");
    doc.text(`${label}:`, 15, y);
    doc.setFont(undefined, "normal");
    doc.text(String(value || "-"), 70, y);
    y += 7;
  };

  addLine("Fecha", venta.fecha);
  addLine("Hora", venta.hora);
  addLine("Tipo", venta.tipo_venta === "local" ? "Venta de Local" : "Venta por Reparto");
  addLine("Cliente", venta.cliente_nombre);
  addLine("Direccion", venta.cliente_direccion);
  addLine("Telefono", venta.cliente_telefono);
  addLine("Medio de pago", venta.medio_pago);
  addLine("Vendedor", venta.vendedor?.nombre || "-");

  y += 5;

  doc.setDrawColor(217, 119, 6);
  doc.setLineWidth(0.5);
  doc.line(15, y, pageWidth - 15, y);
  y += 8;

  doc.setTextColor(30, 30, 30);
  doc.setFont(undefined, "bold");
  doc.setFontSize(10);
  doc.text("Producto", 15, y);
  doc.text("Cant.", 110, y);
  doc.text("P. Unit.", 130, y);
  doc.text("Subtotal", 160, y);
  y += 3;

  doc.setDrawColor(200, 200, 200);
  doc.line(15, y, pageWidth - 15, y);
  y += 5;

  doc.setFont(undefined, "normal");
  doc.setFontSize(9);

  for (const item of venta.VentaItems || []) {
    const nombre = item.Producto?.nombre || "N/A";
    const cant = item.cantidad;
    const precio = parseFloat(item.precio_unitario);
    const sub = cant * precio;

    doc.text(nombre, 15, y);
    doc.text(String(cant), 112, y);
    doc.text(`$${precio.toFixed(2)}`, 130, y);
    doc.text(`$${sub.toFixed(2)}`, 160, y);
    y += 6;
  }

  y += 3;
  doc.setDrawColor(217, 119, 6);
  doc.setLineWidth(0.5);
  doc.line(15, y, pageWidth - 15, y);
  y += 8;

  doc.setFontSize(11);
  doc.setFont(undefined, "bold");
  doc.text("TOTAL:", 120, y);
  doc.text(`$${parseFloat(venta.total).toFixed(2)}`, 155, y);

  y += 20;

  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.3);

  doc.setFontSize(9);
  doc.setFont(undefined, "normal");
  doc.setTextColor(100, 100, 100);
  doc.text("______________________________", 15, y);
  doc.text("Firma del cliente", 25, y + 5);

  doc.text("______________________________", pageWidth - 85, y);
  doc.text("Firma del vendedor", pageWidth - 75, y + 5);

  doc.setFontSize(7);
  doc.setTextColor(160, 160, 160);
  doc.text("Documento generado automaticamente por el Sistema de Gestion Los Pollos Hermanos", pageWidth / 2, 280, { align: "center" });

  doc.save(`comprobante-${venta.numero_comprobante}.pdf`);
};
