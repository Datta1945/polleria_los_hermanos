import { SalidaCamion, SalidaCamionItem, Producto, User, CierreCaja } from "../models/index.js";

const checkDayClosed = async (fecha) => {
  const cierre = await CierreCaja.findOne({ where: { fecha } });
  return !!cierre;
};

export const getAllSalidas = async (req, res) => {
  try {
    const where = {};

    if (req.userRole === "repartidor") {
      where.asignadoRepartidorId = req.user.id;
    }

    const salidas = await SalidaCamion.findAll({
      where,
      include: [
        {
          model: SalidaCamionItem,
          include: [{ model: Producto, attributes: ["id", "nombre", "precio", "unidad"] }],
        },
        { model: User, as: "repartidor_asignado", attributes: ["id", "nombre"] },
        { model: User, as: "creado_por", attributes: ["id", "nombre"] },
      ],
      order: [["fecha", "DESC"], ["createdAt", "DESC"]],
    });

    res.json(salidas);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener salidas", error: error.message });
  }
};

export const getSalidaById = async (req, res) => {
  try {
    const salida = await SalidaCamion.findByPk(req.params.id, {
      include: [
        {
          model: SalidaCamionItem,
          include: [{ model: Producto }],
        },
        { model: User, as: "repartidor_asignado", attributes: ["id", "nombre"] },
        { model: User, as: "creado_por", attributes: ["id", "nombre"] },
      ],
    });

    if (!salida) {
      return res.status(404).json({ message: "Salida no encontrada" });
    }

    res.json(salida);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener salida", error: error.message });
  }
};

export const getMisSalidas = async (req, res) => {
  try {
    const salidas = await SalidaCamion.findAll({
      where: { asignadoRepartidorId: req.user.id },
      include: [
        {
          model: SalidaCamionItem,
          include: [{ model: Producto, attributes: ["id", "nombre", "precio", "unidad"] }],
        },
        { model: User, as: "repartidor_asignado", attributes: ["id", "nombre"] },
      ],
      order: [["fecha", "DESC"], ["createdAt", "DESC"]],
    });

    res.json(salidas);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener salidas", error: error.message });
  }
};

export const createSalida = async (req, res) => {
  try {
    const {
      fecha,
      camion,
      destino,
      cliente_nombre,
      cliente_direccion,
      cliente_telefono,
      notas,
      asignadoRepartidorId,
      items,
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "Debe agregar al menos un producto" });
    }

    const salidaFecha = fecha || new Date().toISOString().split("T")[0];

    if (await checkDayClosed(salidaFecha)) {
      return res.status(400).json({ message: "No se pueden crear salidas, la caja del día ya fue cerrada" });
    }

    let precioTotal = 0;
    for (const item of items) {
      const producto = await Producto.findByPk(item.productoId);
      if (!producto) {
        return res.status(400).json({ message: `Producto ID ${item.productoId} no encontrado` });
      }
      if (producto.stock < item.cantidad) {
        return res.status(400).json({
          message: `Stock insuficiente para "${producto.nombre}": disponible ${producto.stock}, solicitado ${item.cantidad}`,
        });
      }
      precioTotal += producto.precio * item.cantidad;
    }

    const montoSalidaCalc = precioTotal;

    const salida = await SalidaCamion.create({
      fecha: salidaFecha,
      camion,
      destino,
      cliente_nombre,
      cliente_direccion,
      cliente_telefono,
      notas,
      precio_total: precioTotal,
      monto_salida: montoSalidaCalc,
      asignadoRepartidorId: asignadoRepartidorId || req.user.id,
      creadoPorId: req.user.id,
    });

    for (const item of items) {
      const producto = await Producto.findByPk(item.productoId);
      await SalidaCamionItem.create({
        salidaCamionId: salida.id,
        productoId: item.productoId,
        cantidad: item.cantidad,
        precio_unitario: producto.precio,
      });

      await producto.update({ stock: producto.stock - item.cantidad });
    }

    const salidaCompleta = await SalidaCamion.findByPk(salida.id, {
      include: [
        {
          model: SalidaCamionItem,
          include: [{ model: Producto }],
        },
        { model: User, as: "repartidor_asignado", attributes: ["id", "nombre"] },
        { model: User, as: "creado_por", attributes: ["id", "nombre"] },
      ],
    });

    res.status(201).json({ message: "Salida de camión creada", salida: salidaCompleta });
  } catch (error) {
    res.status(500).json({ message: "Error al crear salida", error: error.message });
  }
};

