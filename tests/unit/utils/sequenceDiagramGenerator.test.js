import { describe, it, expect } from "vitest";
import {
  escapeForMermaid,
  truncateAndEscape,
  generateMermaidHeaderAndTitle,
  generateMermaidQueryString,
  generateMermaidPostData,
  generateMermaidRequestCookies,
  generateMermaidResponse,
  generateMermaidResponseCookies,
  generatePlantUMLHeaderAndTitle,
  generatePlantUMLQueryString,
  generatePlantUMLPostData,
  generatePlantUMLRequestCookies,
  generatePlantUMLResponse,
  generatePlantUMLResponseCookies,
} from "$lib/sequenceDiagramGenerator";

// Mermaid記法のテスト
describe("Mermaid Sequence Diagram Generator", () => {
  describe("escapeForMermaid", () => {
    it("should escape colons and newlines for Mermaid syntax", () => {
      const input = "test:value\nnew line";
      const expected = "test&#58;value<br>new line";
      expect(escapeForMermaid(input)).toBe(expected);
    });
  });

  describe("generateMermaidHeaderAndTitle", () => {
    it("should generate Mermaid header without options", () => {
      const result = generateMermaidHeaderAndTitle(false, "", false);
      expect(result).toBe("sequenceDiagram\n");
    });

    it("should generate Mermaid header with title", () => {
      const result = generateMermaidHeaderAndTitle(true, "Test Title", false);
      // Mermaidの場合、titleはコロンが必要
      expect(result).toBe("sequenceDiagram\ntitle: Test Title\n");
    });

    it("should generate Mermaid header with autonumber", () => {
      const result = generateMermaidHeaderAndTitle(false, "", true);
      expect(result).toBe("sequenceDiagram\nautonumber\n");
    });
  });

  describe("generateMermaidResponse", () => {
    const mockEntry = {
      domain: "example.com",
      status: 200,
      responseMimeType: "application/json",
    };

    it("should use Mermaid arrow syntax for success response", () => {
      const result = generateMermaidResponse(mockEntry, false);
      // Mermaidの場合、->>, -->>、--xを使用
      expect(result).toBe("example.com ->> Browser: 200 - application/json\n");
    });

    it("should use Mermaid arrow syntax for redirect", () => {
      const redirectEntry = { ...mockEntry, status: 302 };
      const result = generateMermaidResponse(redirectEntry, false);
      expect(result).toBe("example.com -->> Browser: 302 - application/json\n");
    });

    it("should use Mermaid arrow syntax for error", () => {
      const errorEntry = { ...mockEntry, status: 500 };
      const result = generateMermaidResponse(errorEntry, false);
      expect(result).toBe("example.com --x Browser: 500 - application/json\n");
    });
  });

  describe("generateMermaidRequestCookies", () => {
    const mockEntry = {
      domain: "example.com",
      requestCookies: [
        { name: "cookie1", value: "value1" },
        { name: "cookie2", value: "value2" },
      ],
    };

    it("should generate Mermaid note syntax for request cookies", () => {
      const result = generateMermaidRequestCookies(mockEntry, true, true, 20);
      // Mermaidの場合、note over構文を使用
      expect(result).toContain("note over example.com: [Request Cookies]");
      expect(result).toContain("<br>"); // Mermaidは改行に<br>を使用
    });
  });

  describe("generateMermaidQueryString", () => {
    it("should handle entry without requestQueryString", () => {
      const mockEntry = { domain: "example.com" };
      expect(generateMermaidQueryString(mockEntry, true, true, 20)).toBe("");
    });

    it("should handle empty requestQueryString array", () => {
      const mockEntry = {
        domain: "example.com",
        requestQueryString: [],
      };
      expect(generateMermaidQueryString(mockEntry, true, true, 20)).toBe("");
    });

    it("should format regular query string correctly", () => {
      const mockEntry = {
        domain: "example.com",
        requestQueryString: [
          {
            name: "param",
            value: "value",
          },
        ],
      };
      const expected =
        "note over example.com: [Query String]<br>param: value\n";
      expect(generateMermaidQueryString(mockEntry, true, true, 20)).toBe(
        expected
      );
    });

    it("should handle complex font query parameters", () => {
      const mockEntry = {
        domain: "example.com",
        requestQueryString: [
          { name: "family", value: "M+PLUS+1p:wght@100;300;400" },
          { name: "display", value: "swap" },
        ],
      };
      // 期待値を[Complex Value]に更新
      const expected =
        "note over example.com: [Query String]<br>family: [Complex Value]<br>display: swap\n";
      expect(generateMermaidQueryString(mockEntry, true, true, 20)).toBe(
        expected
      );
    });

    it("should truncate regular query parameters when truncation is enabled", () => {
      const mockEntry = {
        domain: "example.com",
        requestQueryString: [
          {
            name: "very_long_parameter_name",
            value: "very_long_parameter_value",
          },
        ],
      };
      const expected =
        "note over example.com: [Query String]<br>very_long_parameter_...: very_long_parameter_...\n";
      expect(generateMermaidQueryString(mockEntry, true, true, 20)).toBe(
        expected
      );
    });

    it("should not truncate when truncateQueryStrings is false", () => {
      const mockEntry = {
        domain: "example.com",
        requestQueryString: [
          {
            name: "very_long_parameter_name",
            value: "very_long_parameter_value",
          },
        ],
      };
      const expected =
        "note over example.com: [Query String]<br>very_long_parameter_name: very_long_parameter_value\n";
      expect(generateMermaidQueryString(mockEntry, true, false, 20)).toBe(
        expected
      );
    });

    it("should properly escape special characters", () => {
      const mockEntry = {
        domain: "example.com",
        requestQueryString: [
          {
            name: "param:with:colons",
            value: "value:with:colons",
          },
        ],
      };
      const expected =
        "note over example.com: [Query String]<br>param&#58;with&#58;colons: value&#58;with&#58;colons\n";
      expect(generateMermaidQueryString(mockEntry, true, false, 20)).toBe(
        expected
      );
    });

    it("should not generate query string when addRequestQueryString is false", () => {
      const mockEntry = {
        domain: "example.com",
        requestQueryString: [
          {
            name: "param",
            value: "value",
          },
        ],
      };
      expect(generateMermaidQueryString(mockEntry, false, true, 20)).toBe("");
    });

    it("should handle multiple parameters including font settings", () => {
      const mockEntry = {
        domain: "example.com",
        requestQueryString: [
          { name: "family", value: "Roboto:wght@400;700" },
          { name: "display", value: "swap" },
          { name: "regular", value: "normal_value" },
        ],
      };
      // 期待値を[Complex Value]に更新
      const expected =
        "note over example.com: [Query String]<br>family: [Complex Value]<br>display: swap<br>regular: normal_value\n";
      expect(generateMermaidQueryString(mockEntry, true, false, 20)).toBe(
        expected
      );
    });
  });

  describe("generateMermaidPostData", () => {
    it("should handle missing requestPostData", () => {
      const mockEntry = { domain: "example.com" };
      expect(generateMermaidPostData(mockEntry, true, true, 20)).toBe("");
    });

    it("should handle empty params array", () => {
      const mockEntry = {
        domain: "example.com",
        requestPostData: {
          mimeType: "application/json",
          params: [],
        },
      };
      const result = generateMermaidPostData(mockEntry, true, true, 20);
      expect(result).toContain("[postData] application/json");
    });

    it("should handle null mimeType", () => {
      const mockEntry = {
        domain: "example.com",
        requestPostData: {
          params: [{ name: "test", value: "value" }],
        },
      };
      const result = generateMermaidPostData(mockEntry, true, true, 20);
      expect(result).toContain("[postData]");
      expect(result).toContain("test: value");
    });
  });

  describe("generateMermaidResponse", () => {
    it("should handle edge case status codes", () => {
      const testCases = [
        { status: 99, expected: "->> Browser" }, // Below 100
        { status: 600, expected: "->> Browser" }, // Above 599
        { status: 300, expected: "-->> Browser" }, // Exact redirect start
        { status: 399, expected: "-->> Browser" }, // Exact redirect end
        { status: 400, expected: "--x Browser" }, // Exact error start
        { status: 599, expected: "--x Browser" }, // Exact error end
      ];

      testCases.forEach(({ status, expected }) => {
        const mockEntry = {
          domain: "example.com",
          status,
          responseMimeType: "text/plain",
        };
        const result = generateMermaidResponse(mockEntry, false);
        expect(result).toContain(expected);
      });
    });
  });
});

