import { Admin } from "../models/admin.model.js";
import { Order } from "../models/order.model.js";
import { Product } from "../models/product.model.js";
import { Review } from "../models/review.model.js";
import { Store } from "../models/store.model.js";
import { generateTimeFrameQuery, consoleError, sendRes } from "../utils/comman.utils.js";
import fs from "fs";
import cloudinary from "../utils/cloudinary.js";
import mongoose from "mongoose";

const storeId = process.env.STORE_ID;

export const manageFcmToken = async (req, res) => {
    try {
        const { token } = req.body;
        const { admin } = req;

        if (!token) return sendRes(res, 400, "FCM token is required");
        const existedTokens = admin.fcmTokens || [];

        if (existedTokens.includes(token)) return sendRes(res, 200, "FCM token already exists");

        const updatedAdmin = await Admin.findByIdAndUpdate(admin.userId,
            { fcmTokens: [...existedTokens, token] },
            { new: true }
        );

        return sendRes(res, 200, "FCM token updated successfully", updatedAdmin);

    } catch (error) {
        consoleError("manageFcmToken (admin.controllers.js)", error);
        return sendRes(res, 500, "Something went wrong on our side. Please! try again.");
    }
};

export const getOrdersByStatus = async (req, res) => {
    try {
        const { status } = req.query;

        const page = parseInt(req.query.page) || 1;
        const limit = 15;
        const skip = (page - 1) * limit;

        const [filteredOrders, filteredOrdersCount] = await Promise.all([
            Order.find({ status })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),

            Order.countDocuments({ status })
        ]);

        return sendRes(res, 200, "Orders fetched successfully", {
            filteredOrders,
            filteredOrdersCount
        });
    } catch (error) {
        consoleError("getOrdersByStatus (admin.controllers.js)", error);
        return sendRes(res, 500, "Something went wrong on our side. Please! try again.");
    }
};

export const changeOrderStatus = async (req, res) => {
    try {
        const { orderId, status } = req.body;
        if (!orderId || !status) return sendRes(res, 400, "Order ID and status are required");

        const updatedOrder = await Order.findByIdAndUpdate(orderId, { status }, { new: true });
        if (!updatedOrder) return sendRes(res, 404, "Order not found");

        return sendRes(res, 200, "Order status updated successfully", updatedOrder);

    } catch (error) {
        consoleError("changeOrderStatus (admin.controllers.js)", error);
        return sendRes(res, 500, "Something went wrong on our side. Please! try again.");
    }
};

export const deleteOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        if (!orderId) return sendRes(res, 400, "Order ID is required");

        const deletedOrder = await Order.findByIdAndDelete(orderId);
        if (!deletedOrder) return sendRes(res, 404, "Order not found");

        return sendRes(res, 200, "Order deleted successfully", deletedOrder);
    }
    catch (error) {
        consoleError("deleteOrder (admin.controllers.js)", error);
        return sendRes(res, 500, "Something went wrong on our side. Please! try again.");
    }
};



