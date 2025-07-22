// import fs from "fs";
import { Product } from "../models/product.model.js"
import { Review } from "../models/review.model.js";
import mongoose from "mongoose";
import { consoleError, sendRes } from "../utils/comman.utils.js";
import fs from "fs";
import cloudinary from "cloudinary";

/* -------------------- GET REQUESTS -------------------- */
// GET ALL PRODUCTS
export const getAllProducts = async (req, res) => {
    try {
        const products = await Product.find({ isProductDeleted: { $ne: true } })
            .select("-usage -ingredients");

        if (!products) sendRes(res, 400, "No products found.");

        return sendRes(res, 200, "All products", products);
    } catch (error) {
        consoleError("getAllProducts (product.controllers)", error);
        return sendRes(res, 500, "Something went wrong. Please! try again.")
    }
}

// GET PRODUCT BY ID
export const getProductToViewDetails = async (req, res) => {
    try {
        const { id: productId } = req.params;

        if (!productId) return sendRes(res, 400, "Product Id is required.");

        const [
            product,
            reviewsCount,
            averageRatingResult,
            productReviews
        ] = await Promise.all([
            Product.findById(productId),
            Review.countDocuments({ productId, status: "APPROVED" }),
            Review.aggregate([
                {
                    $match: {
                        productId: new mongoose.Types.ObjectId(productId),
                        status: "APPROVED"
                    }
                },
                {
                    $group: {
                        _id: null,
                        averageRating: { $avg: "$rating" }
                    }
                }
            ]),
            Review.find({ productId, status: "APPROVED" })
                .sort({ createdAt: -1 })
                .limit(10)
                .select("-email -__v")
        ]);

        if (!product) return sendRes(res, 400, "No product found.");

        const averageRating = (averageRatingResult.length > 0)
            ? averageRatingResult[0].averageRating.toFixed(1)
            : 0;

        return sendRes(res, 200, "Product Found.", {
            product,
            averageRating,
            reviewsCount,
            productReviews
        });
    } catch (error) {
        consoleError("getProductToViewDetails (product.controllers)", error);
        return sendRes(res, 500, "Something went wrong on our side. Please try again later.");
    }
};

// GET SEARCHED PRODUCTS
export const getSearchedProducts = async (req, res) => {
    try {
        const { q: searchQuery } = req.query;

        const results = await Product.aggregate([{
            $match: { name: { $regex: searchQuery, $options: "i" }, isProductDeleted: { $ne: true } }
        }, {
            $addFields: {
                priority: {
                    $cond: {
                        if: { $regexMatch: { input: "$name", regex: `^${searchQuery}`, options: "i" } }, then: 0, else: 1
                    }
                }
            }
        },
        { $sort: { priority: 1, name: 1 } }, {
            $project: {
                _id: 1,
                name: 1,
                images: 1
            }
        }
        ]);

        return sendRes(res, 200, "Search results", results);
    }
    catch (error) {
        consoleError("searchProducts (product.controllers)", error);
        return sendRes(res, 500, " Something went wrong on our side. Please! Try again later.")
    }
}

// // GET PRODUCT REVIEWS
// export const getProductReviews = (req, res) => {
//     const { productId } = req.params;
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 15;
//     const skipIndex = (page - 1) * limit;

//     if (!productId) return sendRes(res, 400, "Product Id is Required.");

//     return Promise.all([
//         Review.countDocuments({ productId }),
//         Review.aggregate([
//             { $match: { productId: new mongoose.Types.ObjectId(productId) } },
//             {
//                 $group: {
//                     _id: null,
//                     averageRating: { $avg: '$rating' }
//                 }
//             }
//         ]),
//         Review.find({ productId })
//             .sort({ createdAt: -1 })
//             .skip(skipIndex)
//             .limit(limit)
//             .select('-email -__v')
//     ])
//         .then(([totalReviews, averageRatingResult, reviews]) => {
//             const averageRating = averageRatingResult.length > 0
//                 ? averageRatingResult[0].averageRating.toFixed(1)
//                 : 0;

//             const totalPages = Math.ceil(totalReviews / limit);

//             return sendRes(res, 200, "", {
//                 totalReviews,
//                 averageRating: parseFloat(averageRating),
//                 reviews,
//                 pagination: {
//                     currentPage: page,
//                     totalPages,
//                     pageSize: limit,
//                     totalItems: totalReviews
//                 }
//             });
//         })
//         .catch(error => {
//             consoleError("getProductReviews (product.controllers)", error);
//             return sendRes(res, 500, "Something went wrong on our side. Please! try again.");
//         });
// };

