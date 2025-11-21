import { Router } from "express";
import {
  addRating,
  getUserRatings,
  getPharmacyRatings,
  getPharmacyAverageRating
} from "../controllers/ratingController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/add", authenticate, addRating);

router.get("/user/all", authenticate, getUserRatings);

router.get("/pharmacy/all", authenticate, getPharmacyRatings);

router.get("/pharmacy/:pharmacyId/average", authenticate, getPharmacyAverageRating);

export default router;