// OVERVIEW PAGE
export const getOverviewDataAndSidebarCounts = async (req, res) => {
    try {
        const [
            // OVERVIEW STATS
            totalOrders,
            totalRevenue,
            totalCustomers,

            // RECENT ORDERS AND TOP PRODUCTS
            recentOrders,
            topProducts,

            // SIDEBAR COUNTS
            pendingOrdersCount,
            lowStockProductsCount,
            pendingReviewsCount,
        ] = await Promise.all([
            Order.countDocuments(),
            // CALCULATES TOTAL REVENUE OF SHIPPED ORDERS
            Order.aggregate([
                { $match: { status: "SHIPPED" } },
                { $group: { _id: null, totalRevenue: { $sum: "$orderTotal" } } }
            ]),
            // CALCULATES TOTAL CUSTOMERS
            Order.aggregate([
                { $group: { _id: "$user.email" } },
                { $count: "totalCustomers" }
            ]),

            // 5 MOST RECENT ORDERS
            Order.find({}).sort({ createdAt: -1 }).limit(5),
            // 5 MOST SOLD PRODUCTS
            Order.aggregate([
                { $unwind: "$products" },
                {
                    $group: {
                        _id: "$products.productId",
                        totalSold: { $sum: "$products.quantity" }
                    }
                },
                { $sort: { totalSold: -1 } },
                { $limit: 5 },
                {
                    $lookup: {
                        from: "products",
                        localField: "_id",
                        foreignField: "_id",
                        as: "product"
                    }
                },
                { $unwind: "$product" },
                {
                    $project: {
                        _id: "$product._id",
                        name: "$product.name",
                        images: "$product.images",
                        totalSold: 1
                    }
                }
            ]),

            // SIDEBAR COUNTS (ALERTS FOR ADMIN)
            Order.countDocuments({ status: "PENDING" }),
            Product.countDocuments({ stock: { $lt: 10 } }),
            Review.countDocuments({ status: "PENDING" }),
        ]);

        return sendRes(res, 200, "Overview data fetched successfully", {
            totalOrders,
            totalRevenue: totalRevenue[0]?.totalRevenue || 0,
            totalCustomers: totalCustomers[0]?.totalCustomers || 0,

            recentOrders,
            topProducts,

            pendingOrdersCount,
            lowStockProductsCount,
            pendingReviewsCount,
        });
    } catch (error) {
        consoleError("getOverviewDataAndSidebarCounts (admin.controllers.js)", error);
        return sendRes(res, 500, "Something went wrong on our side. Please! try again.");
    }
};

// ORDERS PAGE
export const getOrdersData = async (req, res) => {
    try {
        const [
            totalOrdersCount,
            pendingOrdersCount,
            completedOrdersCount,

            recentOrders,
        ] = await Promise.all([
            Order.countDocuments(),
            Order.countDocuments({ status: "PENDING" }),
            Order.countDocuments({ $or: [{ status: "SHIPPED" }, { status: "DELIVERED" }] }),

            Order.find({}).sort({ createdAt: -1 }).limit(15).populate("products.productId"),
        ]);

        return sendRes(res, 200, "Orders data fetched successfully", {
            totalOrdersCount,
            pendingOrdersCount,
            completedOrdersCount,

            recentOrders,
        });

    } catch (error) {
        consoleError("getOrdersData (admin.controllers.js)", error);
        return sendRes(res, 500, "Something went wrong on our side. Please! try again.");
    }
};
export const loadMoreOrders = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 15;
        const skip = (page - 1) * limit;

        const orders = await Order.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        return sendRes(res, 200, "Orders fetched successfully.", orders);
    } catch (error) {
        consoleError("loadMoreOrders (admin.controllers.js)", error);
        return sendRes(res, 500, "Something went wrong on our side. Please! try again.");
    }
};
export const getOrderByNo = async (req, res) => {
    try {

        const orderNumber = parseInt(req.query.orderNumber);

        if (isNaN(orderNumber)) return sendRes(res, 400, "Only numbers are allowed");

        const searchedOrder = await Order.findOne({ orderNumber });

        return sendRes(res, 200, "Order fetched successfully", searchedOrder);
    }
    catch (error) {
        consoleError("getOrderByNo (admin.controllers.js)", error);
        return sendRes(res, 500, "Something went wrong on our side. Please! try again.");
    }
};


