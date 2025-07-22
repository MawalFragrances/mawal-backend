import dotenv from "dotenv";
dotenv.config({ path: "./.env" })

import cors from "cors";
import express from "express";
import cookieParser from "cookie-parser";
import connectDatabase from "./db/db.js";

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: [process.env.FRONTEND_URL, "https://mawal-admin.vercel.app", "http://localhost:5173", "http://localhost:5174", "http://192.168.18.15:5173"], credentials: true }))

app.get("/", (req, res) => {
    res.send("<h1>HELLO FROM MAWAL FRAGRANCES</h1>");
})

import AuthRoutes from "./routes/auth.routes.js";
import NewsletterRoutes from "./routes/newsletter.routes.js";
import ProductRoutes from "./routes/product.routes.js";
import OrderRoutes from "./routes/order.routes.js";
import WebsiteRoutes from "./routes/website.routes.js";
import ReviewRoutes from "./routes/review.routes.js";
import UserRoutes from "./routes/user.routes.js";

app.use("/api/v1/auth", AuthRoutes);
app.use("/api/v1/orders", OrderRoutes);
app.use("/api/v1/products", ProductRoutes);
app.use("/api/v1/website", WebsiteRoutes);
app.use("/api/v1/reviews", ReviewRoutes);
app.use("/api/v1/newsletters", NewsletterRoutes);
app.use("/api/v1/users", UserRoutes);

// ADMIN PORTAL
import AdminRoutes from "./routes/admin.routes.js";
import AdminAuthRoutes from "./routes/adminauth.routes.js";
import AdminLogsRoutes from "./routes/adminlogs.routes.js";

app.use("/api/v1/admin", AdminRoutes);
app.use("/api/v1/admin-auth", AdminAuthRoutes);
app.use("/api/v1/admin-logs", AdminLogsRoutes);


connectDatabase().then(() => {
    app.listen(3000, () => {
        console.log("SERVER IS LISTENING ON PORT : http://localhost:3000");
    });
})