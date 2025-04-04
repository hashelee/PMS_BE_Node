import { Router } from "express";
import { createMedicine } from "../controllers/medicineController.js";
import { authenticatePharmacy } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/create",authenticatePharmacy,createMedicine);

export default router;