// PRODUCTS PAGE
export const getProductsData = async (req, res) => {
    try {
        const [
            totalProductsCount,
            deletedProductsCount,
            lowStockProductsCount,

            allProducts,
            deletedProducts,
        ] = await Promise.all([
            Product.countDocuments({ isProductDeleted: false }),
            Product.countDocuments({ isProductDeleted: true }),
            Product.countDocuments({ stock: { $lt: 10 } }),

            Product.find({ isProductDeleted: false }),
            Product.find({ isProductDeleted: true }),
        ]);

        return sendRes(res, 200, "Products data fetched successfully", {
            totalProductsCount,
            deletedProductsCount,
            lowStockProductsCount,

            allProducts,
            deletedProducts,
        });
    } catch (error) {
        consoleError("getProductsData (admin.controllers.js)", error);
        return sendRes(res, 500, "Something went wrong on our side. Please! try again.");
    }
};
export const addNewProduct = async (req, res) => {
    try {
        const {
            name,
            sizeAndPrices,
            discount,
            ingredients,
            description,
            tags,
            category,
            stock
        } = req.body;

        const parsedSizeAndPrices = JSON.parse(sizeAndPrices);

        if (!name || !ingredients || !description || !category || !stock || !parsedSizeAndPrices || !Array.isArray(parsedSizeAndPrices)) {
            if (req.files && req.files.length > 0) {
                req.files.forEach(file => fs.unlinkSync(file.path));
            }
            return sendRes(res, 400, "Missing required product fields.");
        }

        let images = [];

        if (req.files && req.files.length > 0) {
            const imageUploadPromises = req.files.map(file =>
                cloudinary.uploader.upload(file.path)
            );

            const uploadedImages = await Promise.all(imageUploadPromises);

            images = uploadedImages.map(img => img.secure_url);

            req.files.forEach(file => fs.unlinkSync(file.path));
        }

        const newProduct = await Product.create({
            name: name.trim(),
            images,
            sizeAndPrices: parsedSizeAndPrices,
            discount,
            ingredients: ingredients.trim(),
            description: description.trim(),
            tags: tags.split(",").map(tag => tag.trim()),
            category,
            stock
        });

        if (!newProduct) return sendRes(res, 400, "Failed to add new product");

        return sendRes(res, 200, "Product added successfully", newProduct);
    }
    catch (error) {
        consoleError("addNewProduct (admin.controllers.js)", error);
        if (req.files && req.files.length > 0) {
            req.files.forEach(file => {
                if (fs.existsSync(file.path)) {
                    fs.unlinkSync(file.path);
                }
            });
        }
        return sendRes(res, 500, "Something went wrong on our side. Please! try again.");
    }

};
export const deleteProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        if (!productId) return sendRes(res, 400, "Product ID is required");

        const deletedProduct = await Product.findByIdAndUpdate(productId, { isProductDeleted: true }, { new: true });
        if (!deletedProduct) return sendRes(res, 404, "Product not found");

        return sendRes(res, 200, "Product deleted successfully", deletedProduct);
    }
    catch (error) {
        consoleError("deleteProduct (admin.controllers.js)", error);
        return sendRes(res, 500, "Something went wrong on our side. Please! try again.");
    }
};
export const restoreProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        if (!productId) return sendRes(res, 400, "Product ID is required");

        const restoredProduct = await Product.findByIdAndUpdate(productId, { isProductDeleted: false }, { new: true });
        if (!restoredProduct) return sendRes(res, 404, "Product not found");

        return sendRes(res, 200, "Product restored successfully", restoredProduct);
    }
    catch (error) {
        consoleError("restoreProduct (admin.controllers.js)", error);
        return sendRes(res, 500, "Something went wrong on our side. Please! try again.");
    }
};


