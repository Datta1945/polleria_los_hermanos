import jsPDF from "jspdf";

export const generarComprobantePDF = (venta) => {
  const doc = new jsPDF();
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const ml = 15, mr = 15;
  const cw = pw - ml - mr;

  const medioLabel = { efectivo: "Efectivo", transferencia: "Transferencia", tarjeta: "Tarjeta", cuenta_corriente: "Cuenta Corriente", otro: "Otro" };

  const parseDatos = (datos) => {
    if (!datos) return [];
    if (typeof datos === "string") { try { return JSON.parse(datos); } catch { return []; } }
    if (Array.isArray(datos)) return datos;
    return [];
  };

  const buildPagos = () => {
    const rows = [];
    for (const d of parseDatos(venta.datos_transferencia)) {
      rows.push({ metodo: "Transferencia", banco: d.banco || "-", titular: d.nombre_cuenta || "-", monto: parseFloat(d.monto || 0) });
    }
    for (const d of parseDatos(venta.datos_tarjeta)) {
      rows.push({ metodo: "Tarjeta", banco: d.banco || "-", titular: d.nombre_cuenta || "-", monto: parseFloat(d.monto || 0) });
    }
    if (venta.pago_dividido && venta.VentaPagos) {
      for (const p of venta.VentaPagos) {
        if (p.medio_pago !== "transferencia" && p.medio_pago !== "tarjeta") {
          rows.push({ metodo: medioLabel[p.medio_pago] || p.medio_pago, banco: "-", titular: "-", monto: parseFloat(p.monto || 0) });
        }
      }
    } else if (venta.medio_pago !== "transferencia" && venta.medio_pago !== "tarjeta") {
      rows.push({ metodo: medioLabel[venta.medio_pago] || venta.medio_pago, banco: "-", titular: "-", monto: parseFloat(venta.total || 0) });
    }
    return rows;
  };

  const pagos = buildPagos();
  const items = venta.VentaItems || [];
  const hasDeuda = venta.monto_deuda_pagado && parseFloat(venta.monto_deuda_pagado) > 0;
  const saldoRestante = hasDeuda ? (venta.cliente?.saldo_pendiente ? parseFloat(venta.cliente.saldo_pendiente) : 0) : 0;

  const rowH = 7;
  const tableHeaderH = 8;
  const padH = 3;

  // ---- HEADER ----
  doc.setFillColor(26, 26, 46);
  doc.rect(0, 0, pw, 38, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(217, 119, 6);
  doc.text("LOS POLLOS HERMANOS", ml, 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text("Sistema de Gestion de Repartos", ml, 22);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(226, 232, 240);
  doc.text(venta.numero_comprobante, pw - mr, 14, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(180, 185, 195);
  doc.text(`${venta.fecha}  ${venta.hora}`, pw - mr, 22, { align: "right" });

  let y = 48;

  // ---- CLIENTE / VENTA BOX (dynamic height) ----
  const clienteLines = 2 + (venta.cliente_direccion ? 1 : 0) + (venta.cliente_telefono ? 1 : 0);
  const ventaBoxH = Math.max(28, 10 + clienteLines * 6);

  doc.setFillColor(248, 249, 252);
  doc.rect(ml, y - 4, cw, ventaBoxH, "F");
  doc.setDrawColor(220, 222, 228);
  doc.setLineWidth(0.3);
  doc.rect(ml, y - 4, cw, ventaBoxH, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 110);
  doc.text("CLIENTE", ml, y);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(50, 50, 60);
  doc.text(venta.cliente?.nombre || venta.cliente_nombre || "-", ml, y + 8);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(120, 120, 130);
  let cy = y + 14;
  if (venta.cliente_direccion) { doc.text(`Dir: ${venta.cliente_direccion}`, ml, cy); cy += 5.5; }
  if (venta.cliente_telefono) { doc.text(`Tel: ${venta.cliente_telefono}`, ml, cy); cy += 5.5; }

  const colRight = pw / 2 + 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 110);
  doc.text("VENTA", colRight, y);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(50, 50, 60);
  doc.text(venta.tipo_venta === "local" ? "Venta Mayorista" : "Venta por Reparto", colRight, y + 8);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(120, 120, 130);
  let vy = y + 14;
  doc.text(`Vendedor: ${venta.vendedor?.nombre || "-"}`, colRight, vy); vy += 5.5;
  doc.text(`Pago: ${venta.pago_dividido ? "Dividido" : (medioLabel[venta.medio_pago] || venta.medio_pago)}`, colRight, vy);

  y += ventaBoxH + 4;

  // ---- PAGOS TABLE ----
  if (pagos.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 110);
    doc.text("PAGOS", ml, y);
    y += 7;
    const pCols = [46, 44, cw - 46 - 44 - 38, 38];
    const pHead = ["Metodo", "Banco", "Titular", "Monto"];

    doc.setFillColor(230, 232, 240);
    doc.rect(ml, y, cw, tableHeaderH, "F");
    doc.setDrawColor(190, 192, 200);
    doc.setLineWidth(0.3);
    doc.rect(ml, y, cw, tableHeaderH, "S");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(40, 40, 50);
    let hx = ml + padH;
    for (let i = 0; i < pHead.length; i++) {
      doc.text(pHead[i], hx, y + 5);
      if (i < pHead.length - 1) { doc.setDrawColor(190, 192, 200); doc.setLineWidth(0.15); doc.line(hx + pCols[i], y, hx + pCols[i], y + tableHeaderH); }
      hx += pCols[i];
    }
    y += tableHeaderH;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    for (let i = 0; i < pagos.length; i++) {
      const p = pagos[i];
      if (i % 2 === 1) { doc.setFillColor(248, 249, 250); doc.rect(ml, y, cw, rowH, "F"); }
      doc.setDrawColor(215, 217, 223);
      doc.setLineWidth(0.15);
      doc.line(ml, y, ml + cw, y);
      doc.setTextColor(50, 50, 60);
      let rx = ml + padH;
      const vals = [p.metodo, p.banco, p.titular, `$${p.monto.toFixed(2)}`];
      for (let j = 0; j < vals.length; j++) {
        doc.text(vals[j], rx, y + 4.5);
        if (j < vals.length - 1) { doc.setDrawColor(215, 217, 223); doc.setLineWidth(0.1); doc.line(rx + pCols[j], y, rx + pCols[j], y + rowH); }
        rx += pCols[j];
      }
      y += rowH;
    }
    doc.setDrawColor(210, 210, 215);
    doc.setLineWidth(0.3);
    doc.line(ml, y, ml + cw, y);
    y += 4;
  }

  // ---- PRODUCTOS TABLE ----
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 110);
  doc.text("PRODUCTOS", ml, y + 4);
  y += 11;
  const prodCols = [cw - 34 - 28 - 30, 34, 28, 30];
  const prodHead = ["Producto", "Cant.", "P.Unit.", "Subtotal"];

  doc.setFillColor(230, 232, 240);
  doc.rect(ml, y, cw, tableHeaderH, "F");
  doc.setDrawColor(190, 192, 200);
  doc.setLineWidth(0.3);
  doc.rect(ml, y, cw, tableHeaderH, "S");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(40, 40, 50);
  let hx = ml + padH;
  for (let i = 0; i < prodHead.length; i++) {
    doc.text(prodHead[i], hx, y + 5);
    if (i < prodHead.length - 1) { doc.setDrawColor(190, 192, 200); doc.setLineWidth(0.15); doc.line(hx + prodCols[i], y, hx + prodCols[i], y + tableHeaderH); }
    hx += prodCols[i];
  }
  y += tableHeaderH;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const nombre = item.Producto?.nombre || "N/A";
    const cant = item.cantidad;
    const precio = parseFloat(item.precio_unitario);
    const sub = cant * precio;
    if (i % 2 === 1) { doc.setFillColor(248, 249, 250); doc.rect(ml, y, cw, rowH, "F"); }
    doc.setDrawColor(215, 217, 223);
    doc.setLineWidth(0.15);
    doc.line(ml, y, ml + cw, y);
    doc.setTextColor(50, 50, 60);
    let rx = ml + padH;
    doc.text(nombre, rx, y + 4.5); rx += prodCols[0];
    doc.text(String(cant), rx, y + 4.5); rx += prodCols[1];
    doc.text(`$${precio.toFixed(2)}`, rx, y + 4.5); rx += prodCols[2];
    doc.text(`$${sub.toFixed(2)}`, rx, y + 4.5); rx += prodCols[3];
    y += rowH;
  }
  doc.setDrawColor(210, 210, 215);
  doc.setLineWidth(0.3);
  doc.line(ml, y, ml + cw, y);

  // ---- TOTAL ----
  y += 6;
  doc.setFillColor(245, 246, 250);
  doc.rect(ml, y, cw, 14, "F");
  doc.setDrawColor(190, 192, 200);
  doc.setLineWidth(0.4);
  doc.rect(ml, y, cw, 14, "S");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(26, 26, 46);
  doc.text("TOTAL", ml + 8, y + 9.5);
  doc.text(`$${parseFloat(venta.total).toFixed(2)}`, pw - mr - 8, y + 9.5, { align: "right" });
  y += 17;

  // ---- DEUDA ----
  if (hasDeuda) {
    doc.setFillColor(saldoRestante > 0 ? 255 : 240, saldoRestante > 0 ? 248 : 250, saldoRestante > 0 ? 240 : 240);
    doc.rect(ml, y, cw, 16, "F");
    doc.setDrawColor(saldoRestante > 0 ? 240 : 160, saldoRestante > 0 ? 190 : 210, saldoRestante > 0 ? 120 : 160);
    doc.setLineWidth(0.4);
    doc.rect(ml, y, cw, 16, "S");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(saldoRestante > 0 ? 180 : 50, saldoRestante > 0 ? 130 : 140, saldoRestante > 0 ? 40 : 50);
    doc.text(saldoRestante > 0 ? "Pago de deuda incluido" : "Deuda saldada", ml + 8, y + 6);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 85);
    doc.text(`$${parseFloat(venta.monto_deuda_pagado).toFixed(2)}`, ml + 8, y + 12);
    if (saldoRestante > 0) {
      doc.text(`Saldo pendiente: $${saldoRestante.toFixed(2)}`, pw - mr - 8, y + 6, { align: "right" });
    } else {
      doc.setFont("helvetica", "bold");
      doc.setTextColor(50, 140, 50);
      doc.text("SALDADO", pw - mr - 8, y + 12, { align: "right" });
    }
    y += 19;
  }

  // ---- FIRMAS ----
  const minFirmaY = ph - 42;
  y = Math.max(y + 6, minFirmaY);

  doc.setDrawColor(200, 200, 210);
  doc.setLineWidth(0.2);
  doc.line(ml, y, pw - mr, y);
  y += 8;
  const firmaW = 70;
  const firmaGap = (cw - firmaW * 2) / 2;

  doc.setDrawColor(180, 180, 190);
  doc.setLineWidth(0.4);
  const f1x = ml + firmaGap;
  const f2x = pw - mr - firmaGap - firmaW;
  doc.line(f1x, y, f1x + firmaW, y);
  doc.line(f2x, y, f2x + firmaW, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(120, 120, 130);
  doc.text("Firma del cliente", f1x + firmaW / 2, y + 6, { align: "center" });
  doc.text("Firma del vendedor", f2x + firmaW / 2, y + 6, { align: "center" });

  // ---- FOOTER ----
  doc.setFontSize(6.5);
  doc.setTextColor(170, 170, 180);
  doc.text("Documento generado automaticamente por el Sistema de Gestion Los Pollos Hermanos", pw / 2, ph - 10, { align: "center" });

  doc.save(`comprobante-${venta.numero_comprobante}.pdf`);
};

