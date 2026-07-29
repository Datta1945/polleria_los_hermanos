import { Banco } from "../models/index.js";

export const getAllBancos = async (req, res) => {
  try {
    const bancos = await Banco.findAll({
      where: { activo: true },
      order: [["nombre", "ASC"]],
    });
    res.json(bancos);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener bancos", error: error.message });
  }
};

export const createBanco = async (req, res) => {
  try {
    const { nombre } = req.body;
    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ message: "El nombre del banco es requerido" });
    }
    const [banco, created] = await Banco.findOrCreate({
      where: { nombre: nombre.trim() },
      defaults: { nombre: nombre.trim(), activo: true },
    });
    if (!created && !banco.activo) {
      await banco.update({ activo: true });
    }
    res.status(201).json({ message: "Banco guardado", banco });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(200).json({ message: "El banco ya existe", banco: await Banco.findOne({ where: { nombre: req.body.nombre.trim() } }) });
    }
    res.status(500).json({ message: "Error al crear banco", error: error.message });
  }
};

export const deleteBanco = async (req, res) => {
  try {
    const banco = await Banco.findByPk(req.params.id);
    if (!banco) return res.status(404).json({ message: "Banco no encontrado" });
    await banco.update({ activo: false });
    res.json({ message: "Banco eliminado" });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar banco", error: error.message });
  }
};
