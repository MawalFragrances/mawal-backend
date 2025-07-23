import express from "express";
import {
    getTotalCustomers,
    getTotalOrders,
    getTotalSales,
    getOrdersByStatus,
    getOrderByNo,
    changeOrderStatus,
    deleteOrder,
    deleteProduct,
    restoreProduct,
    getOrdersData,
    loadMoreOrders,
    getProductsData,
    manageFcmToken,
    getAdminsData,
    addNewAdmin,
    deleteAdmin,
    getAnalyticsData,
    getReviewsData,
    updateReviewStatus,
    loadMoreReviews,
    getOverviewDataAndSidebarCounts,
    getReviewsByStatus,
    updatePromoMessages,
    getStoreData,
    addNewCoupon,
    deleteCoupon,
    updateShippingSettings,
    addNewProduct,
    updateHeroImages,
    updateSocialLinks,
} from "../controllers/admin.controllers.js";
import { authenticateAdmin } from "../middlewares/authenticateAdmin.js";
import { upload } from "../middlewares/multer.js";

const router = express.Router();

// GET REQUESTS
router.get("/get-store-data", authenticateAdmin, getStoreData);
router.get("/get-order-by-no", authenticateAdmin, getOrderByNo);
router.get("/get-orders-data", authenticateAdmin, getOrdersData);
router.get("/get-admins-data", authenticateAdmin, getAdminsData);
router.get("/get-reviews-data", authenticateAdmin, getReviewsData);
router.get("/load-more-orders", authenticateAdmin, loadMoreOrders);
router.get("/load-more-reviews", authenticateAdmin, loadMoreReviews);
router.get("/get-products-data", authenticateAdmin, getProductsData);
router.get("/get-analytics-data", authenticateAdmin, getAnalyticsData);
router.get("/get-orders-by-status", authenticateAdmin, getOrdersByStatus);
router.get("/get-reviews-by-status", authenticateAdmin, getReviewsByStatus);
router.get("/get-overview-data-and-sidebar-counts", authenticateAdmin, getOverviewDataAndSidebarCounts);

// POST REQUESTS
router.post("/add-new-admin", authenticateAdmin, addNewAdmin);
router.post("/add-new-coupon", authenticateAdmin, addNewCoupon);
router.post("/get-total-sales", authenticateAdmin, getTotalSales);
router.post("/manage-fcm-token", authenticateAdmin, manageFcmToken);
router.post("/get-total-orders", authenticateAdmin, getTotalOrders);
router.post("/get-total-customers", authenticateAdmin, getTotalCustomers);
router.post("/change-order-status", authenticateAdmin, changeOrderStatus);
router.post("/add-new-product", authenticateAdmin, upload.array("image", 5), addNewProduct);

// PATCH REQUESTS
router.patch("/update-promo-messages", authenticateAdmin, updatePromoMessages);
router.patch("/restore-product/:productId", authenticateAdmin, restoreProduct);
router.patch("/update-review-status/:id", authenticateAdmin, updateReviewStatus);
router.patch("/change-shipping-settings", authenticateAdmin, updateShippingSettings);
router.patch("/update-hero-images", authenticateAdmin, upload.array("image", 10), updateHeroImages);
router.patch("/update-social-links", authenticateAdmin, updateSocialLinks);
// DELETE REQUESTS
router.delete("/delete-coupon", authenticateAdmin, deleteCoupon);
router.delete("/delete-admin/:adminId", authenticateAdmin, deleteAdmin);
router.delete("/delete-order/:orderId", authenticateAdmin, deleteOrder);
router.delete("/delete-product/:productId", authenticateAdmin, deleteProduct);

export default router;