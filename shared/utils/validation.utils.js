const { body, query, param, validationResult } = require("express-validator");

/**
 * Create a validation middleware for multiple request sources
 * @param {Object} schema - Validation schema with keys: body, query, params
 * @example
 * const schema = {
 *   body: {
 *     email: { required: true, isEmail: true },
 *     password: { required: true, isLength: { min: 6 } }
 *   },
 *   query: {
 *     page: { optional: true, isInt: true }
 *   },
 *   params: {
 *     id: { required: true }
 *   }
 * }
 * router.post('/user', validationMiddleware(schema), controllerFunction);
 */
const validationMiddleware = (schema) => {
  return async (req, res, next) => {
    const validationChains = [];

    // Process body validations
    if (schema.body) {
      validationChains.push(...buildValidationChains("body", schema.body));
    }

    // Process query validations
    if (schema.query) {
      validationChains.push(...buildValidationChains("query", schema.query));
    }

    // Process params validations
    if (schema.params) {
      validationChains.push(...buildValidationChains("param", schema.params));
    }

    // Run all validation chains
    for (const chain of validationChains) {
      await chain.run(req);
    }

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array().map(err => ({
          field: err.param,
          message: err.msg,
          value: err.value
        }))
      });
    }

    next();
  };
};

/**
 * Build validation chains based on type and rules
 */
const buildValidationChains = (type, schema) => {
  const chains = [];
  const validationFn = type === "body" ? body : type === "query" ? query : param;

  for (const field in schema) {
    if (schema.hasOwnProperty(field)) {
      const rules = schema[field];
      let chain = validationFn(field);

      // Optional check
      if (rules.optional) {
        chain = chain.optional({ checkFalsy: true });
      }

      // Required check
      if (rules.required && !rules.optional) {
        chain = chain.notEmpty().withMessage(`${field} is required`);
      }

      // Email validation
      if (rules.isEmail) {
        chain = chain.isEmail().withMessage(`${field} must be a valid email`);
      }

      // Length validation
      if (rules.isLength) {
        const { min, max } = rules.isLength;
        if (min && max) {
          chain = chain.isLength({ min, max }).withMessage(`${field} must be between ${min} and ${max} characters`);
        } else if (min) {
          chain = chain.isLength({ min }).withMessage(`${field} must be at least ${min} characters long`);
        } else if (max) {
          chain = chain.isLength({ max }).withMessage(`${field} must not exceed ${max} characters`);
        }
      }

      // Integer validation
      if (rules.isInt) {
        chain = chain.isInt().withMessage(`${field} must be an integer`);
      }

      // Numeric validation
      if (rules.isNumeric) {
        chain = chain.isNumeric().withMessage(`${field} must be numeric`);
      }

      // String validation
      if (rules.isString) {
        chain = chain.isString().withMessage(`${field} must be a string`);
      }

      // Boolean validation
      if (rules.isBoolean) {
        chain = chain.isBoolean().withMessage(`${field} must be a boolean`);
      }

      // URL validation
      if (rules.isURL) {
        chain = chain.isURL().withMessage(`${field} must be a valid URL`);
      }

      // Matches validation (regex)
      if (rules.matches) {
        chain = chain.matches(rules.matches.pattern, rules.matches.flags || "").withMessage(rules.matches.message || `${field} format is invalid`);
      }

      // Custom validator
      if (rules.custom) {
        chain = chain.custom(rules.custom);
      }

      chains.push(chain);
    }
  }

  return chains;
};

module.exports = { validationMiddleware };