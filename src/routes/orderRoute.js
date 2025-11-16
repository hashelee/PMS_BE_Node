import { Router } from "express";
import {
  authenticate,
  authenticatePharmacy,
  authenticateUser,
} from "../middleware/authMiddleware.js";
import {
  allocateToDelivery,
  approveOrder,
  completeOrder,
  createOrder,
  declineOrder,
  getOrderById,
  getPharmacyOrders,
  getUserOrders,
} from "../controllers/orderController.js";

const router = Router();

router.post("/create", authenticateUser, createOrder);

router.patch("/:orderId/approve", authenticatePharmacy, approveOrder);
router.patch("/:orderId/decline", authenticatePharmacy, declineOrder);
router.patch(
  "/:orderId/allocate-to-delivery",
  authenticatePharmacy,
  allocateToDelivery
);
router.patch("/:orderId/complete", authenticatePharmacy, completeOrder);

router.get("/user/orders", authenticateUser, getUserOrders);
router.get("/pharmacy/orders", authenticatePharmacy, getPharmacyOrders);
router.get("/:orderId", authenticate, getOrderById);

export default router;
