import mongoose from "mongoose";
import bcryptjs from "bcryptjs";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
    },
    phoneNumber: {
        type: String,
        default: ""
    },
    picture: {
        type: String,
        default: ""
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    fcmTokens: {
        type: [String],
        default: [],
    },

    emailVerificationCode: String,
    verificationCodeExpiresAt: Date,
    resetPassToken: String,
    resetPassTokenExpiresAt: Date,

}, { timestamps: true });

userSchema.pre("save", async function (next) {
    try {
        if (this.isModified("password")) {
            this.password = await bcryptjs.hash(this.password, 10);
        }
        if (this.isModified("emailVerificationCode")) {
            this.emailVerificationCode = await bcryptjs.hash(this.emailVerificationCode, 10);
        }
        next();
    } catch (error) {
        next(error);
    }
});

userSchema.methods.comparePassword = async function (enteredPassword) {
    return bcryptjs.compare(enteredPassword, this.password);
};

userSchema.methods.compareVerificationCode = async function (emailVerificationCode) {
    return bcryptjs.compare(emailVerificationCode, this.emailVerificationCode);
};

export const User = mongoose.model("User", userSchema);