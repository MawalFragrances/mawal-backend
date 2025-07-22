import mongoose from "mongoose";
import { Counter } from "./counter.model.js";

const OrderSchema = new mongoose.Schema(
    {
        orderNumber: {
            type: Number,
            unique: true,
            required: true,
        },
        user: {
            email: {
                type: String,
                required: true
            },
            firstName: {
                type: String,
                required: true
            },
            lastName: {
                type: String,
                required: true
            },
            phone: {
                type: String,
                required: true
            },
            whatsappNumber: {
                type: String,
                required: true
            },
            sameAsShipping: {
                type: Boolean,
                default: true
            },
            shippingAddress: {
                address: {
                    type: String,
                    required: true
                },
                city: {
                    type: String,
                    required: true
                },
                zipCode: {
                    type: String
                },
                state: {
                    type: String,
                },
                country: {
                    type: String,
                    required: true
                },
            },
            billingAddress: {
                address: {
                    type: String,
                    required: true
                },
                city: {
                    type: String,
                    required: true
                },
                zipCode: {
                    type: String
                },
                state: {
                    type: String,
                },
                country: {
                    type: String,
                    required: true
                },
            }
        },
        products: [
            {
                productId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Product",
                    required: true
                },
                quantity: {
                    type: Number,
                    required: true,
                    min: 1
                },
                price: {
                    type: Number,
                    required: true
                }
            }
        ],
        paymentMethod: {
            type: String,
            enum: ["COD", "CARD"],
            default: "COD"
        },
        status: {
            type: String,
            enum: ["PENDING", "CONFIRMED", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED"],
            default: "PENDING"
        },
        orderTotal: {
            type: Number,
            required: true
        }
    },
    { timestamps: true }
);

OrderSchema.pre("validate", async function (next) {
    if (!this.orderNumber) {
        this.orderNumber = await getNextOrderNumber();
    }
    next();
});

export const Order = mongoose.model("Order", OrderSchema);

export const getNextOrderNumber = async () => {
    const counter = await Counter.findByIdAndUpdate(
        { _id: "orderId" },
        { $inc: { sequence_value: 1 } },
        { new: true, upsert: true }
    );
    return counter.sequence_value;
};