import { Router } from "express";
import { getAllBancos, createBanco, deleteBanco } from "../controllers/bancoController.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();
router.use(authenticate);

router.get("/", getAllBancos);
router.post("/", createBanco);
router.delete("/:id", deleteBanco);

export default router;