export const registrarRegreso = async (req, res) => {
  try {
    const salida = await SalidaCamion.findByPk(req.params.id, {
      include: [{ model: SalidaCamionItem, include: [{ model: Producto }] }],
    });

    if (!salida) {
      return res.status(404).json({ message: "Salida no encontrada" });
    }

    if (salida.estado !== "en_camino") {
      return res.status(400).json({ message: "Solo se puede registrar regreso de salidas en camino" });
    }

    if (await checkDayClosed(salida.fecha)) {
      return res.status(400).json({ message: "No se puede modificar, la caja del día ya fue cerrada" });
    }

    const { items_regreso } = req.body;

    let montoRegreso = 0;
    if (items_regreso && items_regreso.length > 0) {
      for (const item of items_regreso) {
        const producto = await Producto.findByPk(item.productoId);
        if (producto) {
          montoRegreso += producto.precio * item.cantidad;
        }
      }
    }

    await salida.update({
      estado: "entregado",
      monto_regreso: montoRegreso,
    });

    const salidaActualizada = await SalidaCamion.findByPk(salida.id, {
      include: [
        {
          model: SalidaCamionItem,
          include: [{ model: Producto }],
        },
        { model: User, as: "repartidor_asignado", attributes: ["id", "nombre"] },
        { model: User, as: "creado_por", attributes: ["id", "nombre"] },
      ],
    });

    res.json({ message: "Regreso registrado", salida: salidaActualizada });
  } catch (error) {
    res.status(500).json({ message: "Error al registrar regreso", error: error.message });
  }
};

export const updateSalidaStatus = async (req, res) => {
  try {
    const salida = await SalidaCamion.findByPk(req.params.id);
    if (!salida) {
      return res.status(404).json({ message: "Salida no encontrada" });
    }

    if (req.userRole === "repartidor" && salida.asignadoRepartidorId !== req.user.id) {
      return res.status(403).json({ message: "No tienes permiso para modificar esta salida" });
    }

    if (await checkDayClosed(salida.fecha)) {
      return res.status(400).json({ message: "No se puede modificar, la caja del dia ya fue cerrada" });
    }

    const { estado, notas } = req.body;

    if (estado && !["pendiente", "en_camino", "entregado", "cancelado"].includes(estado)) {
      return res.status(400).json({ message: "Estado no valido" });
    }

    if (req.userRole === "repartidor") {
      const estadoActual = salida.estado;
      if (estado === "en_camino" && estadoActual !== "pendiente") {
        return res.status(400).json({ message: "Solo puedes cambiar de pendiente a en camino" });
      }
      if (estado === "entregado" && estadoActual !== "en_camino") {
        return res.status(400).json({ message: "Solo puedes entregar salidas que estan en camino" });
      }
      if (estado === "cancelado" && (estadoActual === "entregado" || estadoActual === "cancelado")) {
        return res.status(400).json({ message: "No puedes cancelar una entrega ya completada" });
      }
    }

    const updateData = { estado, notas: notas !== undefined ? notas : salida.notas };

    await salida.update(updateData);

    const salidaActualizada = await SalidaCamion.findByPk(salida.id, {
      include: [
        {
          model: SalidaCamionItem,
          include: [{ model: Producto }],
        },
        { model: User, as: "repartidor_asignado", attributes: ["id", "nombre"] },
        { model: User, as: "creado_por", attributes: ["id", "nombre"] },
      ],
    });

    res.json({ message: "Estado actualizado", salida: salidaActualizada });
  } catch (error) {
    res.status(500).json({ message: "Error al actualizar salida", error: error.message });
  }
};

