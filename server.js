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

const requiredEnvVars = [
  "PORT",
  "SESSION_SECRET",
  "MONGO_URI",
  "JWT_SECRET",
  "PAYPAL_CLIENT_ID",
  "PAYPAL_CLIENT_SECRET",
  "RAZORPAY_KEY_ID",
  "RAZORPAY_KEY_SECRET",
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
    app.use(helmet());
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
    // cache control for unauthenticated users
    app.use((req, res, next) => {
      if (!req.user) {
        res.set("Cache-Control", "no-cache, no-store, must-revalidate");
        res.set("Pragma", "no-cache");
        res.set("Expires", "0");
      }
      next();
    });

    // register handlebars helper
    HBS.handlebars.registerHelper("ifCond", function (v1, v2, options) {
      if (v1 === v2) {
        return options.fn(this);
      }
      return options.inverse(this);
    });

    // health check endpoint
    app.get("/health", (req, res) => {
      res
        .status(200)
        .json({ status: "ok", timestamp: new Date().toISOString(),message: "Server is healthy..." });
    });
    // apply rate limiter to auth routes
    app.use("/v1/auth/login", authLimiter);
    app.use("/v1/auth/register", authLimiter);

    // routes setup
    app.use("/v1/auth", authRoutes);

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
