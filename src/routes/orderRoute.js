import { Router } from "express";
import {
  authenticatePharmacy,
  authenticateUser,
} from "../middleware/authMiddleware.js";
import { getPharmacyOrders, getUserOrders } from "../controllers/orderController.js";

const router = Router();

router.get("/user/orders", authenticateUser, getUserOrders);
router.get("/pharmacy/orders", authenticatePharmacy, getPharmacyOrders);

export default router;