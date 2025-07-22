import jwt from "jsonwebtoken";

import { consoleError, sendRes } from "../utils/comman.utils.js";

export const authenticateAdmin = (req, res, next) => {
    try {
        const token = req.cookies.token;

        if (!token) return sendRes(res, 202, "Unauthorized - No token provided."); // Unauthorized

        jwt.verify(token, process.env.JWT_SECRET_KEY, async (err, admin) => {
            if (err) return sendRes(res, 403, "Unauthorized - Invalid token."); // Forbidden

            req.admin = admin;
            next();
        })
    } catch (error) {
        consoleError("authenticateAdmin", error);
        return sendRes(res, 500, "Internal Server Error.")
    }
}