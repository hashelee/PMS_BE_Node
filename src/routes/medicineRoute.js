import { Router } from "express";
import { createMedicine, deleteMedicine, editMedicine, getMedicineById, getPharmaciesByMedicines, searchInPharmacy } from "../controllers/medicineController.js";
import { authenticate, authenticatePharmacy, authenticateUser } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/create",authenticatePharmacy,createMedicine);

router.patch("/:medicineId/edit",authenticatePharmacy,editMedicine);

router.delete("/:medicineId/delete",authenticatePharmacy,deleteMedicine);

router.get("/search", authenticateUser, getPharmaciesByMedicines);
router.get("/:pharmacyId/search",authenticateUser,searchInPharmacy);
router.get("/:medicineId",authenticate,getMedicineById);

export default router;