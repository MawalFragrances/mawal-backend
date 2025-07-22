import mongoose from "mongoose";

const counterSchema = new mongoose.Schema({
    _id: String,
    sequence_value: { type: Number, default: 1000 },
});

export const Counter = mongoose.model("Counter", counterSchema);
