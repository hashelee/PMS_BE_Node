import { Router } from "express";
import { createMedicine, deleteMedicine, editMedicine } from "../controllers/medicineController.js";
import { authenticatePharmacy } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/create",authenticatePharmacy,createMedicine);
router.patch("/:medicineId/edit",authenticatePharmacy,editMedicine);
router.delete("/:medicineId/delete",authenticatePharmacy,deleteMedicine);
router.patch("/:medicineId/edit",authenticatePharmacy,editMedicine);

export default router;