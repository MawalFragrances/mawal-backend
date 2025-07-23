import express from "express";
import {
    getAllProducts,
    getSearchedProducts,
    getProductToViewDetails,
    updateProductName,
    updateProductStock,
    updateProductDiscount,
    updateProductIngredients,
    updateProductDescription,
    updateProductCategory,
    updateProductTags,
    updateProductSizeAndPrices,
    updateProductImages,
} from "../controllers/product.controllers.js";
import { authenticateAdmin } from "../middlewares/authenticateAdmin.js";
import { upload } from "../middlewares/multer.js";

const router = express.Router();

router.get("/get-all-products", getAllProducts);
router.get("/get-searched-products", getSearchedProducts);
router.get("/get-product-to-view-details/:id", getProductToViewDetails);

router.patch("/update-product-name/:id", authenticateAdmin, updateProductName);
router.patch("/update-product-stock/:id", authenticateAdmin, updateProductStock);
router.patch("/update-product-discount/:id", authenticateAdmin, updateProductDiscount);
router.patch("/update-product-ingredients/:id", authenticateAdmin, updateProductIngredients);
router.patch("/update-product-description/:id", authenticateAdmin, updateProductDescription);
router.patch("/update-product-category/:id", authenticateAdmin, updateProductCategory);
router.patch("/update-product-tags/:id", authenticateAdmin, updateProductTags);
router.patch("/update-product-size-and-prices/:id", authenticateAdmin, updateProductSizeAndPrices);
router.patch("/update-product-images/:id", authenticateAdmin, upload.array("image", 5), updateProductImages);
export default router;