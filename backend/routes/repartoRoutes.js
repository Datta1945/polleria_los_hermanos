import { Router } from "express";
import {
  getRepartosByDate,
  getAllRepartos,
  getRepartoById,
  createReparto,
  updateReparto,
  deleteReparto,
  getRepartosStats,
} from "../controllers/repartoController.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.use(authenticate);

router.get("/stats", getRepartosStats);
router.get("/hoy", getRepartosByDate);
router.get("/", getAllRepartos);
router.get("/:id", getRepartoById);
router.post("/", createReparto);
router.put("/:id", updateReparto);
router.delete("/:id", deleteReparto);

export default router;
