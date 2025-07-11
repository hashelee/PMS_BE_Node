import { Router } from "express";
import { deletePharmacy, editPharmacy, getMedicine, getNearbyPharmacies, registerPharmacy } from "../controllers/pharmacyController.js";
import { authenticatePharmacy, authenticateUser } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/sign-up", registerPharmacy);
router.patch("/edit", authenticatePharmacy,editPharmacy);
router.delete("/delete", authenticatePharmacy,deletePharmacy);
router.get("/medicine", authenticatePharmacy,getMedicine);
router.get("/nearby", authenticateUser, getNearbyPharmacies);

export default router;