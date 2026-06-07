const bcrypt = require("bcrypt");
const crypto = require("crypto");
const mongoose = require("mongoose");
const cloudinary = require("../config/cloudinary.config");
const User = require("../collections/user.collection");
const Product = require("../collections/product.collection");
const Category = require("../collections/category.collection");
const Order = require("../collections/order.collection");
const Offer = require("../collections/offer.collection");
const Banner = require("../collections/banner.collection");
const Roles = require("../collections/roles.collection");
const {
  NotFoundError,
  AuthenticationError,
} = require("../shared/utils/error.util");
const { paginate } = require("../shared/utils/pagination.util");

// Inline schemas for models that don't have dedicated collection files
const couponSchema = new mongoose.Schema({
  coupon_code: { type: String, required: true },
  offer: { type: Number, default: 0 },
  start_date: { type: Date, default: Date.now },
  end_date: { type: Date },
  users: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
});
const Coupon =
  mongoose.models.Coupon || mongoose.model("Coupon", couponSchema, "coupon");

const feedbackSchema = new mongoose.Schema({
  user_data: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  feedbacks: [{ type: String }],
});
const Feedback =
  mongoose.models.Feedback ||
  mongoose.model("Feedback", feedbackSchema, "feedback");

const messageSchema = new mongoose.Schema({
  user_data: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  userMessage: [{ type: String }],
  adminMessage: [{ type: String }],
  adminView: { type: Boolean, default: false },
});
const Message =
  mongoose.models.Message ||
  mongoose.model("Message", messageSchema, "message");

/* ---- helpers ---- */
const toObjId = (id) =>
  typeof id === "string" ? new mongoose.Types.ObjectId(id) : id;

const calculateStockIn = (metrics, stock) => {
  if (metrics === "Kg" || metrics === "Li") return (parseInt(stock) || 0) * 1000;
  return parseInt(stock) || 0;
};

/* ---- Auth ---- */
const adminLogin = async (admin_field, password) => {
  const adminRole = await Roles.findOne({ name: "admin" });
  const user = await User.findOne({
    email: admin_field,
    role: adminRole?._id,
    isDeleted: false,
  });
  if (!user) return { status: false };
  const match = await bcrypt.compare(password, user.password);
  if (!match) return { status: false };
  return {
    status: true,
    admin: { name: user.name, email: user.email, _id: user._id },
  };
};

/* ---- Dashboard ---- */
const getDashboardStats = async () => {
  const totalOrders = await Order.countDocuments({});
  const totalUsers = await User.countDocuments({ isDeleted: false });
  const totalDelivery = await Order.countDocuments({ status: "shipped" });

  const revenueAgg = await Order.aggregate([
    { $match: { $or: [{ status: "placed" }, { status: "delivered" }] } },
    { $group: { _id: null, total: { $sum: "$totalAmount" } } },
  ]);
  const totalRevenue =
    revenueAgg.length > 0 ? Math.round(revenueAgg[0].total) : 0;

  const statusGroup = await Order.aggregate([
    { $group: { _id: "$status", total: { $sum: 1 } } },
  ]);
  let placedOrder = 0,
    pendingOrder = 0,
    deletedOrder = 0;
  for (const s of statusGroup) {
    if (s._id === "placed") placedOrder = s.total;
    if (s._id === "pending") pendingOrder = s.total;
  }

  const dispatchedGroup = await Order.aggregate([
    { $group: { _id: "$dispatched", total: { $sum: 1 } } },
  ]);
  let orderUnderProcessing = 0,
    oderOutDelivery = 0;
  for (const d of dispatchedGroup) {
    if (d._id === false) orderUnderProcessing = d.total;
    if (d._id === true) oderOutDelivery = d.total;
  }

  deletedOrder = await Order.countDocuments({ isDeleted: true });
  orderUnderProcessing = orderUnderProcessing - deletedOrder - pendingOrder;

  const payMethod = await Order.aggregate([
    { $group: { _id: "$paymentMethod", total: { $sum: 1 } } },
  ]);
  let paypal = 0,
    cod = 0,
    razor = 0;
  for (const p of payMethod) {
    if (p._id === "paypal") paypal = p.total;
    if (p._id === "cod") cod = p.total;
    if (p._id === "razor" || p._id === "online") razor = p.total;
  }

  // Most selling products
  const mostSelling = await Order.aggregate([
    { $unwind: "$items" },
    { $group: { _id: "$items.orderItemId", prCount: { $sum: 1 } } },
    {
      $lookup: {
        from: "order_items",
        localField: "_id",
        foreignField: "_id",
        as: "orderItem",
      },
    },
    { $unwind: { path: "$orderItem", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "product",
        localField: "orderItem.productId",
        foreignField: "_id",
        as: "productInfo",
      },
    },
    { $unwind: { path: "$productInfo", preserveNullAndEmptyArrays: true } },
    { $sort: { prCount: -1 } },
    { $limit: 3 },
    {
      $project: {
        prCount: 1,
        "productInfo.name": 1,
        "productInfo.price": 1,
        "productInfo.images": 1,
      },
    },
  ]);

  return {
    dashData: {
      totalOrder: totalOrders,
      totalUsers,
      totalDelivery,
      totalRevenue,
      placedOrder,
      pendingOrder,
      orderUnderProcessing: orderUnderProcessing < 0 ? 0 : orderUnderProcessing,
      oderOutDelivery,
      deletedOrder,
      paypal,
      cod,
      razor,
    },
    mostSelling: mostSelling.map((m) => ({
      prCount: m.prCount,
      productInfo: {
        title: m.productInfo?.name || "N/A",
        price: m.productInfo?.price || 0,
        img_path: normalizeImages(m.productInfo?.images),
      },
    })),
  };
};

