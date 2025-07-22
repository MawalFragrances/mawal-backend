import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    images: {
        type: [String],
        required: true,
    },
    sizeAndPrices: {
        type: [
            {
                size: {
                    type: String,
                    required: true,
                },
                price: {
                    type: Number,
                    required: true,
                    min: 0,
                }
            }
        ],
        default: [],
    },
    discount: {
        type: Number,
        min: 0,
        max: 75,
        default: 0
    },
    ingredients: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    tags: {
        type: [String],
        default: []
    },
    category: {
        type: String,
        required: true,
        enum: ["MEN", "WOMEN", "UNISEX", "SIGNATURE"]
    },
    stock: {
        type: Number,
        required: true,
        min: 0,
    },
    isProductDeleted: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

export const Product = mongoose.model("Product", productSchema);