// export const getProductById = async (req, res) => {
//     try {
//         const { id: productId } = req.params;

//         const product = await Product.findById(productId);

//         if (!product) return sendRes(res, 400, "Product Not Found");

//         return sendRes(res, 200, "Product Fetched", product);
//     }
//     catch (error) {
//         consoleError("getProductById (product.controllers)", error);
//         return sendRes(res, 500, "Something went wrong on our side. Please! try again.");
//     }
// }

// /* -------------------- POST REQUESTS -------------------- */
// // ADD A NEW PRODUCT
// export const addNewProduct = async (req, res) => {
//     try {
//         const { name, price, stock, discount, usage, ingredients, category } = req.body;

//         let images;

//         if (req.files && req.files.length > 0) {
//             const imageUploadPromises = req.files.map(file =>
//                 cloudinary.uploader.upload(file.path)
//             );

//             const uploadedImages = await Promise.all(imageUploadPromises);

//             images = uploadedImages.map(img => img.secure_url);

//             req.files.forEach(file => fs.unlinkSync(file.path));
//         }

//         const discountedPrice = discount ? price - (price * discount / 100) : price;

//         const newProduct = await Product.create({
//             name, price, stock, discount, usage, ingredients, category, images, discountedPrice
//         })

//         return sendRes(res, 200, "New Product Added Successfully.", newProduct);
//     }
//     catch (error) {
//         console.log(error);
//         consoleError("addNewProduct (product.controllers)", error);
//         return sendRes(res, 500, "Something went wrong on our side. Please! try again later.")
//     }
// }

// export const deleteProductById = async (req, res) => {
//     try {
//         const { id: productId } = req.params;
//         if (!productId) return sendRes(res, 422, "Product Id is required.");

//         const updatedProduct = await Product.findByIdAndUpdate(
//             productId,
//             { isProductDeleted: true },
//         );
//         if (!updatedProduct) return sendRes(res, 404, "Product not found.");

//         return sendRes(res, 200, "Product Deleted successfully.");
//     }
//     catch (error) {
//         consoleError("deleteProductById (product.controllers)", error);
//         return sendRes(res, 500, " Something went wrong on our side. Please! Try again later.")
//     }
// }

export const updateProductName = async (req, res) => {
    try {
        const { id: productId } = req.params;
        const { name } = req.body;

        if (!productId) return sendRes(res, 400, "Product Id is required.");
        if (!name) return sendRes(res, 400, "Name is required.");

        const updatedProduct = await Product.findByIdAndUpdate(
            productId,
            { name },
            { new: true }
        );
        if (!updatedProduct) return sendRes(res, 404, "Product not found.");

        return sendRes(res, 200, "Product name updated successfully.", updatedProduct);
    }
    catch (error) {
        consoleError("updateProductName (product.controllers)", error);
        return sendRes(res, 500, "Something went wrong on our side. Please! try again later.")
    }
}

export const updateProductStock = async (req, res) => {
    try {
        const { id: productId } = req.params;
        const { stock } = req.body;

        if (!productId) return sendRes(res, 400, "Product Id is required.");
        if (!stock) return sendRes(res, 400, "Stock is required.");

        const updatedProduct = await Product.findByIdAndUpdate(
            productId,
            { stock },
            { new: true }
        );
        if (!updatedProduct) return sendRes(res, 404, "Product not found.");

        return sendRes(res, 200, "Product stock updated successfully.", updatedProduct);
    }
    catch (error) {
        consoleError("updateProductStock (product.controllers)", error);
        return sendRes(res, 500, "Something went wrong on our side. Please! try again later.")
    }
}

export const updateProductDiscount = async (req, res) => {
    try {
        const { id: productId } = req.params;
        const { discount } = req.body;

        if (!productId) return sendRes(res, 400, "Product Id is required.");
        if (!discount) return sendRes(res, 400, "Discount is required.");

        const updatedProduct = await Product.findByIdAndUpdate(
            productId,
            { discount },
            { new: true }
        );
        if (!updatedProduct) return sendRes(res, 404, "Product not found.");

        return sendRes(res, 200, "Product discount updated successfully.", updatedProduct);
    }
    catch (error) {
        consoleError("updateProductDiscount (product.controllers)", error);
        return sendRes(res, 500, "Something went wrong on our side. Please! try again later.")
    }
}

