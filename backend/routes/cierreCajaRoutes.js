import { Router } from "express";
import {
  getResumenDelDia,
  cerrarCaja,
  getHistorialCierres,
  getPagosHoy,
} from "../controllers/cierreCajaController.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = Router();

router.use(authenticate);

router.get("/resumen-hoy", getResumenDelDia);
router.get("/historial", authorize("admin", "operador"), getHistorialCierres);
router.get("/pagos-hoy", authorize("admin", "operador"), getPagosHoy);
router.post("/cerrar", authorize("admin", "operador"), cerrarCaja);

export default router;
