import bcryptjs from "bcryptjs";
import { User } from "../models/user.model.js";
import EmailService from "../services/email.service.js";
import { consoleError, sendRes } from "../utils/comman.utils.js";
import { generateTokenAndSetCookie, generateVerificationCode, getExpiryTime } from "../utils/auth.utils.js";

// CHECK FOR AUTHENTICATED USER
export const checkAuth = async (req, res) => {
    try {
        const { user } = req;
        return sendRes(res, 200, "User found.", user);
    }
    catch (error) {
        consoleError("checkAuth (auth.controllers.js)", error);
        return sendRes(res, 500, "Something went wrong on our side. Please try again later.");
    }
}

// SIGNUP NEW USER
export const signupUser = async (req, res) => {
    try {
        const { email, password, confirmPassword } = req.body;

        if (!email || !password || !confirmPassword) return sendRes(res, 422, "All fields are required.");
        if (password !== confirmPassword) return sendRes(res, 422, "Passwords do not match.");

        const existedUser = await User.findOne({ email });

        if (existedUser) {
            if (existedUser.isVerified) return sendRes(res, 400, "An account with this email already exists.")
            else {
                const emailVerificationCode = generateVerificationCode();
                const updatedUser = await User.findOneAndUpdate(
                    { email },
                    { emailVerificationCode, verificationCodeExpiresAt: getExpiryTime(30) },
                    { new: true }
                );
                await EmailService.sendVerificationCode(email, emailVerificationCode);
                return sendRes(res, 200, "Verification code has been sent to your email.", updatedUser);
            }
        }

        const emailVerificationCode = generateVerificationCode();

        await User.create({
            email,
            password,
            emailVerificationCode,
            verificationCodeExpiresAt: getExpiryTime(30)
        });

        await EmailService.sendVerificationCode(email, emailVerificationCode);
        return sendRes(res, 201, "Registration is almost complete. Please verify your email to proceed.");
    }
    catch (error) {
        consoleError("signupUser (auth controllers)", error);
        return sendRes(res, 500, "Something went wrong on our side. Please try again later.");
    }
}

// SIGNUP USER WITH GOOGLE
export const signupWithGoogle = async (req, res) => {
    try {
        const { email, name, picture, phoneNumber } = req.body;
        if (!email) return sendRes(res, 422, "Email is required.");

        const existedUser = await User.findOne({ email });
        if (existedUser) return sendRes(res, 400, "An account with this email already exists.");

        const newUser = await User.create({
            email, name, picture, phoneNumber, isVerified: true,
        });

        generateTokenAndSetCookie(res, newUser._id);
        return sendRes(res, 201, "Signup Successfull.", newUser);
    }
    catch (error) {
        consoleError("signupWithGoogle (auth.controllers.js)", error);
        return sendRes(res, 500, "Something went wrong on our side. Please! try again.");
    }
}

// LOGIN USER
export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.query;
        if (!email || !password) return sendRes(res, 422, "All fields are required.");

        const user = await User.findOne({ email })
            .select("-emailVerificationCode -verificationCodeExpiresAt -resetPassToken -resetPassTokenExpiresAt");
        if (!user) return sendRes(res, 400, "No account is associated with the provided email address.");

        const isMatched = await user.comparePassword(password);
        if (!isMatched) return sendRes(res, 400, "The password entered is incorrect.");

        if (!user.isVerified) return sendRes(res, 400, "Please verify your email to proceed. Try signing up again.");

        generateTokenAndSetCookie(res, user._id);

        const userObject = user.toObject();
        delete userObject.password;

        return sendRes(res, 200, "Login successful. Welcome back!", userObject);
    }
    catch (error) {
        consoleError("loginUser (auth controllers)", error);
        return sendRes(res, 500, "Something went wrong on our side. Please try again later.");
    }
}

// LOGIN USER WITH GOOGLE
export const loginWithGoogle = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return sendRes(res, 422, "Email is required.");

        const existedUser = await User.findOne({ email });
        if (!existedUser) return sendRes(res, 404, "No account found. Try Signing up.");

        generateTokenAndSetCookie(res, existedUser._id);
        return sendRes(res, 200, "Login Successfull.", existedUser);
    }
    catch (error) {
        consoleError("loginWithGoogle (auth.controllers.js)", error);
        return sendRes(res, 500, "Something went wrong on our side. Please! try again.");
    }
}

