import express from "express";
import {
    checkAuth,
    logoutAdmin,
    loginWithGoogle,
    verifyOtp,
} from "../controllers/adminauth.controllers.js";
import { authenticateAdmin } from "../middlewares/authenticateAdmin.js";

const router = express.Router();

// GET REQUESTS
router.get("/logout-admin", logoutAdmin);
router.get("/check-auth", authenticateAdmin, checkAuth);

router.get("/verify-otp", verifyOtp);
router.get("/login-with-google", loginWithGoogle);

export default router;