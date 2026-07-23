import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Venta = sequelize.define("Venta", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  numero_comprobante: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  fecha: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  hora: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  tipo_venta: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "local",
    validate: { isIn: [["local", "reparto"]] },
  },
  cliente_nombre: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  cliente_direccion: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  cliente_telefono: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  medio_pago: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "efectivo",
    validate: { isIn: [["efectivo", "transferencia", "tarjeta", "otro"]] },
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  total: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  notas: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  clienteId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: "Cliente asociado (requerido para cuenta corriente)",
  },
  estado: {
    type: DataTypes.STRING,
    defaultValue: "completada",
    validate: { isIn: [["completada", "cancelada"]] },
  },
});

export default Venta;
