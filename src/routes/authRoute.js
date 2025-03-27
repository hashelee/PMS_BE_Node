import { Router } from "express";
import { login } from "../controllers/authController.js";

const router = Router();

router.post("/user/login",login);
router.post("/pharmacy/login",login);

export default router;