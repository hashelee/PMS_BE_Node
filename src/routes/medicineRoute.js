import { Router } from "express";
import { createMedicine, deleteMedicine, editMedicine, getMedicineById, getPharmaciesByMedicines } from "../controllers/medicineController.js";
import { authenticatePharmacy, authenticateUser } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/create",authenticatePharmacy,createMedicine);
router.patch("/:medicineId/edit",authenticatePharmacy,editMedicine);
router.delete("/:medicineId/delete",authenticatePharmacy,deleteMedicine);

router.get("/search", authenticateUser, getPharmaciesByMedicines);
router.get("/:medicineId",authenticatePharmacy,getMedicineById);

export default router;