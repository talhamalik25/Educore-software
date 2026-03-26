const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'placeholder_name',
    api_key: process.env.CLOUDINARY_API_KEY || 'placeholder_key',
    api_secret: process.env.CLOUDINARY_API_SECRET || 'placeholder_secret',
});

// Setup Cloudinary Storage for Multer
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'educore/homework',
        allowed_formats: ['jpg', 'png', 'pdf', 'doc', 'docx'],
        resource_type: 'auto',
    },
});

const upload = multer({ storage: storage });

module.exports = { cloudinary, upload };
