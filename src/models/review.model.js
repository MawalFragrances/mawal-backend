import mongoose from "mongoose";

const ReviewSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    reviewTitle: {
        type: String,
        required: true,
    },
    review: {
        type: String,
        required: true,
    },
    reviewImages: {
        type: [String],
        default: []
    },
    firstName: {
        type: String,
        required: true,
    },
    lastName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    ageGroup: {
        type: String,
        required: true,
        enum: ["Below 20", "20-29", "30-39", "40-49", "Above 50"],
    },
    gender: {
        type: String,
        required: true,
        enum: ["Male", "Female", "Other"]
    },
    isProductRecomended: {
        type: Boolean,
        required: true,
    },
    isPurchaseVerified: {
        type: Boolean,
        default: false,
    },
    status: {
        type: String,
        default: "PENDING",
        enum: ["PENDING", "APPROVED", "REJECTED"]
    }
}, { timestamps: true });

export const Review = mongoose.model("Review", ReviewSchema);
