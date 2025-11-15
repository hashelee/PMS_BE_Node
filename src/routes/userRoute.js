import { Router } from "express";
import {
  addToCart,
  addToWishlist,
  createUser,
  getUserCart,
  getUserWishlist,
  removeFromCart,
  removeFromWishlist,
  updateUser,
  getUserProfile,
  deleteUser,
  getPrescriptionRequestsByUser,
  getUserById,
} from "../controllers/userController.js";
import {
  authenticatePharmacy,
  authenticateUser,
} from "../middleware/authMiddleware.js";
const router = Router();

router.post("/sign-up", createUser);
router.post("/wishlist/add", authenticateUser, addToWishlist);
router.post("/cart/add", authenticateUser, addToCart);

router.patch("/edit", authenticateUser, updateUser);

router.delete("/wishlist/remove", authenticateUser, removeFromWishlist);
router.delete("/cart/remove", authenticateUser, removeFromCart);
router.delete("/delete", authenticateUser, deleteUser);

router.get("/profile", authenticateUser, getUserProfile);
router.get("/cart", authenticateUser, getUserCart);
router.get("/wishlist", authenticateUser, getUserWishlist);
router.get(
  "/prescription-requests",
  authenticateUser,
  getPrescriptionRequestsByUser
);

router.get("/:id", authenticatePharmacy, getUserById);


export default router;
