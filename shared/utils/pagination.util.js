const paginate = async (
  Model,
  query = {},
  options = {},
  populate = []
) => {
  const page = Math.max(1, parseInt(options.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(options.limit) || 10));

  const sortField = options.sort || "createdAt";
  const sortOrder = options.order === "asc" ? 1 : -1;

  const search = (options.search || "").trim();
  const searchFields = options.searchFields || [];

  const filter = { ...query };

  if (search && searchFields.length) {
    filter.$or = searchFields.map((field) => ({
      [field]: { $regex: search, $options: "i" },
    }));
  }

  const sortObj = { [sortField]: sortOrder };
  const skip = (page - 1) * limit;

  let findQuery = Model.find(filter)
    .sort(sortObj)
    .skip(skip)
    .limit(limit);

  if (populate.length) {
    populate.forEach((item) => {
      findQuery = Array.isArray(item)
        ? findQuery.populate(...item)
        : findQuery.populate(item);
    });
  }

  const [data, total] = await Promise.all([
    findQuery.lean(),
    Model.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
      pages: Array.from({ length: totalPages }, (_, i) => i + 1),
    },
    search,
    sort: sortField,
    order: options.order || "desc",
  };
};

module.exports={paginate}