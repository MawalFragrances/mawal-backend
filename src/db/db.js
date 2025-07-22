import mongoose from "mongoose"

export default async function connectDatabase() {
    try {
        await mongoose.connect(process.env.DATABASE_URI);
        console.log("Database Connected Successfully!");
    } catch (error) {
        console.error("Error Connecting Database " + error);
    }
}