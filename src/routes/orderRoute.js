import { Router } from "express";
import {
  authenticatePharmacy,
  authenticateUser,
} from "../middleware/authMiddleware.js";
import { allocateToDelivery, approveOrder, createOrder, declineOrder, getPharmacyOrders, getUserOrders } from "../controllers/orderController.js";

const router = Router();

router.post("/create", authenticateUser, createOrder);

router.patch("/:orderId/approve", authenticatePharmacy, approveOrder);
router.patch("/:orderId/decline", authenticatePharmacy, declineOrder);
router.patch("/:orderId/allocate-to-delivery", authenticatePharmacy, allocateToDelivery);

router.get("/user/orders", authenticateUser, getUserOrders);
router.get("/pharmacy/orders", authenticatePharmacy, getPharmacyOrders);

export default router;