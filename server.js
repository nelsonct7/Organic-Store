const express = require("express");
const path = require("path");
const logger = require("morgan");
const hbs = require("express-handlebars");
const bodyParser = require("body-parser");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const helmet = require("helmet");

const { connect_to_db } = require("./config/db.config");
const { validateEnvVariables } = require("./shared/utils/env.utils");
const env = require("./config/env.config");
const globalErrorHandler = require("./middlewares/error.middleware");
const { authLimiter } = require("./middlewares/ratelimit.middleware");

// route imports
const authRoutes = require("./routes/auth.routes");
const googleAuthRoutes = require("./routes/google.auth.routes");
const baseRoutes = require("./routes/base.routes");
const errorRoutes = require("./routes/error.routes");
const adminRoutes = require("./routes/admin.routes");
const cartRoutes = require("./routes/cart.routes");
const checkoutRoutes = require("./routes/checkout.routes");
const orderRoutes = require("./routes/order.routes");
const reviewRoutes = require("./routes/review.routes");
const invoiceRoutes = require("./routes/invoice.routes");
const { dataInjectMiddleware } = require("./middlewares/data-inject.middleware");

const requiredEnvVars = [
  "PORT",
  "SESSION_SECRET",
  "MONGO_URI",
  "JWT_SECRET",
  "RAZORPAY_KEY_ID",
  "RAZORPAY_KEY_SECRET",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
];

