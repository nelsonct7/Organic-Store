const env = require("../../config/env.config");
const client = require("twilio")(env.twilioAccountSid, env.twilioAuthToken);

const toE164 = (mobile) => {
  const digits = mobile.replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 11 && digits.startsWith("0")) return `+${digits.slice(1)}`;
  if (digits.length >= 12 && digits.length <= 15) return `+${digits}`;
  return mobile;
};

const sendOTP = async (mobile) => {
  try {
    const verification = await client.verify.v2
      .services(env.twilioServiceSid)
      .verifications.create({ to: toE164(mobile), channel: "sms" });
    return verification.status === "pending";
  } catch (err) {
    console.error("Twilio sendOTP error:", err.message);
    return false;
  }
};

const verifyOTP = async (mobile, code) => {
  try {
    const check = await client.verify.v2
      .services(env.twilioServiceSid)
      .verificationChecks.create({ to: toE164(mobile), code });
    return check.valid;
  } catch (err) {
    console.error("Twilio verifyOTP error:", err.message);
    return false;
  }
};

module.exports = { sendOTP, verifyOTP };
