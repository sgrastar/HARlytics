import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, fireEvent } from "@testing-library/svelte";
import EntryRow from "$lib/EntryRow_general.svelte";
import { tick } from "svelte";

const mockEntry = {
  path: "/api/test",
  domain: "example.com",
  url: "https://example.com/api/test",
  method: "GET",
  status: 200,
  type: "Fetch/XHR",
  responseMimeType: "application/json",
  timestamp: "2024-01-01 12:00:00",
  startedDateTime: "2024-01-01T12:00:00Z",
  time: 1500,
  responseContentLength: 1024,
  requestHeaderAll: [{ name: "Accept", value: "application/json" }],
  responseHeaderAll: [{ name: "Content-Type", value: "application/json" }],
  requestQueryString: [],
  responseCookies: [],
  requestCookies: [],
  timings: {
    blocked: 100,
    dns: 200,
    connect: 300,
    ssl: 400,
    send: 100,
    wait: 200,
    receive: 200,
  },
  hasHeaderAuthData: false,
};

const createMockProps = () => ({
  entry: mockEntry,
  entries: [mockEntry],
  isIndented: false,
  hasPageInfo: false,
  selectedEntryIndexes: new Set(),
  isPathTruncated: true,
  isDomainTruncated: true,
  toggleEntryDetails: vi.fn(),
  handleKeyDown: vi.fn(),
  selectedTabs: new Map(),
  selectTab: vi.fn(),
  normalizeHeaders: vi.fn((headers) => headers),
  normalizePostData: vi.fn(),
  httpStatusCSSClass: vi.fn((status) =>
    status >= 200 && status < 300 ? "success" : "error"
  ),
  formatTime: vi.fn((time) => `${time} ms`),
  formatBytes: vi.fn((bytes) => `${bytes} B`),
  truncateText: vi.fn((text, length) =>
    text.length > length ? text.substring(0, length) + "..." : text
  ),
  formatGMTtoUTC: vi.fn(),
  formatToLocalTime: vi.fn(),
  calculateBarWidth: vi.fn(),
  calculateBarLeft: vi.fn(),
});

describe("EntryRow", () => {
  let mockProps;

  beforeEach(() => {
    mockProps = createMockProps();
    vi.clearAllMocks();
  });

  it("renders basic entry information", () => {
    const { getByText } = render(EntryRow, { props: mockProps });

    expect(getByText("example.com")).toBeTruthy();
    expect(getByText("GET")).toBeTruthy();
    expect(getByText("200")).toBeTruthy();
    expect(getByText("Fetch/XHR")).toBeTruthy();
  });

  it("applies correct status CSS class", () => {
    const { container } = render(EntryRow, { props: mockProps });
    const statusCell = container.querySelector(".status");
    expect(statusCell.classList.contains("success")).toBe(true);
  });

  it("truncates path and domain when specified", async () => {
    const longPathEntry = {
      ...mockEntry,
      path: "/very/long/path/that/should/be/truncated",
      domain: "very.long.domain.example.com",
    };

    render(EntryRow, {
      props: {
        ...mockProps,
        entry: longPathEntry,
      },
    });

    // tick()を使用してコンポーネントの更新を待つ
    await tick();
    expect(mockProps.truncateText).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Number)
    );
  });

  it("toggles details when clicked", async () => {
    const { container } = render(EntryRow, { props: mockProps });
    const row = container.querySelector(".table-row");

    await fireEvent.click(row);
    expect(mockProps.toggleEntryDetails).toHaveBeenCalledWith(mockEntry);
  });

  it("handles keyboard interaction", async () => {
    const { container } = render(EntryRow, { props: mockProps });
    const row = container.querySelector(".table-row");

    await fireEvent.keyDown(row, { key: "Enter" });
    expect(mockProps.handleKeyDown).toHaveBeenCalled();
  });

  it("shows detail tabs when entry is selected", async () => {
    const entryId =
      "no-page|https://example.com/api/test|2024-01-01 12:00:00|2024-01-01T12:00:00Z";
    const { container } = render(EntryRow, {
      props: {
        ...mockProps,
        selectedEntryIndexes: new Set([entryId]),
      },
    });

    // tabクラスを持つ要素の存在を確認
    const tabs = container.querySelector(".tab-list");
    expect(tabs).toBeTruthy();
  });

  it("displays headers when Headers tab is selected", async () => {
    const entryId =
      "no-page|https://example.com/api/test|2024-01-01 12:00:00|2024-01-01T12:00:00Z";
    const { container } = render(EntryRow, {
      props: {
        ...mockProps,
        selectedEntryIndexes: new Set([entryId]),
        selectedTabs: new Map([[entryId, "Headers"]]),
      },
    });

    // ヘッダーセクションの存在を確認
    const headerSection = container.querySelector(".header-sections-wrapper");
    expect(headerSection).toBeTruthy();
  });

  it("shows appropriate icons for request features", () => {
    const entryWithFeatures = {
      ...mockEntry,
      hasHeaderAuthData: true,
      requestPostData: { text: "test" },
      requestQueryString: [{ name: "test", value: "value" }],
      responseCookies: [{ name: "cookie", value: "test" }],
    };

    const { container } = render(EntryRow, {
      props: {
        ...mockProps,
        entry: entryWithFeatures,
      },
    });

    const icons = container.querySelectorAll(".sign table td span");
    expect(icons.length).toBeGreaterThan(0);
  });

  it("displays waterfall timing visualization", () => {
    const { container } = render(EntryRow, { props: mockProps });
    expect(container.querySelector(".waterfall")).toBeTruthy();
  });
});