const createServer = async () => {
  try {
    const HBS = hbs.create({});
    const app = express();
    // validate required environment variables, exit if any are missing
    validateEnvVariables(requiredEnvVars);

    // establish database connection
    await connect_to_db();

    // set view engine
    app.set("views", path.join(__dirname, "views"));
    app.set("view engine", "hbs");
    app.engine(
      "hbs",
      hbs.engine({
        extname: "hbs",
        defaultLayout: "layout",
        layoutDir: __dirname + "/views/layout/",
        partialsDir: __dirname + "/views/partials/",
      }),
    );
    // middleware setup
    app.use(logger("dev"));
    app.use(
      helmet.contentSecurityPolicy({
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'",
            "https://ajax.googleapis.com",
            "https://cdn.jsdelivr.net",
            "https://kit.fontawesome.com",
            "https://checkout.razorpay.com",
            "https://cdn.razorpay.com",
            "https://cdn.datatables.net",
            "https://cdnjs.cloudflare.com",
          ],
          scriptSrcAttr: ["'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'",
            "https://cdn.jsdelivr.net",
            "https://fonts.googleapis.com",
            "https://kit.fontawesome.com",
            "https://ka-f.fontawesome.com",
          ],
          fontSrc: ["'self'", "https://fonts.gstatic.com", "https://kit.fontawesome.com", "https://ka-f.fontawesome.com"],
          imgSrc: ["'self'", "data:", "blob:"],
          connectSrc: ["'self'", "https://cdn.jsdelivr.net", "https://ka-f.fontawesome.com", "https://lumberjack.razorpay.com"],
          frameSrc: ["'self'", "https://api.razorpay.com", "https://checkout.razorpay.com"],
        },
      }),
    );
    app.use(
      cors({
        origin: env.corsOrigin || "*", 
        methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
        credentials: true,
      }),
    );
    app.use(express.json());
    app.use(
      express.urlencoded({
        extended: true,
      }),
    );
    app.use(cookieParser());
    app.use(express.static(path.join(__dirname, "public")));
    app.use(
      session({
        secret: env.sessionSecret,
        cookie: {
          maxAge: env.sessionMaxAge,
        },
        resave: false,
        saveUninitialized: false,
      }),
    );
    // Flash middleware
    app.use((req, res, next) => {
      req.flash = (type, message) => {
        if (!req.session.flash) req.session.flash = {};
        req.session.flash[type] = message;
      };
      res.locals.flash = req.session.flash || {};
      delete req.session.flash;
      next();
    });

    // Passport initialization
    const passport = require("./config/passport.config");
    app.use(passport.initialize());
    app.use(passport.session());

    // inject commonly used fields in to all routes
    app.use(dataInjectMiddleware)

    // cache control for unauthenticated users
    app.use((req, res, next) => {
      if (!req.user) {
        res.set("Cache-Control", "no-cache, no-store, must-revalidate");
        res.set("Pragma", "no-cache");
        res.set("Expires", "0");
      }
      next();
    });

    // register handlebars helpers
    HBS.handlebars.registerHelper("ifCond", function (v1, operator, v2, options) {
      // Support both old {{#ifCond a b}} (equality) and new {{#ifCond a "lte" b}} syntax
      if (arguments.length < 4) {
        options = v2;
        v2 = operator;
        operator = "===";
      }
      const ops = { "===": (a,b)=>a===b, "==": (a,b)=>a==b, "!==": (a,b)=>a!==b, "!=": (a,b)=>a!=b, "<": (a,b)=>a<b, "<=": (a,b)=>a<=b, ">": (a,b)=>a>b, ">=": (a,b)=>a>=b, "lte": (a,b)=>a<=b, "gte": (a,b)=>a>=b, "lt": (a,b)=>a<b, "gt": (a,b)=>a>b };
      const fn = ops[operator] || ((a, b) => a === b);
      if (fn(v1, v2)) return options.fn(this);
      return options.inverse(this);
    });
    HBS.handlebars.registerHelper("eq", function (v1, v2) {
      return v1 === v2;
    });
    HBS.handlebars.registerHelper("add", function (a, b) {
      return parseInt(a) + parseInt(b);
    });
    HBS.handlebars.registerHelper("subtract", function (a, b) {
      return parseInt(a) - parseInt(b);
    });
    HBS.handlebars.registerHelper("multiply", function (a, b) {
      return parseFloat(a) * parseFloat(b);
    });
    HBS.handlebars.registerHelper("times", function (n, options) {
      let out = "";
      for (let i = 1; i <= n; i++) {
        out += options.fn(i);
      }
      return out;
    });
    HBS.handlebars.registerHelper("timeAgo", function (date) {
      if (!date) return "";
      const now = new Date();
      const diff = Math.floor((now - new Date(date)) / 1000);
      if (diff < 60) return "just now";
      if (diff < 3600) return Math.floor(diff / 60) + "m ago";
      if (diff < 86400) return Math.floor(diff / 3600) + "h ago";
      if (diff < 172800) return "1 day ago";
      if (diff < 604800) return Math.floor(diff / 86400) + "d ago";
      return new Date(date).toLocaleDateString();
    });

    // health check endpoint
    app.get("/health", (req, res) => {
      res
        .status(200)
        .json({
          status: "ok",
          timestamp: new Date().toISOString(),
          message: "Server is healthy...",
        });
    });
    // apply rate limiter to auth routes
    app.use("/v1/auth/login", authLimiter);
    app.use("/v1/auth/register", authLimiter);

    // routes setup
    app.use("/", baseRoutes);
    app.use("/v1/auth", authRoutes);
    app.use("/auth", googleAuthRoutes);
    app.use("/admin", adminRoutes);
    app.use("/error", errorRoutes);
    app.use("/", cartRoutes);
    app.use("/", checkoutRoutes);
    app.use("/", orderRoutes);
    app.use("/", reviewRoutes);
    app.use("/", invoiceRoutes);

    // 404 handler - keep this before the global error handler to catch 404s
    app.use((req, res, next) => {
      res.status(404).render("errors/error404", {
        title: "Page Not Found",
        message: "The page you are looking for does not exist.",
      });
    });
    // global error handler
    // keep this as the last middleware to catch all errors
    app.use(globalErrorHandler);
    // return the app instance for use in app.js
    return app;
  } catch (err) {
    console.error("Error creating server:", err);
  }
};

module.exports = { createServer };
