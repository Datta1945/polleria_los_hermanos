import { Producto, Proveedor } from "../models/index.js";
import { Op, literal } from "sequelize";

export const getAllProductos = async (req, res) => {
  try {
    const productos = await Producto.findAll({
      include: [{ model: Proveedor, attributes: ["id", "nombre"] }],
      where: { activo: true },
    });
    res.json(productos);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener productos", error: error.message });
  }
};

export const getLowStock = async (req, res) => {
  try {
    const productos = await Producto.findAll({
      include: [{ model: Proveedor, attributes: ["id", "nombre"] }],
      where: {
        activo: true,
        stock: { [Op.lte]: literal("stock_minimo") },
      },
    });
    res.json(productos);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener productos con bajo stock", error: error.message });
  }
};

export const createProducto = async (req, res) => {
  try {
    const { nombre, descripcion, precio, stock, unidad, proveedorId } = req.body;

    const producto = await Producto.create({
      nombre,
      descripcion,
      precio,
      stock,
      unidad,
      proveedorId,
    });

    res.status(201).json({ message: "Producto creado", producto });
  } catch (error) {
    res.status(500).json({ message: "Error al crear producto", error: error.message });
  }
};

export const updateProducto = async (req, res) => {
  try {
    const producto = await Producto.findByPk(req.params.id);
    if (!producto) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    await producto.update(req.body);
    res.json({ message: "Producto actualizado", producto });
  } catch (error) {
    res.status(500).json({ message: "Error al actualizar producto", error: error.message });
  }
};

export const deleteProducto = async (req, res) => {
  try {
    const producto = await Producto.findByPk(req.params.id);
    if (!producto) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    await producto.update({ activo: false });
    res.json({ message: "Producto desactivado" });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar producto", error: error.message });
  }
};
