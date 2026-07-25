import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import sequelize from "./config/database.js";
import "./models/index.js";

import authRoutes from "./routes/authRoutes.js";
import proveedorRoutes from "./routes/proveedorRoutes.js";
import productoRoutes from "./routes/productoRoutes.js";
import repartoRoutes from "./routes/repartoRoutes.js";
import salidaCamionRoutes from "./routes/salidaCamionRoutes.js";
import cierreCajaRoutes from "./routes/cierreCajaRoutes.js";
import ventaRoutes from "./routes/ventaRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import clienteRoutes from "./routes/clienteRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/proveedores", proveedorRoutes);
app.use("/api/productos", productoRoutes);
app.use("/api/repartos", repartoRoutes);
app.use("/api/salidas-camion", salidaCamionRoutes);
app.use("/api/cierre-caja", cierreCajaRoutes);
app.use("/api/ventas", ventaRoutes);
app.use("/api/usuarios", userRoutes);
app.use("/api/clientes", clienteRoutes);

app.get("/api/health", (req, res) => {
  res.json({ message: "Los Pollos Hermanos API - Funcionando!" });
});

const start = async () => {
  try {
    await sequelize.authenticate();
    console.log("Base de datos conectada");

    await sequelize.sync();
    console.log("Modelos sincronizados");

    const [cols] = await sequelize.query("PRAGMA table_info(Venta)");
    const hasSalidaCamionId = cols.some((c) => c.name === "salidaCamionId");
    if (!hasSalidaCamionId) {
      await sequelize.query("ALTER TABLE Venta ADD COLUMN salidaCamionId INTEGER REFERENCES SalidaCamions(id)");
      console.log("Columna salidaCamionId agregada a Venta");
    }

    app.listen(PORT, () => {
      console.log(`Servidor corriendo en puerto ${PORT}`);
      console.log(`API: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error("Error al iniciar servidor:", error);
    process.exit(1);
  }
};

start();