// ANALYTICS PAGE
const getLastYearSales = async () => {
    try {
        const now = new Date();
        const lastYear = new Date(now.getFullYear() - 1, now.getMonth() + 1, 1);

        const salesData = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: lastYear },
                    status: { $in: ["SHIPPED", "DELIVERED"] }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" }
                    },
                    totalSales: { $sum: "$orderTotal" }
                }
            },
            {
                $sort: {
                    "_id.year": 1,
                    "_id.month": 1
                }
            }
        ]);


        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const result = [];

        for (let i = 11; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const month = date.getMonth() + 1;
            const year = date.getFullYear();

            const monthData = salesData.find(
                item => item._id.month === month && item._id.year === year
            );

            result.push({
                month: monthNames[month - 1],
                totalSales: monthData ? monthData.totalSales : 0
            });
        }

        return result;
    } catch (error) {
        consoleError("getLastYearSales (admin.controllers.js)", error);
        return []
    }
};
export const getAnalyticsData = async (req, res) => {
    try {
        const [totalOrders, totalCustomers, totalRevenue, lastYearSales] = await Promise.all([
            Order.countDocuments(),
            Order.aggregate([
                { $group: { _id: "$user.email" } },
                { $count: "totalCustomers" }
            ]),
            Order.aggregate([
                { $match: { status: { $in: ["SHIPPED", "DELIVERED"] } } },
                { $group: { _id: null, totalRevenue: { $sum: "$orderTotal" } } }
            ]),
            getLastYearSales(),
        ]);

        return sendRes(res, 200, "Analytics data fetched successfully", {
            totalOrders,
            totalCustomers: totalCustomers[0]?.totalCustomers || 0,
            totalRevenue: totalRevenue[0]?.totalRevenue || 0,
            lastYearSales,
        });
    } catch (error) {
        consoleError("getAnalyticsData (admin.controllers.js)", error);
        return sendRes(res, 500, "Something went wrong on our side. Please! try again.");
    }
};
export const getTotalOrders = async (req, res) => {
    try {
        const { timeFrame, customStartDate, customEndDate } = req.body;

        const query = generateTimeFrameQuery(timeFrame, customStartDate, customEndDate);

        const totalOrders = await Order.countDocuments({
            ...query
        });

        if (totalOrders === 0) return sendRes(res, 200, "Dashboard data fetched successfully", 0);
        return sendRes(res, 200, "Dashboard data fetched successfully", totalOrders);

    } catch (error) {
        consoleError("getTotalOrders (admin.controllers.js)", error);
        return sendRes(res, 500, "Something went wrong on our side. Please! try again.");
    }
};
export const getTotalCustomers = async (req, res) => {
    try {
        const { timeFrame, customStartDate, customEndDate } = req.body;

        const query = generateTimeFrameQuery(timeFrame, customStartDate, customEndDate);

        let totalCustomers = await Order.aggregate([
            { $match: query },
            { $group: { _id: "$user.email", } },
            { $count: "totalUniqueCustomers" }
        ]);

        totalCustomers = totalCustomers[0]?.totalUniqueCustomers || 0;

        return sendRes(res, 200, "Dashboard data fetched successfully", totalCustomers);

    } catch (error) {
        consoleError("getTotalCustomers (admin.controllers.js)", error);
        return sendRes(res, 500, "Something went wrong on our side. Please! try again.");
    }
};
export const getTotalSales = async (req, res) => {
    try {
        const { timeFrame, customStartDate, customEndDate } = req.body;

        const query = generateTimeFrameQuery(timeFrame, customStartDate, customEndDate);

        const response = await Order.aggregate([
            { $match: { ...query, status: { $in: ["SHIPPED", "DELIVERED"] } } },
            {
                $group: {
                    _id: null,
                    totalSales: { $sum: "$orderTotal" }
                }
            }
        ])

        const totalSales = response.length > 0 ? response[0].totalSales : 0;

        return sendRes(res, 200, "Dashboard data fetched successfully", totalSales);

    } catch (error) {
        consoleError("getTotalSales (admin.controllers.js)", error);
        return sendRes(res, 500, "Something went wrong on our side. Please! try again.");
    }
};

// ADMIN PAGE
export const getAdminsData = async (req, res) => {
    try {
        const admins = await Admin.find({});
        return sendRes(res, 200, "Admins fetched successfully", admins);
    } catch (error) {
        consoleError("getAdminData (admin.controllers.js)", error);
        return sendRes(res, 500, "Something went wrong on our side. Please! try again.");
    }
};
export const addNewAdmin = async (req, res) => {
    try {
        const { admin } = req;
        const { name, email, role } = req.body;

        const loggedInAdmin = await Admin.findById(admin.userId);

        if (loggedInAdmin.role !== "Super Admin") return sendRes(res, 403, "You are not authorized to add new admins");
        if (loggedInAdmin.email === email) return sendRes(res, 400, "You cannot add yourself as an admin");

        const existedAdmin = await Admin.findOne({ email });
        if (existedAdmin) return sendRes(res, 400, "Admin already exists");

        const newAdmin = await Admin.create({ name, email, role });

        return sendRes(res, 200, "Admin added successfully", newAdmin);
    } catch (error) {
        consoleError("addNewAdmin (admin.controllers.js)", error);
        return sendRes(res, 500, "Something went wrong on our side. Please! try again.");
    }
};
export const deleteAdmin = async (req, res) => {
    try {
        const { adminId } = req.params;
        const { email } = req.query;

        const MAIN_ADMIN_EMAIL = "fragrances.mawal@gmail.com";
        if (email === MAIN_ADMIN_EMAIL) return sendRes(res, 400, "You cannot delete the main admin");

        if (!adminId) return sendRes(res, 400, "Admin ID is required");

        const deletedAdmin = await Admin.findByIdAndDelete(adminId);
        if (!deletedAdmin) return sendRes(res, 404, "Admin not found");

        return sendRes(res, 200, "Admin deleted successfully", deletedAdmin);
    } catch (error) {
        consoleError("deleteAdmin (admin.controllers.js)", error);
        return sendRes(res, 500, "Something went wrong on our side. Please! try again.");
    }
};

