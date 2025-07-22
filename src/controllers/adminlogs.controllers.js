import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { consoleError, sendRes } from "../utils/comman.utils.js";

// Required to get __dirname in ES6 modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let stream = null;
let currDate = "";

/**
 * 1. WE ARE MAINTAINING ONE LOG FILE FOR EACH DAY ONLY FOR PAST 8 DAYS
 * 2. WE ARE USING A FILE STREAM INSTEAD OF OOPENING AND CLOSING IT ON EVERY REQUEST
 * 
 * THIS FUNCTION CHECKS IF WE HAVE TO CREATE A NEW FILE (MEANS ITS A NEW DAY)
 * IF IT'S A NEW DAY, WE CLOSE THE OLD FILE AND ENDS THE OLD STREAM AND CREATE A NEW ONE
 * 
 */
export const initLogStream = () => {
    const date = new Date().toISOString().slice(0, 10);
    if (date === currDate && stream) return;

    currDate = date;
    const logDir = path.join(__dirname, "../logs");

    // IF LOGS FOLDER DOESN'T EXIST, WE CREATE IT
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }

    // AUTO-REMOVE OLD LOG FILES (KEEP ONLY 8 LATEST)
    const files = fs.readdirSync(logDir)
        .filter(file => file.endsWith(".log"))
        .sort(); // SORTED BY FILENAME = BY DATE IF FORMAT IS YYYY-MM-DD

    const excess = files.length - 8;
    if (excess > 0) {
        for (let i = 0; i < excess; i++) {
            const oldFile = path.join(logDir, files[i]);
            fs.unlinkSync(oldFile);
        }
    }

    // CREATE THE FILE PATH
    const filePath = path.join(logDir, `${date}.log`);
    // CLOSE THE OLD STREAM IF EXISTS
    stream?.end();
    // CREATE A NEW STREAM IN APPEND MODE
    stream = fs.createWriteStream(filePath, { flags: "a" });
};

export const logAdminLogin = (req, res) => {
    const { name, email } = req.body;
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

    // MAKE SURE TODAY'S FILE IS READY
    initLogStream();

    const now = new Date();
    const timeString = now.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    });

    const logEntry = {
        timestamp: now.toISOString(),
        email,
        action: "LOGIN",
        message: `${name} logged in at ${timeString} from IP ${ip}`,
    };

    stream.write(JSON.stringify(logEntry) + "\n");

    res.status(200).json({ message: "Admin login logged successfully" });
};

export const logAdminLogout = (req, res) => {
    const { name, email, navType } = req.body;
    console.log(navType);
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

    // MAKE SURE TODAY'S FILE IS READY
    initLogStream();

    const now = new Date();
    const timeString = now.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    });

    const logEntry = {
        timestamp: now.toISOString(),
        email,
        action: "LOGOUT",
        message: `${name} logged out at ${timeString} from IP ${ip}`,
    };

    stream.write(JSON.stringify(logEntry) + "\n");

    res.status(200).json({ message: "Admin logout logged successfully" });
}

export const getAdminsActivities = (req, res) => {
    try {
        const { date } = req.query;
        const logDir = path.join(__dirname, "../logs");

        const files = fs.readdirSync(logDir).sort();
        const logFile = files.find(file => file.startsWith(date));

        if (!logFile) return sendRes(res, 404, "No log found for this date.");

        const filePath = path.join(logDir, logFile);
        const rawData = fs.readFileSync(filePath, "utf-8");

        const logs = rawData
            .trim()
            .split('\n')
            .filter(line => line.length > 0)
            .map(line => {
                try { return JSON.parse(line); } catch (err) { return null; }
            })
            .filter(entry => entry !== null);

        return sendRes(res, 200, "Activities fetched successfully.", logs);
    } catch (error) {
        consoleError("getAdminsActivities (adminlogs.controllers.js)", error);
        return sendRes(res, 500, "Something went wrong on our side. Please try again later.");
    }
};