describe("EntryRow with page information", () => {
  let mockProps;

  beforeEach(() => {
    mockProps = createMockProps();
  });

  it("applies correct indentation when has page info", () => {
    const { container } = render(EntryRow, {
      props: {
        ...mockProps,
        hasPageInfo: true,
      },
    });

    const row = container.querySelector(".table-row");
    expect(row.classList.contains("indent")).toBe(true);
  });
});

describe("EntryRow advanced functionality", () => {
  let mockProps;

  beforeEach(() => {
    mockProps = createMockProps();
  });

  it("handles entries with auth headers", () => {
    const entryWithAuth = {
      ...mockEntry,
      hasHeaderAuthData: true,
      requestHeaderAll: [{ name: "Authorization", value: "Bearer token" }],
    };

    const { container } = render(EntryRow, {
      props: {
        ...mockProps,
        entry: entryWithAuth,
      },
    });

    const authIcon = container.querySelector(".auth span");
    expect(authIcon).toBeTruthy();
    expect(authIcon.title).toBe("Authorization Header");
  });

  it("displays multiple indicator icons correctly", () => {
    const entryWithMultipleIndicators = {
      ...mockEntry,
      hasHeaderAuthData: true,
      requestPostData: { text: "test data" },
      requestQueryString: [{ name: "test", value: "value" }],
      responseCookies: [{ name: "cookie", value: "test" }],
    };

    const { container } = render(EntryRow, {
      props: {
        ...mockProps,
        entry: entryWithMultipleIndicators,
      },
    });

    expect(container.querySelector(".auth span")).toBeTruthy();
    expect(container.querySelector(".postData span")).toBeTruthy();
    expect(container.querySelector(".queryParameter span")).toBeTruthy();
    expect(container.querySelector(".cookies span")).toBeTruthy();
  });

  it("formats different types of timestamps correctly", () => {
    const { getByText } = render(EntryRow, {
      props: {
        ...mockProps,
        entry: {
          ...mockEntry,
          timestamp: "2024-01-01 12:00:00.123",
        },
      },
    });

    expect(getByText("2024-01-01 12:00:00.123")).toBeTruthy();
  });

  it("handles long URLs in tooltip display", () => {
    const longUrlEntry = {
      ...mockEntry,
      url: "https://example.com/very/long/path/that/needs/to/be/truncated/but/should/be/fully/visible/in/tooltip",
    };

    const { container } = render(EntryRow, {
      props: {
        ...mockProps,
        entry: longUrlEntry,
      },
    });

    const pathCell = container.querySelector(".path");
    expect(pathCell).toBeTruthy();
    expect(pathCell.textContent.length).toBeLessThan(longUrlEntry.url.length);
  });

  it("displays different HTTP methods with correct styling", () => {
    const methods = [
      "GET",
      "POST",
      "PUT",
      "DELETE",
      "PATCH",
      "OPTIONS",
      "HEAD",
    ];

    methods.forEach((method) => {
      const { container } = render(EntryRow, {
        props: {
          ...mockProps,
          entry: {
            ...mockEntry,
            method,
          },
        },
      });

      const methodCell = container.querySelector(`.method.${method}`);
      expect(methodCell).toBeTruthy();
      expect(methodCell.textContent).toBe(method);
    });
  });

  it("handles complex timing information display", () => {
    const entryWithTimings = {
      ...mockEntry,
      timings: {
        blocked: 100,
        dns: 200,
        connect: 300,
        ssl: 400,
        send: 500,
        wait: 600,
        receive: 700,
      },
    };

    const { container } = render(EntryRow, {
      props: {
        ...mockProps,
        entry: entryWithTimings,
      },
    });

    const timeCell = container.querySelector(".time");
    expect(timeCell).toBeTruthy();
    expect(timeCell.getAttribute("title")).toContain("ms");
  });

  describe("Tab management", () => {
    const getEntryId = (entry) => {
      return [
        entry.pageref || "no-page",
        entry.url,
        entry.timestamp,
        entry.startedDateTime,
      ].join("|");
    };

    it("shows Headers tab by default", async () => {
      const entryId = getEntryId(mockEntry);
      const { container } = render(EntryRow, {
        props: {
          ...mockProps,
          selectedEntryIndexes: new Set([entryId]),
          selectedTabs: new Map([[entryId, "Headers"]]),
        },
      });

      await tick();

      const activeTab = container.querySelector(".tab-button.active");
      expect(activeTab).toBeTruthy();
      expect(activeTab.textContent.trim()).toBe("Headers");
    });

    it("shows Payload tab when request data exists", async () => {
      const entryWithPayload = {
        ...mockEntry,
        requestPostData: { text: "test data" },
        requestQueryString: [{ name: "test", value: "value" }],
      };
      const entryId = getEntryId(entryWithPayload);

      const { container } = render(EntryRow, {
        props: {
          ...mockProps,
          entry: entryWithPayload,
          selectedEntryIndexes: new Set([entryId]),
          selectedTabs: new Map([[entryId, "Headers"]]),
        },
      });

      await tick();

      const payloadTab = container.querySelector(".tab-button:nth-child(2)");
      expect(payloadTab).toBeTruthy();
      expect(payloadTab.textContent.trim()).toBe("Payload");
    });

    it("handles tab clicks correctly", async () => {
      const entryId = getEntryId(mockEntry);
      const { container } = render(EntryRow, {
        props: {
          ...mockProps,
          selectedEntryIndexes: new Set([entryId]),
          selectedTabs: new Map([[entryId, "Headers"]]),
        },
      });

      await tick();

      const timingTab = container.querySelector(".tab-button:nth-child(2)"); // Timingタブ
      if (timingTab) {
        await fireEvent.click(timingTab);
        expect(mockProps.selectTab).toHaveBeenCalledWith(entryId, "Timing");
      }
    });

    it("shows correct number of cookies in tab label", async () => {
      const entryWithCookies = {
        ...mockEntry,
        responseCookies: [
          { name: "cookie1", value: "value1" },
          { name: "cookie2", value: "value2" },
        ],
      };
      const entryId = getEntryId(entryWithCookies);

      const { container } = render(EntryRow, {
        props: {
          ...mockProps,
          entry: entryWithCookies,
          selectedEntryIndexes: new Set([entryId]),
          selectedTabs: new Map([[entryId, "Headers"]]),
        },
      });

      await tick();

      const cookiesTab = Array.from(
        container.querySelectorAll(".tab-button")
      ).find((el) => el.textContent.includes("Cookies"));
      expect(cookiesTab).toBeTruthy();
      expect(cookiesTab.textContent).toContain("[2]");
    });

    it("renders different tab contents correctly", async () => {
      const entryId = getEntryId(mockEntry);
      const tabContents = {
        Headers: ".headers-container",
        Timing: ".timing-container",
        Cookies: ".cookies-container",
      };

      const { container, component } = render(EntryRow, {
        props: {
          ...mockProps,
          selectedEntryIndexes: new Set([entryId]),
          selectedTabs: new Map([[entryId, "Headers"]]),
        },
      });

      for (const [tabName, selector] of Object.entries(tabContents)) {
        await component.$set({
          selectedTabs: new Map([[entryId, tabName]]),
        });

        await tick();
        const content = container.querySelector(selector);
        expect(content).toBeTruthy();
      }
    });

    it("preserves tab selection when entry details are toggled", async () => {
      const entryId = getEntryId(mockEntry);
      const selectedTab = "Headers";

      const { container, component } = render(EntryRow, {
        props: {
          ...mockProps,
          selectedEntryIndexes: new Set([entryId]),
          selectedTabs: new Map([[entryId, selectedTab]]),
        },
      });

      await tick();

      // 詳細を非表示に
      await fireEvent.click(container.querySelector(".table-row"));
      expect(mockProps.toggleEntryDetails).toHaveBeenCalled();

      // 詳細を再表示
      const newSet = new Set([entryId]);
      await component.$set({
        selectedEntryIndexes: newSet,
        selectedTabs: new Map([[entryId, selectedTab]]),
      });

      await tick();

      const activeTab = container.querySelector(".tab-button.active");
      expect(activeTab).toBeTruthy();
      expect(activeTab.textContent.trim()).toBe(selectedTab);
    });
  });
});
