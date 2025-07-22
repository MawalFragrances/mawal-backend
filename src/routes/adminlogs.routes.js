
import express from "express";

import {
    logAdminLogin,
    logAdminLogout,
    getAdminsActivities
} from "../controllers/adminlogs.controllers.js";

const router = express.Router();

router.post("/log-admin-login", logAdminLogin);
router.post("/log-admin-logout", logAdminLogout);
router.get("/get-admins-activities", getAdminsActivities);

export default router;