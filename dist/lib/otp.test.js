import { describe, it, expect } from 'vitest';
import { generateOtp, getOtpExpiry } from './otp.js';
describe('OTP Utility', () => {
    it('generates a 6-digit numeric OTP string', () => {
        const otp = generateOtp();
        expect(otp).toMatch(/^\d{6}$/);
    });
    it('returns expiry date approximately 10 minutes in the future', () => {
        const now = Date.now();
        const expiry = getOtpExpiry().getTime();
        const diffInMinutes = (expiry - now) / (1000 * 60);
        expect(diffInMinutes).toBeGreaterThanOrEqual(9.9);
        expect(diffInMinutes).toBeLessThanOrEqual(10.1);
    });
});
//# sourceMappingURL=otp.test.js.map