export const generarResumenPagosPDF = (pagos, fecha) => {
  const doc = new jsPDF("landscape");
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const ml = 18;
  const mr = 18;
  const tableWidth = pageWidth - ml - mr;
  const colWidths = [50, 55, 38, 50, tableWidth - 50 - 55 - 38 - 50];
  const headers = ["Fecha y Hora", "Titular", "Monto", "Banco", "Tipo"];
  const rowH = 7;
  const headerH = 9;
  const fontSize = 12;
  const headerFontSize = 12.5;

  const headerBarH = 32;
  const topMargin = headerBarH + 14;

  let y = topMargin;

  const drawPageHeader = () => {
    doc.setFillColor(26, 26, 46);
    doc.rect(0, 0, pageWidth, headerBarH, "F");
    doc.setTextColor(217, 119, 6);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Los Pollos Hermanos", pageWidth / 2, 14, { align: "center" });
    doc.setTextColor(226, 232, 240);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Tabla de Cobros - ${fecha}`, pageWidth / 2, 25, { align: "center" });
  };

  const drawTableHeader = (yPos) => {
    const x0 = ml;
    doc.setFillColor(230, 232, 240);
    doc.rect(x0, yPos, tableWidth, headerH, "F");
    doc.setDrawColor(190, 192, 200);
    doc.setLineWidth(0.4);
    doc.rect(x0, yPos, tableWidth, headerH, "S");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(headerFontSize);
    doc.setTextColor(40, 40, 50);
    let x = x0 + 3;
    for (let i = 0; i < headers.length; i++) {
      doc.text(headers[i], x + 3, yPos + headerH / 2 + 1.2);
      if (i < headers.length - 1) {
        doc.setDrawColor(190, 192, 200);
        doc.setLineWidth(0.2);
        doc.line(x + colWidths[i], yPos, x + colWidths[i], yPos + headerH);
      }
      x += colWidths[i];
    }
  };

  const drawRow = (yPos, rowData, isEven, isLast) => {
    const x0 = ml;
    if (isEven) {
      doc.setFillColor(248, 249, 250);
      doc.rect(x0, yPos, tableWidth, rowH, "F");
    }
    doc.setDrawColor(210, 212, 218);
    doc.setLineWidth(0.2);
    doc.line(x0, yPos, x0 + tableWidth, yPos);
    if (isLast) {
      doc.line(x0, yPos + rowH, x0 + tableWidth, yPos + rowH);
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(fontSize);
    doc.setTextColor(50, 50, 60);
    let x = x0 + 3;
    for (let i = 0; i < rowData.length; i++) {
      doc.text(String(rowData[i]), x + 3, yPos + rowH / 2 + 1.2);
      if (i < rowData.length - 1) {
        doc.setDrawColor(210, 212, 218);
        doc.setLineWidth(0.15);
        doc.line(x + colWidths[i], yPos, x + colWidths[i], yPos + rowH);
      }
      x += colWidths[i];
    }
  };

  const addPageIfNeeded = (yPos) => {
    if (yPos + rowH + 10 > pageHeight - 20) {
      doc.addPage("landscape");
      drawPageHeader();
      yPos = topMargin;
      drawTableHeader(yPos);
      yPos += headerH;
    }
    return yPos;
  };

  drawPageHeader();
  drawTableHeader(y);
  y += headerH;

  for (let i = 0; i < pagos.length; i++) {
    y = addPageIfNeeded(y);
    const p = pagos[i];
    const rowData = [
      (p.fecha_hora || "").replace("T", " "),
      p.nombre_cuenta || "-",
      `$${(p.monto || 0).toFixed(2)}`,
      p.banco || "-",
      p.tipo || "-",
    ];
    drawRow(y, rowData, i % 2 === 1, i === pagos.length - 1);
    y += rowH;
  }

  y += 4;
  y = addPageIfNeeded(y);

  const total = pagos.reduce((s, p) => s + (p.monto || 0), 0);
  const totalLineWidth = 120;
  const totalX = pageWidth - mr - totalLineWidth;
  doc.setDrawColor(70, 70, 80);
  doc.setLineWidth(0.6);
  doc.line(totalX, y, totalX + totalLineWidth, y);
  y += 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(40, 40, 50);
  doc.text("TOTAL GENERAL:", totalX, y);
  doc.text(`$${total.toFixed(2)}`, totalX + totalLineWidth, y, { align: "right" });

  doc.setFontSize(7);
  doc.setTextColor(160, 160, 160);
  doc.setFont("helvetica", "normal");
  doc.text("Documento generado automaticamente por el Sistema de Gestion Los Pollos Hermanos", pageWidth / 2, pageHeight - 12, { align: "center" });

  doc.save(`resumen-pagos-${fecha}.pdf`);
};
