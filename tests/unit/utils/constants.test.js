import { describe, it, expect } from "vitest";
import { statusRanges, communicationTypes, httpMethods } from "$lib/constants";

describe("Constants", () => {
  describe("statusRanges", () => {
    it("should contain all standard HTTP status code ranges", () => {
      expect(statusRanges).toHaveLength(6); // 5つの標準範囲 + Other
    });

    it("should have valid range definitions", () => {
      for (const range of statusRanges) {
        expect(range).toHaveProperty("label");
        if (!range.other) {
          expect(range).toHaveProperty("min");
          expect(range).toHaveProperty("max");
          expect(range.min).toBeLessThanOrEqual(range.max);
          expect(range.max - range.min).toBe(99); // 各範囲は100個の値を含む
        }
      }
    });

    it("should cover all standard HTTP status codes", () => {
      const isStatusCovered = (status) => {
        return statusRanges.some((range) => {
          if (range.other) {
            return status < 100 || status >= 600; // 標準範囲外のコード
          }
          return status >= range.min && status <= range.max;
        });
      };

      // テストケース: 主要なステータスコードの境界値
      [
        // 標準的なステータスコード
        100,
        101, // Informational (1xx)
        200,
        201,
        204, // Success (2xx)
        301,
        302,
        304, // Redirection (3xx)
        400,
        401,
        404, // Client Error (4xx)
        500,
        501,
        503, // Server Error (5xx)
        // 境界値
        99, // Below standard range
        600, // Above standard range
      ].forEach((status) => {
        expect(
          isStatusCovered(status),
          `Status ${status} should be covered by appropriate range`
        ).toBeTruthy();
      });
    });

    it("should have correct labels for standard ranges", () => {
      const standardRanges = statusRanges.filter((range) => !range.other);
      const expectedLabels = ["1xx", "2xx", "3xx", "4xx", "5xx"];

      standardRanges.forEach((range, index) => {
        expect(range.label).toBe(expectedLabels[index]);
        expect(Math.floor(range.min / 100)).toBe(index + 1);
      });
    });

    it("should handle non-standard codes with Other category", () => {
      const otherRange = statusRanges.find((range) => range.other);
      expect(otherRange).toBeDefined();
      expect(otherRange.label).toBe("Other");

      // Otherカテゴリーはminとmaxを持たない
      expect(otherRange.min).toBeUndefined();
      expect(otherRange.max).toBeUndefined();
    });

    it("should not have overlapping ranges", () => {
      const standardRanges = statusRanges.filter((range) => !range.other);

      for (let i = 0; i < standardRanges.length; i++) {
        for (let j = i + 1; j < standardRanges.length; j++) {
          const range1 = standardRanges[i];
          const range2 = standardRanges[j];

          expect(
            range1.max < range2.min || range1.min > range2.max,
            `Range ${range1.label} overlaps with ${range2.label}`
          ).toBeTruthy();
        }
      }
    });
  });

  describe("communicationTypes", () => {
    it("should contain all required communication types", () => {
      expect(communicationTypes).toHaveLength(11);

      // 重要な通信タイプが含まれていることを確認
      const requiredTypes = ["Fetch/XHR", "Doc", "CSS", "JS"];
      requiredTypes.forEach((type) => {
        expect(communicationTypes).toContain(type);
      });
    });

    it("should have unique values", () => {
      const uniqueTypes = new Set(communicationTypes);
      expect(uniqueTypes.size).toBe(communicationTypes.length);
    });
  });

  describe("httpMethods", () => {
    it("should contain all standard HTTP methods", () => {
      expect(httpMethods).toHaveLength(8);

      // 主要なHTTPメソッドが含まれていることを確認
      const requiredMethods = ["GET", "POST", "PUT", "DELETE"];
      requiredMethods.forEach((method) => {
        expect(httpMethods).toContain(method);
      });
    });

    it("should have all methods in uppercase", () => {
      httpMethods.forEach((method) => {
        expect(method).toBe(method.toUpperCase());
      });
    });

    it("should have unique values", () => {
      const uniqueMethods = new Set(httpMethods);
      expect(uniqueMethods.size).toBe(httpMethods.length);
    });
  });
});
