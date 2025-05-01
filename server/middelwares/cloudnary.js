const cloudinary = require('cloudinary').v2;
require('dotenv').config();

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRAT,
});
const cloudinaryUploadingImg = async (fileToUpload) => {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload(
            fileToUpload,
            { resource_type: "image" },
            (error, result) => {
                if (error) reject(error);
                resolve({
                    url: result.secure_url,
                    asset_id: result.asset_id,
                    public_id: result.public_id,
                });
            }
        );
    });
};

module.exports = { cloudinaryUploadingImg };
