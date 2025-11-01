import { Router } from "express";
import { authenticateUser } from "../middleware/authMiddleware.js";
import { createPrescriptionRequest } from "../controllers/prescriptionrequestController.js";

const router = Router();

router.post("/:pharmacyId/create",authenticateUser, createPrescriptionRequest);

export default router;
