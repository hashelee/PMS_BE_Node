import { Router } from "express";
import { addToCart, addToWishlist, createUser,getUserCart,getUserWishlist,removeFromCart,removeFromWishlist,updateUser } from "../controllers/userController.js";
import { authenticateUser } from "../middleware/authMiddleware.js";
const router = Router();

router.post("/sign-up", createUser);

router.patch("/edit", authenticateUser, updateUser);
router.post("/wishlist/add", authenticateUser, addToWishlist);
router.post("/cart/add", authenticateUser, addToCart);
router.delete("/wishlist/remove", authenticateUser, removeFromWishlist);
router.delete("/cart/remove", authenticateUser, removeFromCart);
router.get("/cart", authenticateUser, getUserCart);
router.get("/wishlist", authenticateUser, getUserWishlist);

export default router;