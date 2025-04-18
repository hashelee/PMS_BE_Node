import { Router } from "express";
import { createMedicine, editMedicine } from "../controllers/medicineController.js";
import { authenticatePharmacy } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/create",authenticatePharmacy,createMedicine);
router.patch("/:medicineId/edit",authenticatePharmacy,editMedicine);

export default router;