export const updateSalidaCompleta = async (req, res) => {
  try {
    if (req.userRole === "repartidor") {
      return res.status(403).json({ message: "Los repartidores solo pueden modificar el estado" });
    }

    const salida = await SalidaCamion.findByPk(req.params.id, {
      include: [{ model: SalidaCamionItem }],
    });

    if (!salida) {
      return res.status(404).json({ message: "Salida no encontrada" });
    }

    if (await checkDayClosed(salida.fecha)) {
      return res.status(400).json({ message: "No se puede modificar, la caja del día ya fue cerrada" });
    }

    const { camion, destino, cliente_nombre, cliente_direccion, cliente_telefono, notas, asignadoRepartidorId, items } = req.body;

    if (salida.estado !== "pendiente") {
      return res.status(400).json({ message: "Solo se puede editar una salida en estado pendiente" });
    }

    for (const oldItem of salida.SalidaCamionItems) {
      const prod = await Producto.findByPk(oldItem.productoId);
      if (prod) {
        await prod.update({ stock: prod.stock + oldItem.cantidad });
      }
    }

    await SalidaCamionItem.destroy({ where: { salidaCamionId: salida.id } });

    let precioTotal = 0;
    if (items && items.length > 0) {
      for (const item of items) {
        const producto = await Producto.findByPk(item.productoId);
        if (!producto) {
          return res.status(400).json({ message: `Producto ID ${item.productoId} no encontrado` });
        }
        if (producto.stock < item.cantidad) {
          return res.status(400).json({
            message: `Stock insuficiente para "${producto.nombre}": disponible ${producto.stock}`,
          });
        }
        precioTotal += producto.precio * item.cantidad;
        await SalidaCamionItem.create({
          salidaCamionId: salida.id,
          productoId: item.productoId,
          cantidad: item.cantidad,
          precio_unitario: producto.precio,
        });
        await producto.update({ stock: producto.stock - item.cantidad });
      }
    }

    await salida.update({
      camion,
      destino,
      cliente_nombre,
      cliente_direccion,
      cliente_telefono,
      notas,
      precio_total: precioTotal,
      monto_salida: precioTotal,
      asignadoRepartidorId,
    });

    const salidaActualizada = await SalidaCamion.findByPk(salida.id, {
      include: [
        {
          model: SalidaCamionItem,
          include: [{ model: Producto }],
        },
        { model: User, as: "repartidor_asignado", attributes: ["id", "nombre"] },
        { model: User, as: "creado_por", attributes: ["id", "nombre"] },
      ],
    });

    res.json({ message: "Salida actualizada", salida: salidaActualizada });
  } catch (error) {
    res.status(500).json({ message: "Error al actualizar salida", error: error.message });
  }
};

export const deleteSalida = async (req, res) => {
  try {
    if (req.userRole === "repartidor") {
      return res.status(403).json({ message: "Los repartidores no pueden eliminar salidas" });
    }

    const salida = await SalidaCamion.findByPk(req.params.id, {
      include: [{ model: SalidaCamionItem }],
    });

    if (!salida) {
      return res.status(404).json({ message: "Salida no encontrada" });
    }

    if (await checkDayClosed(salida.fecha)) {
      return res.status(400).json({ message: "No se puede eliminar, la caja del día ya fue cerrada" });
    }

    if (salida.estado !== "pendiente") {
      return res.status(400).json({ message: "Solo se pueden eliminar salidas pendientes" });
    }

    for (const item of salida.SalidaCamionItems) {
      const prod = await Producto.findByPk(item.productoId);
      if (prod) {
        await prod.update({ stock: prod.stock + item.cantidad });
      }
    }

    await SalidaCamionItem.destroy({ where: { salidaCamionId: salida.id } });
    await salida.destroy();

    res.json({ message: "Salida eliminada y stock restaurado" });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar salida", error: error.message });
  }
};

export const getSalidasStats = async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const where = { fecha: today };

    if (req.userRole === "repartidor") {
      where.asignadoRepartidorId = req.user.id;
    }

    const totalHoy = await SalidaCamion.count({ where });
    const pendientes = await SalidaCamion.count({ where: { ...where, estado: "pendiente" } });
    const enCamino = await SalidaCamion.count({ where: { ...where, estado: "en_camino" } });
    const entregados = await SalidaCamion.count({ where: { ...where, estado: "entregado" } });

    const salidasHoy = await SalidaCamion.findAll({
      where,
      attributes: ["precio_total"],
    });
    const totalVentas = salidasHoy.reduce(
      (sum, s) => sum + (parseFloat(s.precio_total) || 0),
      0
    );

    res.json({
      fecha: today,
      total: totalHoy,
      pendientes,
      en_camino: enCamino,
      entregados,
      total_ventas: totalVentas.toFixed(2),
    });
  } catch (error) {
    res.status(500).json({ message: "Error al obtener estadísticas", error: error.message });
  }
};
