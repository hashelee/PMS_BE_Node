import { Router } from "express";
import {
  getNotifications,
  markNotificationRead,
  deleteNotification, 
} from "../controllers/notificationController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", authenticate, getNotifications);
router.patch("/:notificationId/read", authenticate, markNotificationRead);
router.delete("/:notificationId", authenticate, deleteNotification); 

export default router;
