import { Router } from "express";
import {
  deletePharmacy,
  editPharmacy,
  getMedicine,
  getNearbyPharmacies,
  getNearbyPharmaciesByName,
  registerPharmacy,
  getPharmacyDetails,
} from "../controllers/pharmacyController.js";
import {
  authenticate,
  authenticatePharmacy,
  authenticateUser,
} from "../middleware/authMiddleware.js";

const router = Router();

router.post("/sign-up", registerPharmacy);
router.patch("/edit", authenticatePharmacy, editPharmacy);
router.delete("/delete", authenticatePharmacy, deletePharmacy);
router.get("/medicine", authenticatePharmacy, getMedicine);
router.get("/nearby", authenticateUser, getNearbyPharmacies);
router.get("/search", authenticateUser, getNearbyPharmaciesByName);
router.get("/pharmacyDetails",authenticate, getPharmacyDetails);

export default router;
