import { Router } from "express";
import { deletePharmacy, editPharmacy, getMedicine, registerPharmacy } from "../controllers/pharmacyController.js";
import { authenticatePharmacy } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/sign-up", registerPharmacy);
router.patch("/edit", authenticatePharmacy,editPharmacy);
router.delete("/delete", authenticatePharmacy,deletePharmacy);
router.get("/medicine", authenticatePharmacy,getMedicine);

export default router;