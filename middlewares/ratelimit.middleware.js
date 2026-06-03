const rateLimit = require("express-rate-limit");

/**
 * Creates a rate limiter middleware with the given options.
 * @param {Object} options - Configuration options for the rate limiter
 * @param {number} options.windowMs - Time frame for which requests are checked/remembered (in milliseconds)
 * @param {number} options.max - Max number of connections during the windowMs time frame
 * @param {string} options.message - Message to send when max is exceeded
 * @returns {Function} Express middleware function for rate limiting
 * @example
 * const authLimiter = createRateLimiter({
 *   windowMs: 15 * 60 * 1000, // 15 minutes
 *  max: 10, // limit each IP to 10 requests per windowMs
 *  message: "Too many attempts, please try again later."
 * });
 * app.use("/auth/login", authLimiter);
 * app.use("/auth/register", authLimiter);
 * */

const createRateLimiter = (options) => {
  return rateLimit({
    windowMs: options.windowMs || 15 * 60 * 1000, // default 15 minutes
    max: options.max || 100, // default 100 requests per window
    message: options.message || "Too many requests, please try again later.",
    standardHeaders: options.standardHeaders || true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: options.legacyHeaders || false, // Disable the `X-RateLimit-*` headers
  });
};

// rates limiter for login and registration routes
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: "Too many attempts, please try again later.",
});

module.exports = { createRateLimiter, authLimiter };
