import { CierreCaja, SalidaCamion, SalidaCamionItem, Producto, Venta, VentaItem } from "../models/index.js";

const checkDayClosed = async (fecha) => {
  const cierre = await CierreCaja.findOne({ where: { fecha } });
  return !!cierre;
};

export const getResumenDelDia = async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];

    const salidasHoy = await SalidaCamion.findAll({
      where: { fecha: today },
      include: [
        {
          model: SalidaCamionItem,
          include: [{ model: Producto, attributes: ["id", "nombre", "precio"] }],
        },
      ],
    });

    let mercaderia_enviada = 0;
    let mercaderia_devuelta = 0;

    for (const salida of salidasHoy) {
      for (const item of salida.SalidaCamionItems || []) {
        const valor = parseFloat(item.precio_unitario) * item.cantidad;
        mercaderia_enviada += valor;
      }
      if (salida.monto_regreso) {
        mercaderia_devuelta += parseFloat(salida.monto_regreso);
      }
    }

    const ventasHoy = await Venta.findAll({
      where: { fecha: today, estado: "completada" },
      include: [
        {
          model: VentaItem,
          include: [{ model: Producto, attributes: ["id", "nombre", "precio"] }],
        },
      ],
    });

    let localMonto = 0;
    let localCount = 0;
    let repartoMonto = 0;
    let repartoCount = 0;

    for (const venta of ventasHoy) {
      const monto = parseFloat(venta.total) || 0;
      if (venta.tipo_venta === "local") {
        localMonto += monto;
        localCount++;
      } else {
        repartoMonto += monto;
        repartoCount++;
      }
    }

    const totalGeneral = localMonto + repartoMonto;
    const ventas_netas = mercaderia_enviada - mercaderia_devuelta;

    const cierreExistente = await CierreCaja.findOne({ where: { fecha: today } });

    res.json({
      fecha: today,
      salidas_count: salidasHoy.length,
      mercaderia_enviada: mercaderia_enviada.toFixed(2),
      mercaderia_devuelta: mercaderia_devuelta.toFixed(2),
      ventas_netas_envio: ventas_netas.toFixed(2),
      local_monto: localMonto.toFixed(2),
      local_count: localCount,
      reparto_monto: repartoMonto.toFixed(2),
      reparto_count: repartoCount,
      total_general: totalGeneral.toFixed(2),
      cerrado: !!cierreExistente,
      cierre: cierreExistente || null,
    });
  } catch (error) {
    res.status(500).json({ message: "Error al obtener resumen del dia", error: error.message });
  }
};

export const cerrarCaja = async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];

    const cierreExistente = await CierreCaja.findOne({ where: { fecha: today } });
    if (cierreExistente) {
      return res.status(400).json({ message: "La caja ya fue cerrada para este dia" });
    }

    const salidasHoy = await SalidaCamion.findAll({
      where: { fecha: today },
      include: [
        {
          model: SalidaCamionItem,
          include: [{ model: Producto, attributes: ["id", "nombre", "precio"] }],
        },
      ],
    });

    let mercaderia_enviada = 0;
    let mercaderia_devuelta = 0;

    for (const salida of salidasHoy) {
      for (const item of salida.SalidaCamionItems || []) {
        const valor = parseFloat(item.precio_unitario) * item.cantidad;
        mercaderia_enviada += valor;
      }
      if (salida.monto_regreso) {
        mercaderia_devuelta += parseFloat(salida.monto_regreso);
      }
    }

    const ventasHoy = await Venta.findAll({
      where: { fecha: today, estado: "completada" },
    });

    let localMonto = 0;
    let localCount = 0;
    let repartoMonto = 0;
    let repartoCount = 0;

    for (const venta of ventasHoy) {
      const monto = parseFloat(venta.total) || 0;
      if (venta.tipo_venta === "local") {
        localMonto += monto;
        localCount++;
      } else {
        repartoMonto += monto;
        repartoCount++;
      }
    }

    const totalGeneral = localMonto + repartoMonto;
    const ventas_netas = mercaderia_enviada - mercaderia_devuelta;
    const now = new Date();
    const hora = now.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

    const cierre = await CierreCaja.create({
      fecha: today,
      hora,
      total_ventas: totalGeneral.toFixed(2),
      salidas_count: salidasHoy.length,
      mercaderia_enviada: mercaderia_enviada.toFixed(2),
      mercaderia_devuelta: mercaderia_devuelta.toFixed(2),
      ventas_netas: ventas_netas.toFixed(2),
      usuario_cierre: req.user.nombre,
    });

    res.status(201).json({ message: "Caja cerrada exitosamente", cierre });
  } catch (error) {
    res.status(500).json({ message: "Error al cerrar caja", error: error.message });
  }
};

export const getHistorialCierres = async (req, res) => {
  try {
    const cierres = await CierreCaja.findAll({
      order: [["fecha", "DESC"], ["createdAt", "DESC"]],
    });
    res.json(cierres);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener historial", error: error.message });
  }
};

export { checkDayClosed };
