import { Admin } from "../models/admin.model.js";
import { consoleError, generateVerificationCode, sendRes } from "../utils/comman.utils.js";
import { generateTokenAndSetCookie } from "../utils/admin.utils.js";
import EmailService from "../services/email.service.js";

export const checkAuth = async (req, res) => {
    try {
        const { userId } = req.admin;

        const admin = await Admin.findById(userId);

        if (!admin) return sendRes(res, 400, "Not an admin! Please login with a valid email address.", null);

        return sendRes(res, 200, "Admin authenticated successfully", admin);
    }
    catch (error) {
        consoleError("checkAuth (adminauth.controllers.js)", error);
        return sendRes(res, 500, "Something went wrong on our side. Please! try again.", null);
    }
}

export const loginWithGoogle = async (req, res) => {
    try {
        const { email, role } = req.query;

        const admin = await Admin.findOne({ email });

        if (!admin) return sendRes(res, 400, "Not an admin! Please login with a valid email address.");
        if (admin.role !== role) return sendRes(res, 400, `You are not registered as an ${role}!`);

        const otp = generateVerificationCode();
        await admin.updateOne({ otp, otpExpiry: Date.now() + 10 * 60 * 1000 });

        await EmailService.sendOtp(email, otp);
        return sendRes(res, 200, "Verify your email to continue.");
    }
    catch (error) {
        consoleError("loginWithGoogle (admin.controllers.js)", error);
        return sendRes(res, 500, "Something went wrong on our side. Please! try again.");
    }
}

export const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.query;

        const admin = await Admin.findOne({ email });

        if (!admin) return sendRes(res, 400, "Not an admin! Please login with a valid email address.");
        if (admin.otpExpiry < Date.now()) return sendRes(res, 400, "OTP expired! Please request a new OTP.");

        if (admin.otp !== otp) return sendRes(res, 400, "Invalid OTP!");

        generateTokenAndSetCookie(res, admin._id);
        return sendRes(res, 200, "Login Successfull.", admin);
    }
    catch (error) {
        consoleError("verifyOtp (admin.controllers.js)", error);
        return sendRes(res, 500, "Something went wrong on our side. Please! try again.");
    }
}

export const logoutAdmin = async (req, res) => {
    try {
        res.clearCookie("token"); // CLEAR COOKIE
        return sendRes(res, 200, "Logout Successful."); // SEND SUCCESS RESPONSE
    }
    catch (error) {
        consoleError("logoutAdmin", error); // LOG ERROR
        return sendRes(res, 500, "Something went wrong on our side. Please try again later."); // SEND ERROR RESPONSE
    }
}