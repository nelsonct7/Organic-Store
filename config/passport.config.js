const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../collections/user.collection");
const Roles = require("../collections/roles.collection");
const env = require("./env.config");

passport.serializeUser((user, done) => {
  done(null, user._id.toString());
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).lean();
    if (!user) return done(null, false);
    done(null, {
      _id: user._id,
      email: user.email,
      name: user.name,
      authProvider: user.authProvider,
    });
  } catch (err) {
    done(err);
  }
});

passport.use(
  new GoogleStrategy(
    {
      clientID: env.googleClientId,
      clientSecret: env.googleClientSecret,
      callbackURL: env.googleCallbackUrl || "/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) return done(new Error("No email returned from Google"), null);

        const googleId = profile.id;
        const existing = await User.findOne({ email }).lean();

        if (existing) {
          if (existing.authProvider === "google") {
            return done(null, existing);
          }
          return done(null, false, { message: "An account with this email already exists. Please sign in with your password." });
        }

        const userRole = await Roles.findOne({ name: "user" });
        if (!userRole) return done(new Error("User role not found"), null);

        const newUser = await User.create({
          name: profile.displayName || email.split("@")[0],
          email,
          mobile: "0000000000",
          authProvider: "google",
          googleId,
          role: userRole._id,
        });

        done(null, newUser.toObject());
      } catch (err) {
        done(err);
      }
    },
  ),
);

module.exports = passport;
