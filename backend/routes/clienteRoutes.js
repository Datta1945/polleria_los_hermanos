import { Router } from "express";
import {
  getAllClientes,
  getClienteById,
  createCliente,
  updateCliente,
  getHistorialCuentaCorriente,
  registrarPagoCuentaCorriente,
  deleteCliente,
} from "../controllers/clienteController.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.use(authenticate);

router.get("/", getAllClientes);
router.get("/:id", getClienteById);
router.get("/:id/historial-cc", getHistorialCuentaCorriente);
router.post("/", createCliente);
router.post("/:id/pago-cc", registrarPagoCuentaCorriente);
router.put("/:id", updateCliente);
router.delete("/:id", deleteCliente);

export default router;