// VERIFY USER EMAIL
export const verifyUserEmail = async (req, res) => {
    try {
        const { email, emailVerificationCode: code } = req.body;
        if (!email || !code) return sendRes(res, 422, "All fields are required.");

        let user = await User.findOne({ email });
        if (!user) return sendRes(res, 400, "No account is associated with the provided email address.");

        if (Date.now() > user.verificationCodeExpiresAt)
            return sendRes(res, 400, "Verification code has been sent to your email. Try Signingup Again.");

        const isMatched = await user.compareVerificationCode(code);
        if (!isMatched) return sendRes(res, 400, "The verification code entered is incorrect. Please try again.");

        user.isVerified = true;
        await user.save();

        const { password, isVerified, emailVerificationCode, verificationCodeExpiresAt, resetPassToken, resetPassTokenExpiresAt, ...safeUser } = user.toObject();

        generateTokenAndSetCookie(res, user._id);
        return sendRes(res, 200, "Email verification successful.", safeUser);
    }
    catch (error) {
        consoleError("verifyUserEmail (auth.controllers.js)", error);
        return sendRes(res, 500, "Something went wrong on our side. Please try again later.");
    }
}

// SEND RESET PASSWORD LINK
export const sendResetPassLink = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return sendRes(res, 422, "User email is required.");

        const user = await User.findOne({ email });
        if (!user) return sendRes(res, 400, "No account is associated with the provided email address.");
        if (!user.password) return sendRes(res, 400, "Your account is not associated with a password. Try logging in with google.");

        const token = await bcryptjs.hash(email, 10);
        const resetPassLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

        user.resetPassToken = token;
        user.resetPassTokenExpiresAt = getExpiryTime(60);

        const [updatedUser] = await Promise.all([
            user.save(),
            EmailService.sendResetPasswordLink(email, resetPassLink)]);

        return sendRes(res, 200, "The link has been sent successfully. Kindly follow the provided link to reset your password.", updatedUser);
    }
    catch (error) {
        consoleError("sendResetPassLink (auth.controllers.js)", error);
        return sendRes(res, 500, "Something went wrong on our side. Please try again later.");
    }
}

// RESET USER PASSWORD
export const resetUserPassword = async (req, res) => {
    try {
        const { token, newPassword, confirmNewPassword } = req.body;

        if (!token || !newPassword || !confirmNewPassword) return sendRes(res, 422, "All fields are required.");
        if (newPassword !== confirmNewPassword) return sendRes(res, 422, "Passwords do not match.");

        const user = await User.findOne({ resetPassToken: token });
        if (!user) return sendRes(res, 400, "Invalid token.");

        if (user.resetPassTokenExpiresAt < Date.now())
            return sendRes(res, 400, "The link is expired.");

        user.password = newPassword;
        user.resetPassTokenExpiresAt = user.resetPassTokenExpiresAt - 61 * 60 * 1000;
        await user.save();

        return sendRes(res, 200, "Password reset successful.");
    }
    catch (error) {
        consoleError("resetUserPassword (auth.controllers.js)", error);
        return sendRes(res, 500, "Something went wrong on our side. Please try again later.");
    }
}

// LOGOUT USER
export const logoutUser = async (req, res) => {
    try {
        res.clearCookie("token");
        return sendRes(res, 200, "Logout Successful.");
    }
    catch (error) {
        consoleError("logoutUser (auth.controllers.js)", error);
        return sendRes(res, 500, "Something went wrong on our side. Please try again later.");
    }
}

// DELETE USER ACCOUNT
export const deleteUserAccount = async (req, res) => {
    try {
        const { _id: userId } = req.user;

        const deletedUser = await User.findByIdAndDelete(userId);
        if (!deletedUser) return sendRes(res, 400, "No user found.");

        return sendRes(res, 200, "Account Deleted Successfully.");
    }
    catch (error) {
        consoleError("deleteUserAccount (auth.controllers.js)", error);
        return sendRes(res, 500, "Something went wrong on our side. Please try again later.");
    }
}