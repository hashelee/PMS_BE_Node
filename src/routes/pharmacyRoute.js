import { Router } from "express";
import { deletePharmacy, editPharmacy, getMedicine, getNearbyPharmacies, getNearbyPharmaciesByName, registerPharmacy } from "../controllers/pharmacyController.js";
import { authenticatePharmacy, authenticateUser } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/sign-up", registerPharmacy);
router.patch("/edit", authenticatePharmacy,editPharmacy);
router.delete("/delete", authenticatePharmacy,deletePharmacy);
router.get("/medicine", authenticatePharmacy,getMedicine);
router.get("/nearby", authenticateUser, getNearbyPharmacies);
router.get("/search", authenticateUser, getNearbyPharmaciesByName);
export default router;