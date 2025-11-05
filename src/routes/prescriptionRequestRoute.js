import { Router } from "express";
import { authenticate, authenticateUser } from "../middleware/authMiddleware.js";
import { createPrescriptionRequest, getPrescriptionRequestById } from "../controllers/prescriptionrequestController.js";

const router = Router();

router.get("/:requestId", authenticate, getPrescriptionRequestById);

router.post("/create",authenticateUser, createPrescriptionRequest);

export default router;
