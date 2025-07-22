import admin from "../utils/firebase.js";
import { Admin } from "../models/admin.model.js";

class NotificationService {

    async sendNotification(tokens, title, body) {

        const messages = tokens.map(token => ({
            token,
            notification: { title, body },
        }));

        const results = await Promise.allSettled(
            messages.map(msg => admin.messaging().send(msg))
        );

        const invalidTokens = [];

        results.forEach((result, index) => {
            const token = messages[index].token;

            if (result.status === "rejected") {
                const error = result.reason;
                if (
                    error.code === "messaging/registration-token-not-registered" ||
                    error.code === "messaging/invalid-registration-token"
                ) {
                    invalidTokens.push(token);
                }
            }
        });

        // REMOVE INVALID TOKENS FROM ALL ADMIN DOCUMENTS
        if (invalidTokens.length > 0) {
            try {
                await Admin.updateMany(
                    { fcmTokens: { $in: invalidTokens } },
                    { $pull: { fcmTokens: { $in: invalidTokens } } }
                );
            } catch (err) {
                console.error("Error removing invalid tokens from DB:", err.message);
            }
        }

        return results;
    }
}

export default new NotificationService();
