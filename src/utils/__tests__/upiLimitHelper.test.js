/**
 * Tests for UPI Limit Helper utility
 */

import {
  checkUpiLimits,
  getUpiLimitGuidance,
  getUpiLimitDisplay,
  getAppSpecificGuidance,
  UPI_LIMITS,
} from "../upiLimitHelper";

describe("UPI Limit Helper", () => {
  describe("checkUpiLimits", () => {
    test("should identify small amounts as within all limits", () => {
      const result = checkUpiLimits(1000);

      expect(result.isWithinCommonLimits).toBe(true);
      expect(result.isWithinBasicLimits).toBe(true);
      expect(result.supportedApps.length).toBeGreaterThan(0);
      expect(result.exceedsAllLimits).toBe(false);
    });

    test("should identify large amounts as exceeding basic limits", () => {
      const result = checkUpiLimits(50000);

      expect(result.isWithinCommonLimits).toBe(true);
      expect(result.isWithinBasicLimits).toBe(false);
      expect(result.supportedApps.length).toBeGreaterThan(0);
    });

    test("should identify very large amounts as exceeding most limits", () => {
      const result = checkUpiLimits(200000);

      expect(result.isWithinCommonLimits).toBe(false);
      expect(result.exceedsAllLimits).toBe(true);
      expect(result.supportedApps.length).toBe(0);
    });

    test("should return recommended apps sorted by limit", () => {
      const result = checkUpiLimits(15000);

      expect(result.recommendedApps.length).toBeGreaterThan(0);
      // Should be sorted by highest limit first
      if (result.recommendedApps.length > 1) {
        expect(result.recommendedApps[0].limit).toBeGreaterThanOrEqual(
          result.recommendedApps[1].limit
        );
      }
    });
  });

  describe("getUpiLimitGuidance", () => {
    test("should provide appropriate guidance for small amounts", () => {
      const guidance = getUpiLimitGuidance(1000);

      expect(guidance.primaryMessage).toContain("should work");
      expect(guidance.suggestions).toContain(
        "Try scanning QR code if app button fails"
      );
      expect(guidance.alternatives.length).toBeGreaterThan(0);
    });

    test("should provide warning for medium amounts", () => {
      const guidance = getUpiLimitGuidance(50000);

      expect(guidance.primaryMessage).toContain(
        "may exceed some UPI app limits"
      );
      expect(guidance.suggestions).toContain(
        "Try scanning QR code directly in your UPI app"
      );
    });

    test("should provide error guidance for very large amounts", () => {
      const guidance = getUpiLimitGuidance(200000);

      expect(guidance.primaryMessage).toContain("exceeds most UPI app limits");
      expect(guidance.suggestions).toContain(
        "Contact your bank to increase UPI transaction limits"
      );
    });
  });

  describe("getUpiLimitDisplay", () => {
    test("should not show warning for small amounts", () => {
      const display = getUpiLimitDisplay(500);

      expect(display.showWarning).toBe(false);
    });

    test("should show warning for large amounts", () => {
      const display = getUpiLimitDisplay(50000);

      expect(display.showWarning).toBe(true);
      expect(display.warningLevel).toBe("warning");
      expect(display.title).toBe("Check UPI Limits");
    });

    test("should show danger for very large amounts", () => {
      const display = getUpiLimitDisplay(200000);

      expect(display.showWarning).toBe(true);
      expect(display.warningLevel).toBe("danger");
      expect(display.title).toBe("Amount Exceeds UPI Limits");
    });
  });

  describe("getAppSpecificGuidance", () => {
    test("should provide Google Pay specific guidance", () => {
      const guidance = getAppSpecificGuidance("Google Pay", 50000);

      expect(guidance.app).toBe("Google Pay");
      expect(guidance.isSupported).toBe(true);
      expect(guidance.limit).toBe(UPI_LIMITS.gpay.perTransaction);
    });

    test("should indicate when amount exceeds app limit", () => {
      const guidance = getAppSpecificGuidance("Paytm", 50000);

      expect(guidance.app).toBe("Paytm");
      expect(guidance.isSupported).toBe(false);
      expect(guidance.message).toContain("exceeds");
      expect(guidance.suggestions).toContain("Try an app with higher limits");
    });

    test("should provide alternatives when app cannot handle amount", () => {
      const guidance = getAppSpecificGuidance("BHIM UPI", 50000);

      expect(guidance.alternatives.length).toBeGreaterThan(0);
      expect(guidance.alternatives[0].name).not.toBe("BHIM UPI");
    });
  });

  describe("UPI_LIMITS constant", () => {
    test("should have all required app limits", () => {
      const requiredApps = ["gpay", "phonepe", "paytm", "bhim"];

      requiredApps.forEach((app) => {
        expect(UPI_LIMITS[app]).toBeDefined();
        expect(UPI_LIMITS[app].name).toBeDefined();
        expect(UPI_LIMITS[app].perTransaction).toBeGreaterThan(0);
        expect(UPI_LIMITS[app].daily).toBeGreaterThan(0);
      });
    });

    test("should have reasonable limit values", () => {
      Object.values(UPI_LIMITS).forEach((limit) => {
        expect(limit.perTransaction).toBeGreaterThan(1000);
        expect(limit.perTransaction).toBeLessThanOrEqual(200000);
        expect(limit.daily).toBeGreaterThanOrEqual(limit.perTransaction);
      });
    });
  });
});
