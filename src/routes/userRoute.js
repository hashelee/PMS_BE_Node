import { Router } from "express";
import { createUser,updateUser } from "../controllers/userController.js";
import { authenticateUser } from "../middleware/authMiddleware.js";
const router = Router();

router.post("/sign-up", createUser);

router.patch("/edit", authenticateUser, updateUser);

export default router;