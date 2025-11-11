import { Router } from "express";
import { authenticate, authenticatePharmacy, authenticateUser } from "../middleware/authMiddleware.js";
import { approveRequesByPharmacy, createPrescriptionRequest, declineRequestByPharmacy, getPrescriptionRequestById } from "../controllers/prescriptionrequestController.js";

const router = Router();

router.get("/:requestId", authenticate, getPrescriptionRequestById);

router.post("/create",authenticateUser, createPrescriptionRequest);

router.patch("/:requestId/approve", authenticatePharmacy, approveRequesByPharmacy);
router.patch("/:requestId/decline", authenticatePharmacy, declineRequestByPharmacy);

export default router;