/* ---- Products ---- */
const getAllProducts = async () => {
  const products = await Product.find({ isDeleted: false }).lean();
  return products.map((p) => ({
    _id: p._id,
    title: p.name,
    category: p.category,
    description: p.description,
    date: p.createdAt ? new Date(p.createdAt).toDateString() : "",
    price: p.price,
    "storage-spec": p.storageSpec || "",
    "godown-stock": p.stock,
    status: p.isActive ? "Active" : "Inactive",
    img_path: normalizeImages(p.images),
    offer: 0,
    deleted: p.isDeleted,
    metrics: p.metrics,
    availableUnits: p.availableUnits || [],
    stockIn: p.stockIn || 0,
  }));
};

const getProductPage = async (options = {}) => {
  const filter = { isDeleted: false };
  const { data, pagination, search, sort, order } = await paginate(
    Product,
    filter,
    {
      page: options.page,
      limit: options.limit,
      sort: options.sort || "name",
      order: options.order || "asc",
      search: options.search,
      searchFields: ["name", "description"],
    },
    [["category", "name"]],
  );
  const mapped = data.map((p) => ({
    _id: p._id,
    title: p.name,
    category: p.category.name,
    description: p.description,
    date: p.createdAt ? new Date(p.createdAt).toDateString() : "",
    price: p.price,
    "storage-spec": p.storageSpec || "",
    "godown-stock": p.stock,
    status: p.isActive ? "Active" : "Inactive",
    img_path: normalizeImages(p.images),
    offer: 0,
    deleted: p.isDeleted,
    metrics: p.metrics,
    availableUnits: p.availableUnits || [],
    stockIn: p.stockIn || 0,
  }));
  return {
    data: mapped,
    pagination: {
      ...pagination,
      start: (pagination.page - 1) * pagination.limit + 1,
      end: Math.min(pagination.page * pagination.limit, pagination.total),
      sort,
      order,
      search,
    },
  };
};

const getProductById = async (id) => {
  const p = await Product.findById(toObjId(id)).populate("offers").lean();
  if (!p) throw new NotFoundError("Product not found");
  return {
    _id: p._id,
    title: p.name,
    description: p.description,
    slug: p.slug,
    price: p.price,
    metrics: p.metrics,
    offers: p.offers,
    availableUnits: p.availableUnits || [],
    stockIn: p.stockIn || 0,
    category: p.category ? p.category.toString() : null,
    stock: p.stock,
    img_path: normalizeImages(p.images),
    date: p.createdAt ? new Date(p.createdAt).toDateString() : "",
    storageSpec: p.storageSpec || "N/A",
    status: p.status || "available",
    isActive: p.isActive || false,
    deleted: p.isDeleted,
  };
};

const toImageObjects = (filenames) =>
  (filenames || []).map((f) => ({
    id: crypto.randomUUID(),
    url: f,
  }));

