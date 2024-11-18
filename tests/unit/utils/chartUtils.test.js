import { describe, it, expect } from "vitest";
import { getStatusCodeData, getMimeTypeData } from "$lib/chartUtils";

describe("chartUtils", () => {
  describe("getStatusCodeData", () => {
    it("should return empty array for null or empty input", () => {
      expect(getStatusCodeData(null)).toEqual([]);
      expect(getStatusCodeData([])).toEqual([]);
    });

    it("should correctly group status codes into ranges", () => {
      const mockEntries = [
        { status: 200 },
        { status: 200 },
        { status: 404 },
        { status: 500 },
        { status: 301 },
      ];

      const expected = [
        { name: "200", value: 2 },
        { name: "300", value: 1 },
        { name: "400", value: 1 },
        { name: "500", value: 1 },
      ];

      expect(getStatusCodeData(mockEntries)).toEqual(expected);
    });

    it("should handle edge case status codes", () => {
      const mockEntries = [
        { status: 99 }, // Less than 100
        { status: 600 }, // More than 599
        { status: 200 }, // Normal case
      ];

      const expected = [
        { name: "200", value: 1 },
        { name: "Other", value: 2 },
      ];

      expect(getStatusCodeData(mockEntries)).toEqual(expected);
    });

    it("should handle all status code ranges", () => {
      const mockEntries = [
        { status: 101 },
        { status: 201 },
        { status: 301 },
        { status: 401 },
        { status: 501 },
      ];

      const expected = [
        { name: "100", value: 1 },
        { name: "200", value: 1 },
        { name: "300", value: 1 },
        { name: "400", value: 1 },
        { name: "500", value: 1 },
      ];

      expect(getStatusCodeData(mockEntries)).toEqual(expected);
    });
  });

  describe("getMimeTypeData", () => {
    it("should return empty array for null or empty input", () => {
      expect(getMimeTypeData(null)).toEqual([]);
      expect(getMimeTypeData([])).toEqual([]);
    });

    it("should correctly count entries by MIME type", () => {
      const mockEntries = [
        { type: "JS" },
        { type: "JS" },
        { type: "CSS" },
        { type: "Img" },
        { type: "Doc" },
      ];

      const expected = [
        { name: "Fetch/XHR", value: 0 },
        { name: "Doc", value: 1 },
        { name: "CSS", value: 1 },
        { name: "JS", value: 2 },
        { name: "Font", value: 0 },
        { name: "Img", value: 1 },
        { name: "Media", value: 0 },
        { name: "Manifest", value: 0 },
        { name: "WS", value: 0 },
        { name: "Wasm", value: 0 },
        { name: "Other", value: 0 },
      ];

      expect(getMimeTypeData(mockEntries)).toEqual(expected);
    });

    it("should maintain consistent order of MIME types", () => {
      const mockEntries = [
        { type: "Other" },
        { type: "JS" },
        { type: "Fetch/XHR" },
      ];

      const result = getMimeTypeData(mockEntries);
      expect(result[0].name).toBe("Fetch/XHR");
      expect(result[2].name).toBe("CSS");
      expect(result[3].name).toBe("JS");
      expect(result[result.length - 1].name).toBe("Other");
    });

    it("should handle all MIME types", () => {
      const mockEntries = [
        { type: "Fetch/XHR" },
        { type: "Doc" },
        { type: "CSS" },
        { type: "JS" },
        { type: "Font" },
        { type: "Img" },
        { type: "Media" },
        { type: "Manifest" },
        { type: "WS" },
        { type: "Wasm" },
        { type: "Other" },
      ];

      const result = getMimeTypeData(mockEntries);
      expect(result.length).toBe(11); // 全11種類のMIMEタイプ
      result.forEach((item) => {
        expect(item.value).toBe(1); // 各タイプが1つずつ
      });
    });
  });
});
