import { Router } from "express";
import { editPharmacy, registerPharmacy } from "../controllers/pharmacyController.js";
import { authenticatePharmacy } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/sign-up", registerPharmacy);
router.patch("/edit", authenticatePharmacy,editPharmacy);

export default router;