// STORE PAGE
export const getStoreData = async (req, res) => {
    try {
        const store = await Store.findById(storeId);
        if (!store) return sendRes(res, 404, "Store not found");

        return sendRes(res, 200, "Store data fetched successfully", store);
    } catch (error) {
        consoleError("getStoreData (admin.controllers.js)", error);
        return sendRes(res, 500, "Something went wrong on our side. Please! try again.");
    }
}
export const updatePromoMessages = async (req, res) => {
    try {
        const { promoMessages } = req.body;
        if (!promoMessages) return sendRes(res, 400, "Promo messages are required");

        const updatedStore = await Store.findByIdAndUpdate(storeId, { promoMessages }, { new: true });
        if (!updatedStore) return sendRes(res, 404, "Store not found");

        return sendRes(res, 200, "Promo messages updated successfully", updatedStore);
    } catch (error) {
        consoleError("updatePromoMessage (admin.controllers.js)", error);
        return sendRes(res, 500, "Something went wrong on our side. Please! try again.");
    }
}
export const addNewCoupon = async (req, res) => {
    try {
        const { coupon } = req.body;
        if (!coupon) return sendRes(res, 400, "Coupon is required");

        const existedCoupon = await Store.findOne({ "coupons.code": coupon.code });
        if (existedCoupon) return sendRes(res, 400, "Coupon already exists");

        const updatedStore = await Store.findByIdAndUpdate(storeId, { $push: { coupons: coupon } }, { new: true });
        if (!updatedStore) return sendRes(res, 404, "Store not found");

        return sendRes(res, 200, "Coupon added successfully", coupon);
    }
    catch (error) {
        consoleError("addNewCoupon (admin.controllers.js)", error);
        return sendRes(res, 500, "Something went wrong on our side. Please! try again.");
    }
}
export const deleteCoupon = async (req, res) => {
    try {
        const { code: couponCode } = req.body;
        if (!couponCode) return sendRes(res, 400, "Coupon code is required");

        const updatedStore = await Store.findByIdAndUpdate(storeId, { $pull: { coupons: { code: couponCode } } }, { new: true });
        if (!updatedStore) return sendRes(res, 404, "Store not found");

        return sendRes(res, 200, "Coupon deleted successfully");
    } catch (error) {
        consoleError("deleteCoupon (admin.controllers.js)", error);
        return sendRes(res, 500, "Something went wrong on our side. Please! try again.");
    }
}
export const updateShippingSettings = async (req, res) => {
    try {
        const { shippingCharges, freeShippingAbove } = req.body;
        if (!shippingCharges || !freeShippingAbove) return sendRes(res, 400, "Shipping charges and free shipping above are required");

        const updatedStore = await Store.findByIdAndUpdate(storeId, { shippingCharges, freeShippingAbove }, { new: true });
        if (!updatedStore) return sendRes(res, 404, "Store not found");

        return sendRes(res, 200, "Shipping settings updated successfully");
    }
    catch (error) {
        consoleError("updateShippingSettings (admin.controllers.js)", error);
        return sendRes(res, 500, "Something went wrong on our side. Please! try again.");
    }
}
export const updateHeroImages = async (req, res) => {
    try {

        let images = [];

        let existingImages = req.body.existingImages || [];
        let newImages = req.files || [];

        if (typeof existingImages === "string") {
            existingImages = [existingImages];
        }

        images = [...existingImages];

        if (newImages && newImages.length > 0) {
            const uploadPromises = newImages.map(file => cloudinary.uploader.upload(file.path));
            const uploaded = await Promise.all(uploadPromises);
            const uploadedUrls = uploaded.map(img => img.secure_url);
            images.push(...uploadedUrls);

            newImages.forEach(file => {
                if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
            });
        }

        const updatedStore = await Store.findByIdAndUpdate(
            new mongoose.Types.ObjectId(storeId),
            { $set: { heroImages: images } },
            { new: true }
        );

        if (!updatedStore) return sendRes(res, 404, "Store not found.");
        return sendRes(res, 200, "Hero images updated successfully.", updatedStore.heroImages);
    }
    catch (error) {
        consoleError("updateHeroImages (admin.controllers.js)", error);

        if (req.files && req.files.length > 0) {
            req.files.forEach(file => {
                if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
            });
        }

        return sendRes(res, 500, "Something went wrong. Please try again.");
    }
};
export const updateSocialLinks = async (req, res) => {
    try {
        let { socialLinks } = req.body;
        if (!socialLinks) return sendRes(res, 400, "Social links are required");

        socialLinks = JSON.parse(socialLinks);

        const updatedStore = await Store.findByIdAndUpdate(storeId, { socialLinks }, { new: true });
        if (!updatedStore) return sendRes(res, 404, "Store not found");

        return sendRes(res, 200, "Social links updated successfully", updatedStore.socialLinks);
    }
    catch (error) {
        consoleError("updateSocialLinks (admin.controllers.js)", error);
        return sendRes(res, 500, "Something went wrong on our side. Please! try again.");
    }
}

