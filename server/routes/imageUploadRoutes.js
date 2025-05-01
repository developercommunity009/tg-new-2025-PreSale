const express = require("express");
const { uploadAndProcessImage } = require("../middelwares/imageUploder");
const AppError = require("../utils/appError");

const router = express.Router();

router.post("/upload", uploadAndProcessImage, (req, res, next) => {
    try {
        const { image } = req.body; // Contains Cloudinary details

        if (!image) {
            return next(new AppError("Image upload failed", 400));
        }

        res.status(200).json({
            status: "success",
            message: "Image uploaded successfully",
            data: {
                image
            }
        });
    } catch (err) {
        next(new AppError("An error occurred during the image upload", 500));
    }
});

module.exports = router;
