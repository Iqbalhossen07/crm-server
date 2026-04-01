const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // 🎯 ডাইনামিক ফোল্ডার লজিক
    // কন্ট্রোলার থেকে req.folder সেট করে দিলে সেই ফোল্ডারে যাবে
    const folderPath = req.folder || "crm_assets/general";

    return {
      folder: folderPath,
      transformation: [{ width: 500, height: 500, crop: "limit" }],
      public_id: `file-${Date.now()}`,
    };
  },
});

const upload = multer({ storage: storage });

module.exports = { upload, cloudinary };
