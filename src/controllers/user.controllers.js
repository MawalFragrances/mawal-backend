import { Order } from "../models/order.model.js";
import { Review } from "../models/review.model.js";
import { consoleError, sendRes } from "../utils/comman.utils.js";

export const getUserDashboardData = async (req, res) => {
    try {
        const { email } = req.query;
        if (!email) return sendRes(res, 400, "Email is required.");

        const [orders, reviews] = await Promise.all([
            Order.find({ "user.email": email }).sort({ createdAt: -1 }).populate("products.productId"),
            Review.find({ email }).sort({ createdAt: -1 }).populate("productId"),
        ]);

        const totalOrders = orders.length;

        const totalSpent = orders.reduce((sum, order) => {
            return sum + (order.orderTotal || 0);
        }, 0);

        const totalReviews = reviews.length;

        const recentOrders = orders.slice(0, 5);
        const recentReviews = reviews.slice(0, 5);

        return sendRes(res, 200, "User dashboard data fetched successfully", {
            totalOrders,
            totalSpent,
            totalReviews,
            recentOrders,
            recentReviews,
        });
    } catch (error) {
        consoleError("getUserDashboardData (user.controller.js)", error);
        return sendRes(res, 500, "Something went wrong. Please try again later.");
    }
};
