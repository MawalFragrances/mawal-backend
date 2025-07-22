import { Admin } from "../models/admin.model.js";
import { Order } from "../models/order.model.js";
import { Product } from "../models/product.model.js";
import { Store } from "../models/store.model.js";
import NotificationService from "../services/notification.service.js";
import { consoleError, sendRes } from "../utils/comman.utils.js";

export const placeOrder = async (req, res) => {
    try {
        const { order, couponApplied } = req.body;
        const { products } = order;

        if (!products?.length) {
            return sendRes(res, 400, "Order must contain at least one product.");
        }

        const productIds = [...new Set(products.map(item => item.productId))];

        const productDocs = await Product.find({ _id: { $in: productIds } })
            .select('_id name stock')
            .lean();

        const productMap = new Map(productDocs.map(product => [product._id.toString(), product]));

        const insufficientStock = [];
        const stockUpdates = [];

        for (const item of products) {
            const product = productMap.get(item.productId);

            if (!product) {
                return sendRes(res, 404, `Product with ID ${item.productId} not found.`);
            }

            if (product.stock < item.quantity) {
                insufficientStock.push({
                    name: product.name,
                    available: product.stock,
                    requested: item.quantity,
                });
            } else {
                const existingUpdate = stockUpdates.find(update =>
                    update.updateOne.filter._id.toString() === item.productId
                );

                if (existingUpdate) {
                    existingUpdate.updateOne.update.$inc.stock -= item.quantity;
                } else {
                    stockUpdates.push({
                        updateOne: {
                            filter: { _id: item.productId },
                            update: { $inc: { stock: -item.quantity } },
                        },
                    });
                }
            }
        }

        if (insufficientStock.length > 0) {
            return sendRes(res, 400, "Insufficient stock for the following products:", insufficientStock);
        }

        const [_, newOrder, admins] = await Promise.all([
            Product.bulkWrite(stockUpdates),
            Order.create(order),
            Admin.find({}).select("fcmTokens"),
        ]);

        if (couponApplied?.code) {
            await Store.updateOne(
                { _id: process.env.STORE_ID, "coupons.code": couponApplied.code },
                { $inc: { "coupons.$.usedCount": 1 } }
            );
        }

        const allAdminTokens = admins.flatMap(admin => admin.fcmTokens).filter(Boolean);

        NotificationService.sendNotification(
            allAdminTokens,
            "New Order Placed",
            `New order has been placed with order number ${newOrder.orderNumber}.`
        );

        return sendRes(res, 200, "New Order Placed Successfully.", { orderId: newOrder._id });

    } catch (error) {
        consoleError("placeOrder (order.controllers)", error);
        return sendRes(res, 500, "Something went wrong on our side. Please try again.");
    }
};

export const trackOrder = async (req, res) => {
    try {
        const { orderNumber, email, phone } = req.body;

        if (!orderNumber) return sendRes(res, 422, "Order Number is Required.");
        if (!email && !phone) return sendRes(res, 422, "Please Enter an Email or a Phone Number.");

        const query = { orderNumber };

        if (email) query["user.email"] = email;
        else if (phone) query["user.phone"] = phone;
        else return sendRes(res, 422, "Please Enter an Email or a Phone Number.");

        const orderToTrack = await Order.findOne(query).populate("products.productId");

        if (!orderToTrack) return sendRes(res, 404, "Order not found. Please check your details.");

        return sendRes(res, 200, "Order found.", orderToTrack);
    }
    catch (error) {
        consoleError("trackOrder (order.controllers)", error);
        return sendRes(res, 500, "Something went wrong on our side. Please! try again.");
    }
}

export const getOrders = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 2;
        const skip = (page - 1) * limit;

        const orders = await Order.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        return sendRes(res, 200, "Orders fetched successfully.", orders);
    } catch (error) {
        consoleError("getOrders (order.controllers)", error);
        return sendRes(res, 500, "Something went wrong on our side. Please! try again.");
    }
};

export const getFilteredOrders = async (req, res) => {
    try {
        const { status } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 15;
        const skip = (page - 1) * limit;

        const filteredOrders = await Order.find({ status })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalOrders = await Order.countDocuments({ status });

        return sendRes(res, 200, "Filtered Orders fetched successfully.", {
            currentPage: page,
            totalOrders,
            filteredOrders
        });
    }
    catch (error) {
        consoleError("getFilteredOrders (order.controllers)", error);
        return sendRes(res, 500, "Something went wrong on our side. Please! try again.");
    }
}

export const applyCoupon = async (req, res) => {
    try {
        const { couponCode } = req.body;
        if (!couponCode) return sendRes(res, 422, "Coupon Code is Required.");

        const store = await Store.findById(process.env.STORE_ID);
        if (!store) return sendRes(res, 404, "Coupon not found.");

        const coupon = store.coupons.find(coupon => coupon.code === couponCode);
        if (!coupon) return sendRes(res, 404, "Invalid Coupon Code.");

        if (coupon.expiresAt < Date.now()) return sendRes(res, 400, "Coupon has expired.");

        if (!coupon.isActive) return sendRes(res, 400, "Coupon is not active.");

        if (coupon.usageLimit <= coupon.usedCount) return sendRes(res, 400, "Coupon has reached its usage limit.");

        return sendRes(res, 200, "Coupon applied successfully.", coupon);
    }
    catch (error) {
        consoleError("applyCoupon (order.controllers)", error);
        return sendRes(res, 500, "Something went wrong on our side. Please! try again.");
    }
}

