import { Router } from "express";
import { authenticate, authenticatePharmacy, authenticateUser } from "../middleware/authMiddleware.js";
import { approveRequesByPharmacy, approveRequestByUser, cancelRequestByPharmacy, createPrescriptionRequest, declineRequestByPharmacy, declineRequestByUser, getPrescriptionRequestById } from "../controllers/prescriptionrequestController.js";

const router = Router();

router.get("/:requestId", authenticate, getPrescriptionRequestById);

router.post("/create",authenticateUser, createPrescriptionRequest);

router.patch("/:requestId/approve-by-pharmacy", authenticatePharmacy, approveRequesByPharmacy);
router.patch("/:requestId/approve-by-user", authenticateUser, approveRequestByUser);
router.patch("/:requestId/decline-by-pharmacy", authenticatePharmacy, declineRequestByPharmacy);
router.patch("/:requestId/decline-by-user", authenticateUser, declineRequestByUser);
router.patch("/:requestId/cancel", authenticatePharmacy, cancelRequestByPharmacy);

export default router;
