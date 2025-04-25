import { Router } from "express";
import { createMedicine, deleteMedicine, editMedicine, getMedicineById } from "../controllers/medicineController.js";
import { authenticatePharmacy } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/create",authenticatePharmacy,createMedicine);
router.patch("/:medicineId/edit",authenticatePharmacy,editMedicine);
router.delete("/:medicineId/delete",authenticatePharmacy,deleteMedicine);
router.get("/:medicineId",authenticatePharmacy,getMedicineById);

export default router;