import { Cliente, Venta, VentaItem, Producto } from "../models/index.js";

export const getAllClientes = async (req, res) => {
  try {
    const clientes = await Cliente.findAll({
      where: { activo: true },
      order: [["nombre", "ASC"]],
    });
    res.json(clientes);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener clientes", error: error.message });
  }
};

export const getClienteById = async (req, res) => {
  try {
    const cliente = await Cliente.findByPk(req.params.id);
    if (!cliente) {
      return res.status(404).json({ message: "Cliente no encontrado" });
    }
    res.json(cliente);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener cliente", error: error.message });
  }
};

export const createCliente = async (req, res) => {
  try {
    const { nombre } = req.body;
    if (!nombre || nombre.trim() === "") {
      return res.status(400).json({ message: "El nombre del cliente es requerido" });
    }

    const cliente = await Cliente.create({ nombre: nombre.trim() });
    res.status(201).json({ message: "Cliente creado", cliente });
  } catch (error) {
    res.status(500).json({ message: "Error al crear cliente", error: error.message });
  }
};

export const updateCliente = async (req, res) => {
  try {
    const cliente = await Cliente.findByPk(req.params.id);
    if (!cliente) {
      return res.status(404).json({ message: "Cliente no encontrado" });
    }

    const { nombre, activo } = req.body;
    await cliente.update({
      nombre: nombre || cliente.nombre,
      activo: activo !== undefined ? activo : cliente.activo,
    });

    res.json({ message: "Cliente actualizado", cliente });
  } catch (error) {
    res.status(500).json({ message: "Error al actualizar cliente", error: error.message });
  }
};

export const getHistorialCuentaCorriente = async (req, res) => {
  try {
    const cliente = await Cliente.findByPk(req.params.id);
    if (!cliente) {
      return res.status(404).json({ message: "Cliente no encontrado" });
    }

    const ventas = await Venta.findAll({
      where: {
        clienteId: cliente.id,
        medio_pago: "cuenta_corriente",
        estado: "completada",
      },
      include: [
        {
          model: VentaItem,
          include: [{ model: Producto, attributes: ["id", "nombre"] }],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json({
      cliente,
      ventas,
      saldo_pendiente: parseFloat(cliente.saldo_pendiente),
      limite_credito: parseFloat(cliente.limite_credito),
      credito_disponible: parseFloat(cliente.limite_credito) - parseFloat(cliente.saldo_pendiente),
    });
  } catch (error) {
    res.status(500).json({ message: "Error al obtener historial", error: error.message });
  }
};

export const deleteCliente = async (req, res) => {
  try {
    const cliente = await Cliente.findByPk(req.params.id);
    if (!cliente) {
      return res.status(404).json({ message: "Cliente no encontrado" });
    }

    if (parseFloat(cliente.saldo_pendiente) > 0) {
      return res.status(400).json({ message: "No se puede eliminar un cliente con deuda pendiente" });
    }

    await cliente.update({ activo: false });
    res.json({ message: "Cliente desactivado" });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar cliente", error: error.message });
  }
};