// REVIEWS PAGE
export const getReviewsData = async (req, res) => {
    try {
        const [
            totalReviewsCount,
            pendingReviewsCount,
            rejectedReviewsCount,
            approvedReviewsCount,
        ] =
            await Promise.all([
                Review.countDocuments(),
                Review.countDocuments({ status: "PENDING" }),
                Review.countDocuments({ status: "REJECTED" }),
                Review.countDocuments({ status: "APPROVED" }),

            ]);

        return sendRes(res, 200, "Reviews data fetched successfully", {
            totalReviewsCount,
            pendingReviewsCount,
            rejectedReviewsCount,
            approvedReviewsCount,
        });

    } catch (error) {
        consoleError("getReviewsData (admin.controllers.js)", error);
        return sendRes(res, 500, "Something went wrong on our side. Please! try again.");
    }
};
export const getReviewsByStatus = async (req, res) => {
    try {
        const { status } = req.query;
        if (!status) return sendRes(res, 400, "Status is required");

        const reviews = await Review.find({ status: status })
            .sort({ createdAt: -1 })
            .limit(20)
            .populate("productId", "name images");

        return sendRes(res, 200, "Reviews fetched successfully", reviews);
    }
    catch (error) {
        consoleError("getReviewsByStatus (admin.controllers.js)", error);
        return sendRes(res, 500, "Something went wrong on our side. Please! try again.");
    }
}
export const loadMoreReviews = async (req, res) => {
    try {
        const { status } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = 20;
        const skip = (page - 1) * limit;

        const reviews = await Review.find({ status: status })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate("productId", "name images");

        return sendRes(res, 200, "Reviews fetched successfully", reviews);
    }
    catch (error) {
        consoleError("loadMoreReviews (admin.controllers.js)", error);
        return sendRes(res, 500, "Something went wrong on our side. Please! try again.");
    }
};
export const updateReviewStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const { id: reviewId } = req.params;

        if (!reviewId || !status) return sendRes(res, 400, "Review ID or status is required");

        const updatedReview = await Review.findByIdAndUpdate(reviewId, { status }, { new: true });
        if (!updatedReview) return sendRes(res, 404, "Review not found");

        if (status === "APPROVED")
            return sendRes(res, 200, "Review approved.");
        else
            return sendRes(res, 200, "Review rejected.");

    }
    catch (error) {
        consoleError("updateReviewStatus (admin.controllers.js)", error);
        return sendRes(res, 500, "Something went wrong on our side. Please! try again.");
    }
};