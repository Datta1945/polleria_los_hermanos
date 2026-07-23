import User from "./User.js";
import Role from "./Role.js";
import Proveedor from "./Proveedor.js";
import Producto from "./Producto.js";
import Reparto from "./Reparto.js";
import RepartoItem from "./RepartoItem.js";
import SalidaCamion from "./SalidaCamion.js";
import SalidaCamionItem from "./SalidaCamionItem.js";
import CierreCaja from "./CierreCaja.js";
import Venta from "./Venta.js";
import VentaItem from "./VentaItem.js";
import Cliente from "./Cliente.js";

User.belongsTo(Role, { foreignKey: "roleId" });
Role.hasMany(User, { foreignKey: "roleId" });

Producto.belongsTo(Proveedor, { foreignKey: "proveedorId" });
Proveedor.hasMany(Producto, { foreignKey: "proveedorId" });

RepartoItem.belongsTo(Reparto, { foreignKey: "repartoId" });
Reparto.hasMany(RepartoItem, { foreignKey: "repartoId" });

RepartoItem.belongsTo(Producto, { foreignKey: "productoId" });
Producto.hasMany(RepartoItem, { foreignKey: "productoId" });

Reparto.belongsTo(User, { foreignKey: "userId", as: "creado_por" });
User.hasMany(Reparto, { foreignKey: "userId" });

SalidaCamionItem.belongsTo(SalidaCamion, { foreignKey: "salidaCamionId" });
SalidaCamion.hasMany(SalidaCamionItem, { foreignKey: "salidaCamionId" });

SalidaCamionItem.belongsTo(Producto, { foreignKey: "productoId" });
Producto.hasMany(SalidaCamionItem, { foreignKey: "productoId" });

SalidaCamion.belongsTo(User, { foreignKey: "asignadoRepartidorId", as: "repartidor_asignado" });
User.hasMany(SalidaCamion, { foreignKey: "asignadoRepartidorId" });

SalidaCamion.belongsTo(User, { foreignKey: "creadoPorId", as: "creado_por" });
User.hasMany(SalidaCamion, { foreignKey: "creadoPorId" });

VentaItem.belongsTo(Venta, { foreignKey: "ventaId" });
Venta.hasMany(VentaItem, { foreignKey: "ventaId" });

VentaItem.belongsTo(Producto, { foreignKey: "productoId" });
Producto.hasMany(VentaItem, { foreignKey: "productoId" });

Venta.belongsTo(User, { foreignKey: "usuarioId", as: "vendedor" });
User.hasMany(Venta, { foreignKey: "usuarioId" });

Venta.belongsTo(Cliente, { foreignKey: "clienteId", as: "cliente" });
Cliente.hasMany(Venta, { foreignKey: "clienteId" });

export { User, Role, Proveedor, Producto, Reparto, RepartoItem, SalidaCamion, SalidaCamionItem, CierreCaja, Venta, VentaItem, Cliente };
