import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const CierreCaja = sequelize.define("CierreCaja", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  fecha: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  hora: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  total_ventas: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  salidas_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  mercaderia_enviada: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  mercaderia_devuelta: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  ventas_netas: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  usuario_cierre: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

export default CierreCaja;
