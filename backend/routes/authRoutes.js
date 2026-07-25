import { Router } from "express";
import { register, login, getProfile, getAllUsers, getLoginUsers, updateUser, deleteUser } from "../controllers/authController.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/login-users", getLoginUsers);
router.get("/profile", authenticate, getProfile);
router.get("/users", authenticate, authorize("admin"), getAllUsers);
router.put("/users/:id", authenticate, authorize("admin"), updateUser);
router.delete("/users/:id", authenticate, authorize("admin"), deleteUser);

export default router;
