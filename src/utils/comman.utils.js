/**
 * Logs detailed error information to the console, including the context, error message, stack trace, and timestamp.
 *
 * @function consoleError
 * 
 * @param {string} context - The context or module where the error occurred.
 * @param {Error} error - The error object containing the message and stack trace.
 *
 * @returns {void} This function does not return any value, it just logs the error to the console.
 */
export const consoleError = (context, error) => {
   console.error(`
 ------------------------------------------------------------------------
 [ERROR] Internal Server Error in "${context}"
    \nERROR MESSAGE: ${error.message}
    \nERROR STACK: ${error.stack}
 \nTIMESTAMP: ${new Date().toISOString()}
 ------------------------------------------------------------------------
 `);
}



/**
 * Sends a response to the client with the specified status code, message, and data.
 *
 * @function sendRes
 * 
 * @param {Object} res - The response object.
 * @param {number} status - The HTTP status code to send.
 * @param {string} message - The message to send to the client.
 * @param {Object} [data=null] - Optional data to include in the response.
 *
 * @returns {Object} The response object with the specified status code, message, and data.
 */
export const sendRes = (res, status, message, data = null) => {

   const response = { message };
   if (data) response.data = data;

   return res.status(status).json(response);
}


// Helper function to generate time frame query
export const generateTimeFrameQuery = (timeFrame, customStartDate, customEndDate) => {
   let query = {};

   if (timeFrame === "ALL_TIME") {
      query = {};
   }
   else if (timeFrame === "TODAY") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      query.createdAt = {
         $gte: today,
         $lt: tomorrow
      };
   }
   else if (timeFrame === "LAST_7_DAYS") {
      const today = new Date();
      const endOfToday = new Date(today);
      endOfToday.setHours(23, 59, 59, 999);

      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      sevenDaysAgo.setHours(0, 0, 0, 0);

      query.createdAt = {
         $gte: sevenDaysAgo,
         $lte: endOfToday
      };
   }
   else if (timeFrame === "LAST_30_DAYS") {
      const today = new Date();
      const endOfToday = new Date(today);
      endOfToday.setHours(23, 59, 59, 999);

      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      thirtyDaysAgo.setHours(0, 0, 0, 0);

      query.createdAt = {
         $gte: thirtyDaysAgo,
         $lte: endOfToday
      };
   }
   else if (timeFrame === "CUSTOM") {
      if (customStartDate && customEndDate) {
         const startDate = new Date(customStartDate);
         startDate.setHours(0, 0, 0, 0);

         const endDate = new Date(customEndDate);
         endDate.setHours(23, 59, 59, 999);

         query.createdAt = {
            $gte: startDate,
            $lte: endDate
         };
      } else {
         throw new Error("Custom date range is not properly configured");
      }
   }

   return query;
}

/**
 * Generates a random 6-digit number (verificaiton code)
 * 
 * @function generateVerificationCode
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