const normalizeImages = (images) => {
  if (!images || !images.length) return [];
  if (typeof images[0] === "string") {
    return images.map((filename) => ({ id: crypto.randomUUID(), url: filename }));
  }
  return images;
};

const buildAvailableUnits = (body) => {
  const labels = body.unitLabel;
  const metrics = body.unitMetric;
  const measures = body.unitMeasure;
  const prices = body.unitPrice;
  if (!labels || !Array.isArray(labels)) return [];
  const units = [];
  for (let i = 0; i < labels.length; i++) {
    const m = parseInt(measures?.[i]);
    const p = parseFloat(prices?.[i]);
    const met = metrics?.[i] || "grams";
    if (labels[i] && !isNaN(m) && !isNaN(p)) {
      units.push({ label: labels[i], metric: met, measure: m, price: p });
    }
  }
  return units;
};

const addProduct = async (body, imgPaths) => {
  const metrics = body.metrics;
  const stock = parseInt(body.stock || 0);
  const product = new Product({
    name: body.title,
    description: body.description,
    slug: body.title.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now(),
    price: parseInt(body.price) || 0,
    category: body.category ? toObjId(body.category) : undefined,
    stock,
    images: toImageObjects(imgPaths),
    isActive: body.status === "available",
    metrics,
    storageSpec: body.storageSpec,
    availableUnits: buildAvailableUnits(body),
    stockIn: calculateStockIn(metrics, stock),
  });
  await product.save();
};

const updateProduct = async (id, body, imgPaths) => {
  const metrics = body.metrics;
  const stock = parseInt(body["godown-stock"] || body.godownstock || body.stock || 0);
  const updateData = {
    name: body.title,
    description: body.description,
    price: parseInt(body.price) || 0,
    stock,
    isActive: body.status !== "Inactive",
    metrics,
    storageSpec: body.storageSpec || body["storage-spec"] || body.storagespec,
  };
  if (metrics) {
    updateData.stockIn = calculateStockIn(metrics, stock);
  }
  const units = buildAvailableUnits(body);
  if (units.length) updateData.availableUnits = units;
  if (body.category) updateData.category = toObjId(body.category);
  if (imgPaths && imgPaths.length > 0) {
    updateData.$push = {
      images: { $each: toImageObjects(imgPaths) },
    };
  }
  await Product.findByIdAndUpdate(toObjId(id), updateData);
};

const softDeleteProduct = async (id) => {
  await Product.findByIdAndUpdate(toObjId(id), {
    isDeleted: true,
    isActive: false,
  });
};

