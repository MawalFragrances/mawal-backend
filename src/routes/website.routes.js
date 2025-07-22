import express from "express";
import {
    getWebsiteInitials
} from "../controllers/website.controllers.js";


const router = express.Router();

router.get("/get-website-initials", getWebsiteInitials);

export default router;