import { Router } from "express";
import {
  getAllClientes,
  getClienteById,
  createCliente,
  updateCliente,
  getHistorialCuentaCorriente,
  deleteCliente,
} from "../controllers/clienteController.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.use(authenticate);

router.get("/", getAllClientes);
router.get("/:id", getClienteById);
router.get("/:id/historial-cc", getHistorialCuentaCorriente);
router.post("/", createCliente);
router.put("/:id", updateCliente);
router.delete("/:id", deleteCliente);

export default router;
