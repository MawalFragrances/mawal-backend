import express from "express";
import {
    subscribeToNewsletters,
    unsubscribeToNewsletters
} from "../controllers/newsletters.controllers.js";


const router = express.Router();

// POST REQUESTS
router.post("/subscribe-to-newsletters", subscribeToNewsletters);
// DELETE REQUESTS
router.delete("/unsubscribe-to-newsletters", unsubscribeToNewsletters);

export default router;