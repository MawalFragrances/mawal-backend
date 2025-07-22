import { Store } from "../models/store.model.js";
import { Review } from "../models/review.model.js";
import { Product } from "../models/product.model.js";
import { consoleError, sendRes } from "../utils/comman.utils.js";

// 1. GET ALL PRODUCTS WITH TOTAL REVIEWS AND AVERAGE RATING
// 2. GET STORE DETAILS
export const getWebsiteInitials = async (req, res) => {
    try {
        const storeId = process.env.STORE_ID;

        const [
            allProducts,
            store,
            reviewStats,
        ] = await Promise.all([
            Product.find({ isProductDeleted: false }),
            Store.findById(storeId),
            Review.aggregate([
                {
                    $match: { status: "APPROVED" }
                },
                {
                    $group: {
                        _id: "$productId",
                        totalReviews: { $sum: 1 },
                        averageRating: { $avg: "$rating" }
                    }
                }
            ])
        ]);

        const productWithStats = allProducts.map(product => {
            const stats = reviewStats.find(stat => stat._id.toString() === product._id.toString());
            return {
                ...product.toObject(),
                totalReviews: stats?.totalReviews || 0,
                averageRating: stats?.averageRating?.toFixed(1) || "0.0"
            };
        });

        return sendRes(res, 200, "Website initials fetched successfully", {
            allProducts: productWithStats,
            store,
        });
    } catch (error) {
        consoleError("getWebsiteInitials (website.controllers.js)", error);
        return sendRes(res, 500, "Something went wrong on our side. Please! try again.");
    }
};