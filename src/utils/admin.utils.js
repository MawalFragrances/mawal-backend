import jwt from "jsonwebtoken";

/**
 * Formats sales data to ensure all 12 months are represented
 * @param {Array} salesData - The aggregated sales data
 * @param {Date} startDate - The start date (12 months ago)
 * @param {Date} currentDate - The current date
 * @returns {Array} - Formatted sales data with all months included
 */
export const formatSalesData = (salesData, startDate, currentDate) => {
    const months = [];

    // Create array of all 12 months with zero values
    for (let i = 0; i < 12; i++) {
        const date = new Date(startDate);
        date.setMonth(startDate.getMonth() + i);

        months.push({
            year: date.getFullYear(),
            month: date.getMonth() + 1, // MongoDB months are 1-12
            monthName: getMonthName(date.getMonth()),
            totalSales: 0
        });
    }

    // Fill in the actual data we have
    salesData.forEach(data => {
        const monthIndex = months.findIndex(
            m => m.year === data.year && m.month === data.month
        );

        if (monthIndex !== -1) {
            months[monthIndex].totalSales = data.totalSales;
        }
    });

    return {
        months,
        totalSales: months.reduce((sum, month) => sum + month.totalSales, 0)
    };
}

/**
 * Get month name from month index
 * @param {Number} monthIndex - Month index (0-11)
 * @returns {String} - Month name
 */
export const getMonthName = (monthIndex) => {
    const monthNames = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return monthNames[monthIndex];
}


/**
 * GENERATES A JSON WEB TOKEN FOR THE GIVEN USER ID, SETS IT AS A COOKIE.
 * 
 * @param {Object} res - THE RESPONSE OBJECT FROM THE EXPRESS.JS SERVER.
 * @param {string} userId - THE ID OF THE USER FOR WHOM THE TOKEN IS GENERATED.
 * 
 * @returns {string} - THE GENERATED JWT TOKEN.
 */
export const generateTokenAndSetCookie = async (res, userId) => {
    const token = jwt.sign({ userId }, process.env.JWT_SECRET_KEY, { expiresIn: "7d" });

    res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return token;
};
