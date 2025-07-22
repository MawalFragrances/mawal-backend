import fs from "fs";
import cloudinary from "cloudinary";
import { consoleError, sendRes } from "../utils/comman.utils.js";
import { Review } from "../models/review.model.js";
import { Order } from "../models/order.model.js";
import notificationService from "../services/notification.service.js";
import { Admin } from "../models/admin.model.js";

/* =============================== CONTROLLERS =============================== */

export const addNewReview = async (req, res) => {
    const uploadedFiles = req.files || [];
    try {
        const { id: productId } = req.params;
        const {
            rating,
            reviewTitle,
            review,
            firstName,
            lastName,
            email,
            ageGroup,
            gender,
            isProductRecomended
        } = req.body;

        if (
            !productId || !rating || !reviewTitle || !review || !firstName || !lastName ||
            !email || !ageGroup || !gender || isProductRecomended === undefined
        ) {
            cleanupFiles(uploadedFiles);
            return sendRes(res, 400, "Missing required review fields");
        }

        // CHECK IF USER PURCHASED THIS PRODUCT
        const purchased = await Order.findOne({
            "user.email": email,
            products: { $elemMatch: { productId } }
        });

        const isPurchaseVerified = !!purchased;

        let images = [];
        if (uploadedFiles.length > 0) {
            const imageUploadPromises = uploadedFiles.map(file =>
                cloudinary.uploader.upload(file.path)
            );
            const uploadedImages = await Promise.all(imageUploadPromises);
            images = uploadedImages.map(img => img.secure_url);
            cleanupFiles(uploadedFiles);
        }

        const [newReview, admins] = await Promise.all([
            Review.create({
                productId,
                rating,
                reviewTitle,
                review,
                reviewImages: images,
                firstName,
                lastName,
                email,
                ageGroup,
                gender,
                isProductRecomended,
                isPurchaseVerified
            }),
            Admin.find({ role: "Super Admin" }).select("fcmTokens"),
        ]);

        if (!newReview) return sendRes(res, 400, "Failed to add new review");

        // SEND NOTIFICATION TO ADMINS
        const allAdminTokens = admins.flatMap(admin => admin.fcmTokens).filter(Boolean);
        notificationService.sendNotification(
            allAdminTokens,
            "New Review Added",
            `New review has been added for a product.`
        );

        return sendRes(res, 200, "Review submitted successfully", newReview);
    }
    catch (error) {
        consoleError("addNewReview (review.controller.js)", error);
        cleanupFiles(uploadedFiles);
        return sendRes(res, 500, "Something went wrong on our side. Please try again.");
    }
};

export const loadMoreReviews = async (req, res) => {
    const { id: productId } = req.params;
    const { page } = req.query;
    try {
        const reviews = await Review.find({ productId, status: "APPROVED" })
            .sort({ createdAt: -1 })
            .skip((page - 1) * 10)
            .limit(10)
            .select('-email -__v');

        if (!reviews) return sendRes(res, 400, "No reviews found.");
        return sendRes(res, 200, "Reviews loaded successfully", reviews);
    }
    catch (error) {
        consoleError("loadMoreReviews (review.controller.js)", error);
        return sendRes(res, 500, "Something went wrong on our side. Please try again.");
    }
};

/* =============================== HELPER FUNCTIONS =============================== */
const cleanupFiles = (files) => {
    files?.forEach(file => {
        if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
        }
    });
};



