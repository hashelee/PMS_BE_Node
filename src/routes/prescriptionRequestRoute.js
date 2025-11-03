import { Router } from "express";
import { authenticate, authenticateUser } from "../middleware/authMiddleware.js";
import { createPrescriptionRequest, getPrescriptionRequestById } from "../controllers/prescriptionrequestController.js";

const router = Router();

router.post("/create/:pharmacyId",authenticateUser, createPrescriptionRequest);
router.get("/:requestId", authenticate, getPrescriptionRequestById);

export default router;
