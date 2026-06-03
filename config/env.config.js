const { getEnvNumber, getEnvString } = require("../shared/utils/env.utils");
const dotenv = require('dotenv');
dotenv.config();

const env = {
  port: getEnvNumber('PORT', 3000),
  sessionSecret: getEnvString('SESSION_SECRET', 'your-session-secret'),
  sessionMaxAge: getEnvNumber('SESSION_MAX_AGE', 60000000),
  mongoUri: getEnvString('MONGO_URI', 'mongodb://localhost:27017/org_store'),
  jwtSecret: getEnvString('JWT_SECRET', 'your-jwt-secret'),
  paypalClientId: getEnvString('PAYPAL_CLIENT_ID', 'your-paypal-client-id'),
  paypalClientSecret: getEnvString('PAYPAL_CLIENT_SECRET', 'your-paypal-client-secret'),
  razorpayKeyId: getEnvString('RAZORPAY_KEY_ID', 'your-razorpay-key-id'),
  razorpayKeySecret: getEnvString('RAZORPAY_KEY_SECRET', 'your-razorpay-key-secret'),
  twilioAccountSid: getEnvString('TWILIO_ACCOUNT_SID', 'your-twilio-account-sid'),
  twilioServiceSid: getEnvString('TWILIO_SERVICE_SID', 'your-twilio-service-sid'),
  twilioAuthToken: getEnvString('TWILIO_AUTH_TOKEN', 'your-twilio-auth-token'),
  twilioPhoneNumber: getEnvString('TWILIO_PHONE_NUMBER', 'your-twilio-phone-number'),
  corsOrigin: getEnvString('CORS_ORIGIN', '*'),
};

module.exports = env;