import multer from "multer";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Path of folder to upload the upcoming file.
        cb(null, "./public/temp");
    },
    filename: function (req, file, cb) {
        // Unique filename 
        cb(null, `${Date.now()}-${Math.round(Math.random() * 1E9)}-${file.originalname}`);
    }
});

export const upload = multer({ storage });
