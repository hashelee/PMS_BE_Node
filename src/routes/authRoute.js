import { Router } from "express";
import { loginUser,loginPharmacy,changePassword, forgotPasswordUser, forgotPasswordPharmacy, sendOtp } from "../controllers/authController.js";
import { authenticateUser,authenticatePharmacy } from "../middleware/authMiddleware.js"; 
const router = Router();

router.post("/user/login",loginUser);
router.post("/pharmacy/login",loginPharmacy);
router.post("/user/changePassword",authenticateUser,changePassword);
router.post("/pharmacy/changePassword",authenticatePharmacy,changePassword);
router.post("/user/forgotPassword",forgotPasswordUser);
router.post("/pharmacy/forgotPassword",forgotPasswordPharmacy);
router.post("/send-otp",sendOtp);

export default router;