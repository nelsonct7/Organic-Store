const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary.config");

const categoryStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "organic-store/categories",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 800, height: 800, crop: "limit", quality: "auto" }],
  },
});

const productStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "organic-store/products",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 1200, height: 1200, crop: "limit", quality: "auto" }],
  },
});

const bannerStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "organic-store/banners",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 1920, height: 600, crop: "fill", quality: "auto" }],
  },
});

const categoryImgStore = multer({ storage: categoryStorage });
const productImgStore = multer({ storage: productStorage });
const bannerImgStore = multer({ storage: bannerStorage });

module.exports = {
  categoryImgStore,
  productImgStore,
  bannerImgStore,
};
