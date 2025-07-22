import mongoose from "mongoose";

const NewsletterSchema = new mongoose.Schema({
    email: {
        type: String,
        unique: true,
        required: true,
    }
})

export const Newsletter = mongoose.model("Newsletter", NewsletterSchema);