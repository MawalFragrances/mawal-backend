import express from "express";
import { upload } from "../middlewares/multer.js";

import {
    addNewReview, loadMoreReviews
} from "../controllers/review.controllers.js";

const router = express.Router();


router.get("/load-more-reviews/:id", loadMoreReviews);
router.post("/add-new-review/:id", upload.array("image", 5), addNewReview);


export default router;