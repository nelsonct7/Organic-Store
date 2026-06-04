const { ValidationError, ConflictError, AuthenticationError, AuthorizationError, NotFoundError } = require("../shared/utils/error.util");

const globalErrorHandler = (err, req, res, next) => {
  console.error(err.stack);
  if(err instanceof ValidationError){
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: err.errors.map(e => ({
        field: e.param,
        message: e.msg,
        value: e.value
      }))
    });
  }
  if(err instanceof ConflictError){
    return res.status(409).json({
      success: false,
      message: err.message
    });
  }
  if(err instanceof AuthenticationError){
    return res.status(401).json({
      success: false,
      message: err.message
    });
  }
  if(err instanceof AuthorizationError){
    return res.status(403).render("errors/error403", {
      layout: false,
      title: "Access Forbidden",
      message: err.message,
    });
  }
  if(err instanceof NotFoundError){
    return res.status(404).render("errors/admin-not-found", {
      layout: false,
      title: "Not Found - Organic Store",
      itemType: "Resource",
      message: err.message,
      backLink: "/admin/home",
      backText: "Dashboard",
    });
  }

  res.status(500).render("errors/error500", {
    title: "Server Error",
    message: "An unexpected error occurred. Please try again later.",
  });
};

module.exports = globalErrorHandler;