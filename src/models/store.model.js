import mongoose from "mongoose";

const storeSchema = new mongoose.Schema({

    promoMessages: {
        type: [String],
        default: [],
    },

    coupons: [{
        code: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        discountValue: {
            type: Number,
            required: true
        },
        minPurchase: {
            type: Number,
            default: 0
        },
        expiresAt: {
            type: Date,
            required: true
        },
        usageLimit: {
            type: Number,
            default: 1
        },
        usedCount: {
            type: Number,
            default: 0
        },
        isActive: {
            type: Boolean,
            default: true
        },
    }],

    shippingCharges: {
        type: Number,
        default: 0
    },
    freeShippingAbove: {
        type: Number,
        default: 0
    },
}, { timestamps: true });



export const Store = mongoose.model("Store", storeSchema);