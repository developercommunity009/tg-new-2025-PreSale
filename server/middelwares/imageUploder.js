const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { cloudinaryUploadingImg } = require("./cloudnary"); // Import Cloudinary upload function

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, "../public/images/")); // Save to public/images folder
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + "-" + uniqueSuffix + ".jpeg"); // Save as .jpeg
    },
});

// Multer Filter for Images
const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith("image")) {
        cb(null, true);
    } else {
        cb({ message: "Unsupported file format" }, false);
    }
};

// Multer Upload Configuration
const uploadPhoto = multer({
    storage: storage,
    fileFilter: multerFilter,
    limits: {
        fileSize: 1000000, // 1MB limit
    },
}).single('image'); // Adjust 'image' to match the form field name

// Image Upload and Deletion Middleware
const uploadAndProcessImage = async (req, res, next) => {
    uploadPhoto(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ message: err.message });
        }
        
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }
        
        try {
            const filePath = path.join(__dirname, "../public/images/", req.file.filename);
            
            // Optional: Process the image with sharp if needed (e.g., resize)
            // await sharp(filePath).resize(500, 500).toFile(filePath);

            // Upload image to Cloudinary
            const result = await cloudinaryUploadingImg(filePath);
         
            // Delete the image from the server after uploading to Cloudinary
            fs.unlink(filePath, (err) => {
                if (err) console.error("Failed to delete local image:", err);
            });

            // Attach Cloudinary result to the request for further processing
            req.body.image = result;

            next(); // Proceed to the next middleware/controller
        } catch (error) {
            return res.status(500).json({ message: "Failed to upload image to Cloudinary", error });
        }
    });
};

module.exports = {
    uploadAndProcessImage,
};