export const updateProductIngredients = async (req, res) => {
    try {
        const { id: productId } = req.params;
        const { ingredients } = req.body;

        if (!productId) return sendRes(res, 400, "Product Id is required.");
        if (!ingredients) return sendRes(res, 400, "Ingredients are required.");

        const updatedProduct = await Product.findByIdAndUpdate(
            productId,
            { ingredients },
            { new: true }
        );
        if (!updatedProduct) return sendRes(res, 404, "Product not found.");

        return sendRes(res, 200, "Product ingredients updated successfully.", updatedProduct);
    }
    catch (error) {
        consoleError("updateProductIngredients (product.controllers)", error);
        return sendRes(res, 500, "Something went wrong on our side. Please! try again later.")
    }
}

export const updateProductDescription = async (req, res) => {
    try {
        const { id: productId } = req.params;
        const { description } = req.body;

        if (!productId) return sendRes(res, 400, "Product Id is required.");
        if (!description) return sendRes(res, 400, "Description is required.");

        const updatedProduct = await Product.findByIdAndUpdate(
            productId,
            { description },
            { new: true }
        );
        if (!updatedProduct) return sendRes(res, 404, "Product not found.");

        return sendRes(res, 200, "Product description updated successfully.", updatedProduct);
    }
    catch (error) {
        consoleError("updateProductDescription (product.controllers)", error);
        return sendRes(res, 500, "Something went wrong on our side. Please! try again later.")
    }
}

export const updateProductCategory = async (req, res) => {
    try {
        const { id: productId } = req.params;
        const { category } = req.body;

        if (!productId) return sendRes(res, 400, "Product Id is required.");
        if (!category) return sendRes(res, 400, "Category is required.");

        const updatedProduct = await Product.findByIdAndUpdate(
            productId,
            { category },
            { new: true }
        );
        if (!updatedProduct) return sendRes(res, 404, "Product not found.");

        return sendRes(res, 200, "Product category updated successfully.", updatedProduct);
    }
    catch (error) {
        consoleError("updateProductCategory (product.controllers)", error);
        return sendRes(res, 500, "Something went wrong on our side. Please! try again later.")
    }
}

export const updateProductTags = async (req, res) => {
    try {
        const { id: productId } = req.params;
        const { tags } = req.body;

        if (!productId) return sendRes(res, 400, "Product Id is required.");
        if (!tags) return sendRes(res, 400, "Tags are required.");

        const updatedProduct = await Product.findByIdAndUpdate(
            productId,
            { tags },
            { new: true }
        );
        if (!updatedProduct) return sendRes(res, 404, "Product not found.");

        return sendRes(res, 200, "Product tags updated successfully.", updatedProduct);
    }
    catch (error) {
        consoleError("updateProductTags (product.controllers)", error);
        return sendRes(res, 500, "Something went wrong on our side. Please! try again later.")
    }
}

export const updateProductSizeAndPrices = async (req, res) => {
    try {
        const { id: productId } = req.params;
        const { sizeAndPrices } = req.body;

        if (!productId) return sendRes(res, 400, "Product Id is required.");
        if (!sizeAndPrices) return sendRes(res, 400, "Size and prices are required.");

        const updatedProduct = await Product.findByIdAndUpdate(
            productId,
            { sizeAndPrices },
            { new: true }
        );
        if (!updatedProduct) return sendRes(res, 404, "Product not found.");

        return sendRes(res, 200, "Product size and prices updated successfully.", updatedProduct);
    }
    catch (error) {
        consoleError("updateProductSizeAndPrices (product.controllers)", error);
        return sendRes(res, 500, "Something went wrong on our side. Please! try again later.")
    }
}

export const updateProductImages = async (req, res) => {
    try {
        const { id: productId } = req.params;

        if (!productId) return sendRes(res, 400, "Product ID is required.");

        let images = [];

        let existingImages = req.body.existingImages || [];

        if (typeof existingImages === "string") {
            existingImages = [existingImages];
        }

        images = [...existingImages];

        if (req.files && req.files.length > 0) {
            const uploadPromises = req.files.map(file => cloudinary.uploader.upload(file.path));
            const uploaded = await Promise.all(uploadPromises);
            const uploadedUrls = uploaded.map(img => img.secure_url);
            images.push(...uploadedUrls);

            req.files.forEach(file => {
                if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
            });
        }

        const updatedProduct = await Product.findByIdAndUpdate(
            productId,
            { images },
            { new: true }
        );

        if (!updatedProduct) return sendRes(res, 404, "Product not found.");
        return sendRes(res, 200, "Product images updated successfully.", updatedProduct);
    } catch (error) {
        consoleError("updateProductImages (admin.controllers.js)", error);

        if (req.files && req.files.length > 0) {
            req.files.forEach(file => {
                if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
            });
        }

        return sendRes(res, 500, "Something went wrong. Please try again.");
    }
};

