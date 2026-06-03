const multer = require("multer");
// TODO : implement s3 upload, rather than using the file system
// TODO : if possible try with signed url upload to s3 from front end
const categoryStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/category-images");
  },
  filename: function (req, file, callback) {
    callback(null, "category_image-" + Date.now() + ".jpeg");
  },
});

const productStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/product-images");
  },
  filename: function (req, file, callback) {
    callback(null, "product_image-" + Date.now() + ".jpeg");
  },
});

const bannerStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/banner-images");
  },
  filename: function (req, file, callback) {
    callback(null, "banner_image-" + Date.now() + ".webp");
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
