import { Router } from "express";
import { registerPharmacy } from "../controllers/pharmacyController.js";

const router = Router();

router.post("/sign-up", registerPharmacy);

export default router;