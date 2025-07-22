import express from "express";
// CONTROLLERS
import {
    getUserDashboardData,
} from "../controllers/user.controllers.js";
// MIDDLEWARES
import { authenticateToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

// GET REQUESTS
router.get("/get-user-dashboard-data", authenticateToken, getUserDashboardData);


export default router;