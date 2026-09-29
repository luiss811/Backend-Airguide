import crypto from 'crypto';
/** Generates a 6-digit numeric OTP */
export function generateOtp() {
    return crypto.randomInt(100000, 999999).toString();
}
/** Returns expiry date 10 minutes from now */
export function getOtpExpiry() {
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + 10);
    return expiry;
}
//# sourceMappingURL=otp.js.map