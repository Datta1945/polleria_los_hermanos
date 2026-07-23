import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Proveedor = sequelize.define("Proveedor", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  telefono: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  direccion: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  tipo_producto: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: "Ej: pollos, garnacha, bebidas, etc.",
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
});

export default Proveedor;