const removeProductImage = async (productId, imageId) => {
  const product = await Product.findById(toObjId(productId));
  if (!product) return false;
  if (product.images.length <= 1) return false;
  const img = product.images.find((i) => i.id === imageId);
  if (img && img.url && img.url.includes("res.cloudinary.com")) {
    const urlParts = img.url.split("/upload/");
    if (urlParts.length === 2) {
      const publicIdWithExt = urlParts[1].replace(/^v\d+\//, "");
      const publicId = publicIdWithExt.replace(/\.[^.]+$/, "");
      cloudinary.uploader.destroy(publicId, () => {});
    }
  }
  await Product.findByIdAndUpdate(toObjId(productId), {
    $pull: { images: { id: imageId } },
  });
  return true;
};

/* ---- Users ---- */
const getAllUsers = async () => {
  const users = await User.find({}).lean();
  return users.map((u) => ({
    _id: u._id,
    status: u.isActive,
    user_name: u.name,
    user_email: u.email,
    user_mobile: u.mobile,
    deleted: u.isDeleted,
  }));
};

const getUserPage = async (options = {}) => {
  const { data, pagination, search, sort, order } = await paginate(
    User,
    {},
    {
      page: options.page,
      limit: options.limit,
      sort: options.sort || "createdAt",
      order: options.order || "desc",
      search: options.search,
      searchFields: ["name", "email", "mobile"],
    },
    [{ path: "role", select: "name" }],
  );
  const mapped = data.map((u) => ({
    _id: u._id,
    status: u.isActive,
    user_name: u.name,
    user_email: u.email,
    user_mobile: u.mobile,
    deleted: u.isDeleted,
    isAdmin: u.role?.name === "admin",
  }));
  return { data: mapped, pagination, search, sort, order };
};

const getUserById = async (id) => {
  const u = await User.findById(toObjId(id)).lean();
  if (!u) throw new NotFoundError("User not found");
  return {
    _id: u._id,
    status: u.isActive,
    user_name: u.name,
    user_email: u.email,
    user_mobile: u.mobile,
    deleted: u.isDeleted,
  };
};

const addUser = async (body) => {
  const hashed = await bcrypt.hash(body.user_password || body.password, 10);
  const userRole = await Roles.findOne({ name: "user" });
  const user = new User({
    name: body.user_name || body.name,
    email: body.user_email || body.email,
    mobile: body.user_mobile || body.mobile,
    password: hashed,
    role: userRole?._id,
    isActive: true,
  });
  await user.save();
};

const updateUser = async (id, body) => {
  const updateData = {
    isActive: body.status !== "false" && body.status !== false,
  };
  if (body.user_name) updateData.name = body.user_name;
  if (body.user_email) updateData.email = body.user_email;
  if (body.user_mobile) updateData.mobile = body.user_mobile;
  await User.findByIdAndUpdate(toObjId(id), updateData);
};

const softDeleteUser = async (id) => {
  const user = await User.findById(toObjId(id)).populate("role", "name");
  if (user && user.role?.name === "admin") {
    throw new Error("Cannot delete an admin user");
  }
  await User.findByIdAndUpdate(toObjId(id), {
    isDeleted: true,
    isActive: false,
  });
};

/* ---- Categories ---- */
const getAllCategories = async (parentOnly = false) => {
  const filter = { isDeleted: false };
  if (parentOnly) filter.isSubCategory = { $ne: true };
  const categories = await Category.find(filter)
    .populate("parentCategory", "name")
    .populate("childCategories", "name")
    .populate("offers")
    .lean();
  return categories.map((c) => ({
    _id: c._id.toString(),
    name: c.name,
    description: c.description || "",
    img_path: c.imageUrl || false,
    offer: c.offer || 0,
    offers: c.offers || [],
    deleted: c.isDeleted,
    isSubCategory: c.isSubCategory || false,
    parentCategory: c.parentCategory ? { _id: c.parentCategory._id.toString(), name: c.parentCategory.name } : null,
  }));
};

const getParentCategories = async (excludeId) => {
  const cats = await getAllCategories(true);
  if (excludeId) return cats.filter((c) => c._id !== excludeId);
  return cats;
};

const getCategoryById = async (id) => {
  const c = await Category.findById(toObjId(id))
    .populate("parentCategory", "name")
    .populate("childCategories", "name")
    .lean();
  if (!c) throw new NotFoundError("Category not found");
  return {
    _id: c._id.toString(),
    name: c.name,
    description: c.description || "",
    img_path: c.imageUrl || false,
    isSubCategory: c.isSubCategory || false,
    parentCategory: c.parentCategory ? { _id: c.parentCategory._id.toString(), name: c.parentCategory.name } : null,
    childCategories: c.childCategories || [],
  };
};

const addCategory = async (body, imgPath) => {
  const name = body.categoryname || body.name || body["category-name"];
  if (!name) throw new Error("Category name is required");
  const existing = await Category.findOne({
    name: { $regex: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
    isDeleted: false,
  });
  if (existing) throw new Error("Category name already exists");
  const description =
    body.categorydescription ||
    body.description ||
    body["category-description"];
  const isSubCategory =
    body.isSubCategory === "true" || body.isSubCategory === true;
  const parentId = body.parentCategory || null;

  const category = new Category({
    name,
    description: description || null,
    imageUrl: imgPath || null,
    isSubCategory,
    parentCategory: isSubCategory && parentId ? toObjId(parentId) : null,
  });
  await category.save();

  // Link back from parent
  if (isSubCategory && parentId) {
    await Category.findByIdAndUpdate(toObjId(parentId), {
      $push: { childCategories: category._id },
    });
  }
};

const updateCategory = async (id, body) => {
  const cat = await Category.findById(toObjId(id));
  if (!cat) throw new NotFoundError("Category not found");

  const updateData = {};
  const catName = body.name || body.categoryname || body["category-name"];
  const catDesc = body.description || body.categorydescription || body["category-description"];

  if (catName) {
    const dup = await Category.findOne({
      name: { $regex: new RegExp(`^${catName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      _id: { $ne: toObjId(id) },
      isDeleted: false,
    });
    if (dup) throw new Error("Category name already exists");
    updateData.name = catName;
  }
  if (catDesc !== undefined) updateData.description = catDesc;

  const newIsSub = body.isSubCategory === "true" || body.isSubCategory === true;
  const newParentId = body.parentCategory || null;
  const oldParentId = cat.parentCategory ? cat.parentCategory.toString() : null;

  if (cat.isSubCategory !== newIsSub || (newIsSub && oldParentId !== newParentId)) {
    if (oldParentId) {
      await Category.findByIdAndUpdate(toObjId(oldParentId), {
        $pull: { childCategories: cat._id },
      });
    }
    if (newIsSub && newParentId) {
      await Category.findByIdAndUpdate(toObjId(newParentId), {
        $addToSet: { childCategories: cat._id },
      });
    }
    updateData.isSubCategory = newIsSub;
    updateData.parentCategory = newIsSub && newParentId ? toObjId(newParentId) : null;
  }

  await Category.findByIdAndUpdate(toObjId(id), updateData);
};

const updateCategoryImage = async (id, imgPath) => {
  await Category.findByIdAndUpdate(toObjId(id), { imageUrl: imgPath });
};

const softDeleteCategory = async (id) => {
  const cat = await Category.findById(toObjId(id));
  if (!cat) throw new NotFoundError("Category not found");

  if (cat.childCategories && cat.childCategories.length > 0) {
    throw new Error("Cannot delete category with sub-categories");
  }

  const productCount = await Product.countDocuments({ category: toObjId(id), isDeleted: false });
  if (productCount > 0) throw new Error("Cannot delete category with active products");

  // Remove this category from its parent's childCategories array
  if (cat.parentCategory) {
    await Category.findByIdAndUpdate(cat.parentCategory, {
      $pull: { childCategories: cat._id },
    });
  }
  await Category.findByIdAndUpdate(toObjId(id), {
    isDeleted: true,
    isActive: false,
  });
};

const getCategoryPage = async (options = {}) => {
  const filter = { isDeleted: false };
  if (options.parentOnly) filter.isSubCategory = { $ne: true };

  const { data, pagination, search, sort, order } = await paginate(
    Category,
    filter,
    {
      page: options.page,
      limit: options.limit,
      sort: options.sort || "name",
      order: options.order || "asc",
      search: options.search,
      searchFields: ["name", "description"],
    },
  );

  const mapped = data.map((c) => ({
    _id: c._id.toString(),
    name: c.name,
    description: c.description || "",
    img_path: c.imageUrl || false,
    offer: c.offer || 0,
    offerstatus: c.offerstatus || false,
    deleted: c.isDeleted,
    isSubCategory: c.isSubCategory || false,
    parentCategory: c.parentCategory,
    createdAt: c.createdAt,
  }));

  return {
    data: mapped,
    pagination: {
      ...pagination,
      start: (pagination.page - 1) * pagination.limit + 1,
      end: Math.min(pagination.page * pagination.limit, pagination.total),
      sort,
      order,
      search,
    },
  };
};

/* ---- Offers (Category & Product) ---- */
const addCatOffer = async (data) => {
  const catId = toObjId(data.catId);
  const category = await Category.findById(catId);
  if (!category) throw new NotFoundError("Category not found");

  const offer = new Offer({
    title: `Offer on ${category.name}`,
    type: data.type || "percentage",
    value: parseFloat(data.offer) || 0,
    priority: parseInt(data.priority) || 0,
    appliedTo: category.isSubCategory ? "subcategory" : "category",
    startDate: new Date(),
    endDate: data.enddate ? new Date(data.enddate) : new Date(),
    isActive: true,
  });
  await offer.save();

  await Category.findByIdAndUpdate(catId, {
    $addToSet: { offers: offer._id },
  });
};

const removeCatOffer = async (id) => {
  const cat = await Category.findById(toObjId(id));
  if (!cat) throw new NotFoundError("Category not found");

  // Soft-delete all linked active offers
  if (cat.offers && cat.offers.length) {
    await Offer.updateMany(
      { _id: { $in: cat.offers }, isDeleted: false },
      { isDeleted: true, isActive: false },
    );
  }
  await Category.findByIdAndUpdate(toObjId(id), {
    $set: { offers: [] },
  });
};

const addProductOffer = async (data) => {
  const prId = toObjId(data.prId);
  const product = await Product.findById(prId);
  if (!product) throw new NotFoundError("Product not found");

  const offer = new Offer({
    title: data.title || `Offer on ${product.name}`,
    type: data.type || "percentage",
    value: parseFloat(data.offer) || 0,
    priority: parseInt(data.priority) || 0,
    appliedTo: "product",
    startDate: new Date(),
    endDate: data.enddate ? new Date(data.enddate) : new Date(),
    isActive: true,
  });
  await offer.save();

  await Product.findByIdAndUpdate(prId, {
    $addToSet: { offers: offer._id },
  });
};

const removeProductOffer = async (id) => {
  const product = await Product.findById(toObjId(id));
  if (!product) throw new NotFoundError("Product not found");

  if (product.offers && product.offers.length) {
    await Offer.updateMany(
      { _id: { $in: product.offers }, isDeleted: false },
      { isDeleted: true, isActive: false },
    );
  }
  await Product.findByIdAndUpdate(toObjId(id), {
    $set: { offers: [] },
  });
};

const getProductInfoOffer = async () => {
  const products = await Product.find({ isDeleted: false })
    .populate("offers")
    .lean();
  return products.map((p) => {
    const activeOffer = (p.offers || []).find(
      (o) => o.isActive && !o.isDeleted,
    );
    return {
      _id: p._id,
      title: p.name,
      price: p.price,
      img_path: normalizeImages(p.images),
      offers: p.offers || [],
      offerstatus: !!activeOffer,
      offer: activeOffer ? activeOffer.value : 0,
    };
  });
};

/* ---- Orders ---- */
const getAllOrders = async () => {
  const orders = await Order.find({})
    .populate("userId")
    .populate("address")
    .populate({
      path: "items.orderItemId",
      populate: { path: "productId", select: "name" },
    })
    .sort({ createdAt: -1 })
    .lean();
  return orders.map((o) => ({
    _id: o._id,
    date: o.createdAt,
    stringDate: o.createdAt
      ? new Date(o.createdAt).toLocaleDateString("en-IN", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "",
    address: o.address || {},
    mobile: o.userId?.mobile || "",
    user_name: o.userId?.name || "",
    products: (o.items || []).map((i) => ({
      title: i.orderItemId?.productId?.name || "Unknown",
      quantity: i.orderItemId?.quantity || 0,
      price: i.orderItemId?.price || 0,
    })),
    payment_option: o.paymentMethod,
    status: o.status,
    total_amount: o.totalAmount,
    deleted: o.isDeleted || false,
    dispatched: o.status === "shipped",
    canceled: o.status === "cancelled",
  }));
};

const getOrderPage = async (options = {}) => {
  const { data, pagination, search, sort, order } = await paginate(
    Order,
    {},
    {
      page: options.page,
      limit: options.limit,
      sort: options.sort || "createdAt",
      order: options.order || "desc",
      search: options.search,
      searchFields: ["status", "paymentMethod"],
    },
  );
  const orders = await Order.populate(data, [
    { path: "userId", select: "name mobile" },
    { path: "address" },
    {
      path: "items.orderItemId",
      populate: { path: "productId", select: "name" },
    },
  ]);
  const mapped = orders.map((o) => ({
    _id: o._id,
    date: o.createdAt,
    stringDate: o.createdAt
      ? new Date(o.createdAt).toLocaleDateString("en-IN", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "",
    address: o.address || {},
    mobile: o.userId?.mobile || "",
    user_name: o.userId?.name || "",
    products: (o.items || []).map((i) => ({
      title: i.orderItemId?.productId?.name || "Unknown",
      quantity: i.orderItemId?.quantity || 0,
      price: i.orderItemId?.price || 0,
    })),
    payment_option: o.paymentMethod,
    status: o.status,
    total_amount: o.totalAmount,
    deleted: o.isDeleted || false,
    dispatched: o.status === "shipped",
    canceled: o.status === "cancelled",
  }));
  return {
    data: mapped,
    pagination: {
      ...pagination,
      start: (pagination.page - 1) * pagination.limit + 1,
      end: Math.min(pagination.page * pagination.limit, pagination.total),
      sort,
      order,
      search,
    },
  };
};

const getOrderDetails = async (id) => {
  const o = await Order.findById(toObjId(id))
    .populate("userId")
    .populate("address")
    .populate({
      path: "items.orderItemId",
      populate: { path: "productId", select: "name price" },
    })
    .lean();
  if (!o) throw new NotFoundError("Order not found");
  return {
    _id: o._id,
    date: o.createdAt,
    stringDate: o.createdAt
      ? new Date(o.createdAt).toLocaleDateString("en-IN", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "",
    address: o.address || {},
    mobile: o.userId?.mobile || "",
    user_name: o.userId?.name || "",
    products: (o.items || []).map((i) => ({
      title: i.orderItemId?.productId?.name || "Unknown",
      quantity: i.orderItemId?.quantity || 0,
      price: i.orderItemId?.price || 0,
      offPrice: i.orderItemId?.offPrice || 0,
    })),
    payment_option: o.paymentMethod,
    status: o.status,
    total_amount: o.totalAmount,
    deleted: o.isDeleted || false,
    dispatched: o.status === "shipped",
    canceled: o.status === "cancelled",
  };
};

const dispatchOrder = async (orderId) => {
  await Order.findByIdAndUpdate(toObjId(orderId), {
    status: "shipped",
  });
};

const deliverOrder = async (orderId) => {
  await Order.findByIdAndUpdate(toObjId(orderId), {
    status: "delivered",
  });
};

const deleteOrder = async (id) => {
  await Order.findByIdAndUpdate(toObjId(id), {
    isDeleted: true,
    status: "deleted",
  });
};

/* ---- Coupons ---- */
const getCoupons = async () => {
  return Coupon.find({}).lean();
};

const addCoupon = async (data) => {
  const coupon = new Coupon({
    coupon_code: data.couponcode,
    offer: data.offer,
    start_date: new Date(),
    end_date: data.enddate,
    users: [],
  });
  await coupon.save();
};

const removeCoupon = async (id) => {
  await Coupon.findByIdAndDelete(toObjId(id));
};

/* ---- Banners ---- */
const getBanners = async () => {
  const banners = await Banner.find({ isDeleted: false }).lean();
  return banners.map((b) => ({
    _id: b._id,
    img_path: b.imageUrl,
    title: b.title,
    link: b.link,
  }));
};

const getBannerPage = async (options = {}) => {
  const filter = { isDeleted: false };
  const { data, pagination, search, sort, order } = await paginate(
    Banner,
    filter,
    {
      page: options.page,
      limit: options.limit,
      sort: options.sort || "createdAt",
      order: options.order || "desc",
    },
  );
  const mapped = data.map((b) => ({
    _id: b._id,
    img_path: b.imageUrl,
    title: b.title,
    link: b.link,
  }));
  return {
    data: mapped,
    pagination: {
      ...pagination,
      start: (pagination.page - 1) * pagination.limit + 1,
      end: Math.min(pagination.page * pagination.limit, pagination.total),
      sort,
      order,
      search: search || "",
    },
  };
};

const addBanner = async (filename) => {
  const banner = new Banner({ title: "Banner", imageUrl: filename });
  await banner.save();
};

const deleteBanner = async (id) => {
  await Banner.findByIdAndUpdate(toObjId(id), { isDeleted: true });
};

/* ---- Feedback ---- */
const getFeedback = async () => {
  const result = await Feedback.aggregate([
    {
      $lookup: {
        from: "users",
        localField: "user_data",
        foreignField: "_id",
        as: "user_info",
      },
    },
    { $unwind: { path: "$user_info", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        user_data: 1,
        feedbacks: 1,
        "user_info.user_name": "$user_info.name",
        "user_info.user_email": "$user_info.email",
        "user_info.user_mobile": "$user_info.mobile",
      },
    },
  ]);
  return result;
};

const getFeedbackPage = async (options = {}) => {
  const page = Math.max(1, parseInt(options.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(options.limit) || 10));
  const skip = (page - 1) * limit;

  const pipeline = [
    {
      $lookup: {
        from: "users",
        localField: "user_data",
        foreignField: "_id",
        as: "user_info",
      },
    },
    { $unwind: { path: "$user_info", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        user_data: 1,
        feedbacks: 1,
        "user_info.user_name": "$user_info.name",
        "user_info.user_email": "$user_info.email",
        "user_info.user_mobile": "$user_info.mobile",
      },
    },
    { $sort: { _id: -1 } },
  ];

  const [facet] = await Feedback.aggregate([
    ...pipeline,
    {
      $facet: {
        metadata: [{ $count: "total" }],
        data: [{ $skip: skip }, { $limit: limit }],
      },
    },
  ]);

  const total = facet?.metadata?.[0]?.total || 0;
  const totalPages = Math.ceil(total / limit);

  return {
    data: facet?.data || [],
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
      start: skip + 1,
      end: Math.min(page * limit, total),
      sort: "createdAt",
      order: "desc",
      search: "",
    },
  };
};

const getMessages = async () => {
  const result = await Message.aggregate([
    {
      $lookup: {
        from: "users",
        localField: "user_data",
        foreignField: "_id",
        as: "user_info",
      },
    },
    { $unwind: { path: "$user_info", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        user_data: 1,
        userMessage: 1,
        adminMessage: 1,
        adminView: 1,
        "user_info.user_name": "$user_info.name",
        "user_info.user_email": "$user_info.email",
        "user_info.user_mobile": "$user_info.mobile",
      },
    },
  ]);
  return result;
};

const getMessagePage = async (options = {}) => {
  const page = Math.max(1, parseInt(options.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(options.limit) || 10));
  const skip = (page - 1) * limit;

  const pipeline = [
    {
      $lookup: {
        from: "users",
        localField: "user_data",
        foreignField: "_id",
        as: "user_info",
      },
    },
    { $unwind: { path: "$user_info", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        user_data: 1,
        userMessage: 1,
        adminMessage: 1,
        adminView: 1,
        "user_info.user_name": "$user_info.name",
        "user_info.user_email": "$user_info.email",
        "user_info.user_mobile": "$user_info.mobile",
      },
    },
    { $sort: { _id: -1 } },
  ];

  const [facet] = await Message.aggregate([
    ...pipeline,
    {
      $facet: {
        metadata: [{ $count: "total" }],
        data: [{ $skip: skip }, { $limit: limit }],
      },
    },
  ]);

  const total = facet?.metadata?.[0]?.total || 0;
  const totalPages = Math.ceil(total / limit);

  return {
    data: facet?.data || [],
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
      start: skip + 1,
      end: Math.min(page * limit, total),
      sort: "createdAt",
      order: "desc",
      search: "",
    },
  };
};

/* ---- Sales Data ---- */
const getMonthSales = async () => {
  return Order.aggregate([
    { $match: { status: "placed" } },
    {
      $group: {
        _id: { $dateToString: { format: "%m", date: "$createdAt" } },
        totalAmount: { $sum: "$totalAmount" },
      },
    },
  ]);
};

const getYearSales = async () => {
  return Order.aggregate([
    { $match: { status: "placed" } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        totalAmount: { $sum: "$totalAmount" },
      },
    },
  ]);
};

const getDateLimitOrders = async (sdate, eDate) => {
  return Order.aggregate([
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user_info",
      },
    },
    { $unwind: { path: "$user_info", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        ordDate: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        user_info: 1,
        totalAmount: { $round: ["$totalAmount", 2] },
        status: 1,
        paymentMethod: 1,
      },
    },
    {
      $match: {
        $and: [{ ordDate: { $gt: sdate } }, { ordDate: { $lt: eDate } }],
      },
    },
  ]);
};

module.exports = {
  adminLogin,
  getDashboardStats,
  getAllProducts,
  getProductPage,
  getProductById,
  addProduct,
  updateProduct,
  softDeleteProduct,
  removeProductImage,
  getAllUsers,
  getUserPage,
  getUserById,
  addUser,
  updateUser,
  softDeleteUser,
  getAllCategories,
  getParentCategories,
  getCategoryPage,
  getCategoryById,
  addCategory,
  updateCategory,
  updateCategoryImage,
  softDeleteCategory,
  addCatOffer,
  removeCatOffer,
  addProductOffer,
  removeProductOffer,
  getProductInfoOffer,
  getAllOrders,
  getOrderPage,
  getOrderDetails,
  dispatchOrder,
  deliverOrder,
  deleteOrder,
  getCoupons,
  addCoupon,
  removeCoupon,
  getBanners,
  getBannerPage,
  addBanner,
  deleteBanner,
  getFeedback,
  getFeedbackPage,
  getMessages,
  getMessagePage,
  getMonthSales,
  getYearSales,
  getDateLimitOrders,
};