// PlantUML記法のテスト
describe("PlantUML Sequence Diagram Generator", () => {
  describe("generatePlantUMLHeaderAndTitle", () => {
    it("should generate basic header", () => {
      const expected = "@startuml\n";
      expect(generatePlantUMLHeaderAndTitle(false, "", false)).toBe(expected);
    });

    it("should include title when specified", () => {
      const expected = "@startuml\ntitle Test Title\n";
      expect(generatePlantUMLHeaderAndTitle(true, "Test Title", false)).toBe(
        expected
      );
    });

    it("should include autonumber when specified", () => {
      const expected = "@startuml\nautonumber\n";
      expect(generatePlantUMLHeaderAndTitle(false, "", true)).toBe(expected);
    });

    it("should include both title and autonumber when specified", () => {
      const expected = "@startuml\ntitle Test Title\nautonumber\n";
      expect(generatePlantUMLHeaderAndTitle(true, "Test Title", true)).toBe(
        expected
      );
    });
  });

  describe("generatePlantUMLQueryString", () => {
    it("should handle query parameters with null or undefined values", () => {
      const mockEntry = {
        domain: "example.com",
        requestQueryString: [
          { name: "nullParam", value: null },
          { name: "undefinedParam", value: undefined },
          { name: "emptyParam", value: "" },
        ],
      };
      const expected =
        'note over "example.com": **[Query String]**\\nnullParam: \\nundefinedParam: \\nemptyParam: \n';
      expect(generatePlantUMLQueryString(mockEntry, true, true, 20)).toBe(
        expected
      );
    });

    it("should handle query parameters with non-string values", () => {
      const mockEntry = {
        domain: "example.com",
        requestQueryString: [
          { name: "numberParam", value: 123 },
          { name: "booleanParam", value: true },
          { name: "objectParam", value: { key: "value" } },
        ],
      };
      const expected =
        'note over "example.com": **[Query String]**\\nnumberParam: 123\\nbooleanParam: true\\nobjectParam: [object Object]\n';
      expect(generatePlantUMLQueryString(mockEntry, true, true, 20)).toBe(
        expected
      );
    });

    it("should handle missing name or value in query parameters", () => {
      const mockEntry = {
        domain: "example.com",
        requestQueryString: [
          { value: "only value" },
          { name: "only name" },
          { name: null, value: "value" },
          { name: "name", value: null },
        ],
      };
      const expected =
        'note over "example.com": **[Query String]**\\n: only value\\nonly name: \\n: value\\nname: \n';
      expect(generatePlantUMLQueryString(mockEntry, true, true, 20)).toBe(
        expected
      );
    });

    // 既存のテストケース
    it("should handle entry without requestQueryString property", () => {
      const mockEntry = { domain: "example.com" };
      expect(generatePlantUMLQueryString(mockEntry, true, true, 20)).toBe("");
    });

    it("should handle entry with null requestQueryString", () => {
      const mockEntry = {
        domain: "example.com",
        requestQueryString: null,
      };
      expect(generatePlantUMLQueryString(mockEntry, true, true, 20)).toBe("");
    });

    it("should handle empty requestQueryString array", () => {
      const mockEntry = {
        domain: "example.com",
        requestQueryString: [],
      };
      expect(generatePlantUMLQueryString(mockEntry, true, true, 20)).toBe("");
    });

    it("should format basic query string correctly", () => {
      const mockEntry = {
        domain: "example.com",
        requestQueryString: [
          {
            name: "param",
            value: "value",
          },
        ],
      };
      const expected =
        'note over "example.com": **[Query String]**\\nparam: value\n';
      expect(generatePlantUMLQueryString(mockEntry, true, true, 20)).toBe(
        expected
      );
    });

    it("should properly escape special characters", () => {
      const mockEntry = {
        domain: "example.com",
        requestQueryString: [
          {
            name: "param:with:colons",
            value: "value\nwith\nnewlines",
          },
        ],
      };
      const expected =
        'note over "example.com": **[Query String]**\\nparam&#58;with&#58;colons&#58; value\\nwith\\nnewlines\n';
      expect(generatePlantUMLQueryString(mockEntry, true, false, 20)).toBe(
        expected
      );
    });
  });

  describe("generatePlantUMLResponse", () => {
    it("should generate success response", () => {
      const mockEntry = {
        domain: "example.com",
        status: 200,
        responseMimeType: "application/json",
      };
      const expected = '"example.com" -> Browser: 200 - application/json\n';
      expect(generatePlantUMLResponse(mockEntry, false)).toBe(expected);
    });

    it("should generate redirect response", () => {
      const mockEntry = {
        domain: "example.com",
        status: 302,
        responseMimeType: "text/plain",
      };
      const expected = '"example.com" --> Browser: 302 - text/plain\n';
      expect(generatePlantUMLResponse(mockEntry, false)).toBe(expected);
    });

    it("should generate error response", () => {
      const mockEntry = {
        domain: "example.com",
        status: 500,
        responseMimeType: "text/html",
      };
      const expected = '"example.com" --> Browser !!: 500 - text/html\n';
      expect(generatePlantUMLResponse(mockEntry, false)).toBe(expected);
    });

    it("should include deactivation when lifeline is enabled", () => {
      const mockEntry = {
        domain: "example.com",
        status: 200,
        responseMimeType: "application/json",
      };
      const expected =
        '"example.com" -> Browser: 200 - application/json\ndeactivate "example.com"\n';
      expect(generatePlantUMLResponse(mockEntry, true)).toBe(expected);
    });
  });

  describe("generatePlantUMLRequestCookies", () => {
    it("should handle empty cookies array", () => {
      const mockEntry = {
        domain: "example.com",
        requestCookies: [],
      };
      expect(generatePlantUMLRequestCookies(mockEntry, true, true, 20)).toBe(
        ""
      );
    });

    it("should format cookies with note syntax", () => {
      const mockEntry = {
        domain: "example.com",
        requestCookies: [
          {
            name: "cookieName",
            value: "cookieValue",
          },
        ],
      };
      const expected =
        'note over "example.com": **[Request Cookies]**\\ncookieName: cookieValue\n';
      expect(generatePlantUMLRequestCookies(mockEntry, true, true, 20)).toBe(
        expected
      );
    });

    it("should properly escape special characters in cookies", () => {
      const mockEntry = {
        domain: "example.com",
        requestCookies: [
          {
            name: "cookie:name",
            value: "cookie\nvalue",
          },
        ],
      };
      //   const expected = 'note over "example.com": **[Request Cookies]**\\ncookie&#58;name: cookie\\nvalue\n';
      const expected =
        'note over "example.com": **[Request Cookies]**\\ncookie&#58;name&#58; cookie\\nvalue\n';
      expect(generatePlantUMLRequestCookies(mockEntry, true, false, 20)).toBe(
        expected
      );
    });
  });

  describe("generatePlantUMLPostData", () => {
    it("should handle missing requestPostData", () => {
      const mockEntry = { domain: "example.com" };
      expect(generatePlantUMLPostData(mockEntry, true, true, 20)).toBe("");
    });

    it("should handle text post data", () => {
      const mockEntry = {
        domain: "example.com",
        requestPostData: {
          mimeType: "text/plain",
          text: "plain text content",
        },
      };
      const expected =
        'note over "example.com": **[postData]** text/plain\\nplain text content\n';
      expect(generatePlantUMLPostData(mockEntry, true, false, 20)).toBe(
        expected
      );
    });

    it("should handle JSON post data with parameters", () => {
      const mockEntry = {
        domain: "example.com",
        requestPostData: {
          mimeType: "application/json",
          params: [
            { name: "key1", value: "value1" },
            { name: "key2", value: "value2" },
          ],
        },
      };
      const expected =
        'note over "example.com": **[postData]** application/json\\nkey1: value1\\nkey2: value2\n';
      expect(generatePlantUMLPostData(mockEntry, true, true, 20)).toBe(
        expected
      );
    });
  });

  describe("generatePlantUMLResponseCookies", () => {
    it("should handle empty response cookies", () => {
      const mockEntry = {
        responseCookies: [],
      };
      expect(generatePlantUMLResponseCookies(mockEntry, true, true, 20)).toBe(
        ""
      );
    });

    it("should format response cookies with note syntax", () => {
      const mockEntry = {
        responseCookies: [
          {
            name: "sessionId",
            value: "12345",
          },
        ],
      };
      const expected =
        "note over Browser: **[Response Cookies]**\\nsessionId: 12345\n";
      expect(generatePlantUMLResponseCookies(mockEntry, true, true, 20)).toBe(
        expected
      );
    });

    it("should handle multiple response cookies", () => {
      const mockEntry = {
        responseCookies: [
          { name: "cookie1", value: "value1" },
          { name: "cookie2", value: "value2" },
        ],
      };
      const expected =
        "note over Browser: **[Response Cookies]**\\ncookie1: value1\\ncookie2: value2\n";
      expect(generatePlantUMLResponseCookies(mockEntry, true, true, 20)).toBe(
        expected
      );
    });
  });
});
