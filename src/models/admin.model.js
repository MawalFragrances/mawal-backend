import mongoose from "mongoose";

const adminSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ["Super Admin", "Admin"],
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    otp: {
        type: String,
    },
    otpExpiry: {
        type: Date,
    },
    fcmTokens: {
        type: [String],
        default: [],
    },
}, { timestamps: true });

export const Admin = mongoose.model("Admin", adminSchema);