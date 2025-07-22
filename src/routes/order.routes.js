import express from "express";
import {
    getOrders,
    getFilteredOrders,
    placeOrder,
    trackOrder,
    applyCoupon
} from "../controllers/order.controllers.js";

const router = express.Router();

// GET REQUESTS
router.get("/get-orders", getOrders);
router.get("/get-filtered-orders", getFilteredOrders);

// POST REQUESTS
router.post("/place-order", placeOrder);
router.post("/track-order", trackOrder);
router.post("/apply-coupon", applyCoupon);

export default router;