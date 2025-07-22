import { Newsletter } from "../models/newsletters.model.js";
import { consoleError, sendRes } from "../utils/comman.utils.js";

export const subscribeToNewsletters = async (req, res) => {
    try {
        const { email } = req.body;

        const isAlreadySubscribed = Newsletter.findOne({ email });
        if (isAlreadySubscribed) return sendRes(res, 400, "This Email Is Already Registered.");

        await Newsletter.create({ email });

        return sendRes(res, 200, "Subscription Successfull. Thanks For Joining Us.");
    }
    catch (error) {
        consoleError("subscribeToNewsletters", error);
        return sendRes(res, 500, "Something went wrong on our side. Please! try again.");
    }
}

export const unsubscribeToNewsletters = async (req, res) => {
    try {
        const { email } = req.body;

        const deletedEmail = await Newsletter.findOneAndDelete({ email });

        if (!deletedEmail) return sendRes(res, 400, "No Subscription Found.");

        return sendRes(res, 200, "Unsubscribed Successfully.");
    }
    catch (error) {
        consoleError("unsubscribeToNewsletters", error);
        return sendRes(res, 500, "Something went wrong on our side. Please! try again.");
    }
}