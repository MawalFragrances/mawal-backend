import jwt from "jsonwebtoken";

/**
 * GENERATES A JSON WEB TOKEN FOR THE GIVEN USER ID, SETS IT AS A COOKIE.
 * 
 * @param {Object} res - THE RESPONSE OBJECT FROM THE EXPRESS.JS SERVER.
 * @param {string} userId - THE ID OF THE USER FOR WHOM THE TOKEN IS GENERATED.
 * 
 * @returns {string} - THE GENERATED JWT TOKEN.
 */
export const generateTokenAndSetCookie = async (res, userId) => {

    // SIGN TOKEN
    const token = jwt.sign({ userId }, process.env.JWT_SECRET_KEY, { expiresIn: "7d" })

    // SET COOKIE
    res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production" ? true : false,
        sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 DAYS
    })

    return token;
}

/**
 * Generates a random 6-digit number (verification code)
 * 
 * @function generateVerificationCode
 * 
 * @returns {Number} A 6-digit random number 
 */
export const generateVerificationCode = () => {
    return Math.floor(100000 + Math.random() * 900000);
}

/**
 * Calculates an expiry time based on the current time and a specified number of minutes.
 *
 * @function getExpiryTime
 * @param {number} minutes - The number of minutes to add to the current time.
 * 
 * @returns {Date} A `Date` object representing the expiry time.
 */
export const getExpiryTime = (minutes) => {
    const now = new Date();
    return new Date(now.getTime() + minutes * 60000);
}