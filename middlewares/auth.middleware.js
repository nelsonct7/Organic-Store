const { AuthorizationError } = require("../shared/utils/error.util");
const Role = require("../collections/roles.collection");

const validateAdminAccess = async (req, res, next) => {
  try {
    // session-based admin check (used by the admin panel)
    if (req.session.isAdmin) {
      return next();
    }
    // role-based check via JWT/user session
    const { user } = req.session;
    if (!user || !user.role) {
      throw new AuthorizationError("Unauthorized access");
    }
    const roleDoc = await Role.findById(user.role);
    if (!roleDoc) {
      throw new AuthorizationError("Role not defined");
    }
    if (roleDoc.name !== "admin") {
      throw new AuthorizationError("Unauthorized access");
    }
    req.session.isAdmin = true;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { validateAdminAccess };