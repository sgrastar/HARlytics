import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, fireEvent, screen } from "@testing-library/svelte";
import "@testing-library/jest-dom";
import CookieTable from "$lib/CookieTable.svelte";
import * as utils from "$lib/utils";

// utilsのモック
vi.mock("$lib/utils", () => ({
  formatTimestamp: vi.fn((date) => "2024-01-01 00:00:00.000"),
  filterCookieChanges: vi.fn((changes, filters) => changes),
  truncateText: vi.fn((text) =>
    text.length > 40 ? text.substring(0, 40) + "..." : text
  ),
}));

describe("CookieTable", () => {
  const mockCookieChanges = [
    {
      timestamp: new Date("2024-01-01T00:00:00Z"),
      url: "https://example.com/page1",
      cookies: [
        { name: "session", value: "abc123" },
        { name: "theme", value: "dark" },
      ],
      requestCookies: [
        { name: "session", value: "abc123" },
        { name: "theme", value: "dark" },
      ],
      responseCookies: [{ name: "session", value: "def456" }],
      path: "/page1",
      domain: "example.com",
      type: "Doc",
      status: 200,
      method: "GET",
    },
    {
      timestamp: new Date("2024-01-01T00:01:00Z"),
      url: "https://example.com/page2",
      cookies: [
        { name: "session", value: "def456" },
        { name: "language", value: "en" },
      ],
      requestCookies: [{ name: "session", value: "def456" }],
      responseCookies: [{ name: "language", value: "en" }],
      path: "/page2",
      domain: "example.com",
      type: "Doc",
      status: 200,
      method: "GET",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders empty state when no data is provided", () => {
    const { getByText } = render(CookieTable, { cookieChanges: [] });
    expect(getByText("No data to display.")).toBeInTheDocument();
  });

  it("renders table with correct headers and data", () => {
    const { getByText, getAllByRole } = render(CookieTable, {
      props: { cookieChanges: mockCookieChanges },
    });

    // ヘッダーの確認
    expect(getByText("Timestamp")).toBeInTheDocument();
    expect(getByText("URL")).toBeInTheDocument();
    expect(getByText("session")).toBeInTheDocument();
    expect(getByText("theme")).toBeInTheDocument();
    expect(getByText("language")).toBeInTheDocument();

    // データ行の確認
    const rows = getAllByRole("row");
    // ヘッダー1行 + データ2行
    expect(rows).toHaveLength(3);
  });

  it("handles URL filter input correctly", async () => {
    const { getByLabelText } = render(CookieTable, {
      props: { cookieChanges: mockCookieChanges },
    });

    const urlFilter = getByLabelText("Filter by URL (separate by |):");
    await fireEvent.input(urlFilter, { target: { value: "example.com" } });

    expect(utils.filterCookieChanges).toHaveBeenCalled();
  });

  it("handles URL exclusion filter input correctly", async () => {
    const { getByLabelText } = render(CookieTable, {
      props: { cookieChanges: mockCookieChanges },
    });

    const notUrlFilter = getByLabelText(
      "Exclude URLs containing (separate by |):"
    );
    await fireEvent.input(notUrlFilter, { target: { value: "page2" } });

    expect(utils.filterCookieChanges).toHaveBeenCalled();
  });

  it("displays cookie values correctly", () => {
    const { getByText } = render(CookieTable, {
      props: { cookieChanges: mockCookieChanges },
    });

    // Cookie値の確認
    expect(getByText("abc123")).toBeInTheDocument();
    expect(getByText("dark")).toBeInTheDocument();
    expect(getByText("def456")).toBeInTheDocument();
    expect(getByText("en")).toBeInTheDocument();
  });

  it("handles cookie selection correctly", async () => {
    const { getAllByRole } = render(CookieTable, {
      props: { cookieChanges: mockCookieChanges },
    });

    const checkboxes = getAllByRole("checkbox");
    await fireEvent.click(checkboxes[0]);

    expect(utils.filterCookieChanges).toHaveBeenCalled();
  });

  it("truncates long text correctly", () => {
    const longUrl =
      "https://example.com/very/long/path/that/needs/to/be/truncated";
    const mockData = [
      {
        ...mockCookieChanges[0],
        url: longUrl,
      },
    ];

    const { getByText } = render(CookieTable, {
      props: { cookieChanges: mockData },
    });

    expect(getByText(utils.truncateText(longUrl))).toBeInTheDocument();
  });

  it("handles empty cookie values correctly", () => {
    const mockDataWithEmptyCookies = [
      {
        ...mockCookieChanges[0],
        requestCookies: [],
        responseCookies: [],
        cookies: [],
      },
    ];

    const { queryByText } = render(CookieTable, {
      props: { cookieChanges: mockDataWithEmptyCookies },
    });

    // 空のCookie値の確認
    const sessionValue = queryByText("abc123");
    const themeValue = queryByText("dark");

    expect(sessionValue).toBeNull();
    expect(themeValue).toBeNull();
  });

  it("formats timestamp correctly", () => {
    const { getAllByRole } = render(CookieTable, {
      props: { cookieChanges: mockCookieChanges },
    });

    expect(utils.formatTimestamp).toHaveBeenCalled();
    const rows = getAllByRole("row");
    expect(rows[1]).toHaveTextContent("2024-01-01 00:00:00.000");
  });
});
