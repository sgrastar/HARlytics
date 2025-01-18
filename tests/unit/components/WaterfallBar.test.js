import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, fireEvent } from "@testing-library/svelte";
import WaterfallBar from "$lib/components/WaterfallBar.svelte";

describe("WaterfallBar", () => {
  const mockEntry = {
    startedDateTime: "2024-01-01T12:00:00Z",
    time: 1000,
    timings: {
      blocked: 100,
      dns: 200,
      connect: 300,
      ssl: 400,
      send: 100,
      wait: 200,
      receive: 200,
    },
  };

  const mockEntries = [
    mockEntry,
    {
      startedDateTime: "2024-01-01T12:00:01Z",
      time: 800,
      timings: {
        blocked: 50,
        dns: 100,
        connect: 150,
        ssl: 200,
        send: 50,
        wait: 150,
        receive: 100,
      },
    },
  ];

  const defaultProps = {
    entry: mockEntry,
    entries: mockEntries,
    hasPageInfo: false,
    formatTime: vi.fn((time) => `${time} ms`),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders timing bars for all phases", () => {
    const { container } = render(WaterfallBar, { props: defaultProps });

    // 各フェーズのバーが存在することを確認
    const bars = container.querySelectorAll(".absolute.h-full");
    expect(bars.length).toBe(7); // blocked, dns, connect, ssl, send, wait, receive
  });

  it("calculates correct bar widths", () => {
    const { container } = render(WaterfallBar, { props: defaultProps });

    const bars = container.querySelectorAll(".absolute.h-full");
    bars.forEach((bar) => {
      const width = parseFloat(bar.style.width);
      expect(width).toBeGreaterThan(0);
      expect(width).toBeLessThanOrEqual(100);
    });
  });

  it("handles zero timings correctly", () => {
    const entryWithZeroTimings = {
      ...mockEntry,
      timings: {
        blocked: 0,
        dns: 0,
        connect: 0,
        ssl: 0,
        send: 100,
        wait: 200,
        receive: 100,
      },
    };

    const { container } = render(WaterfallBar, {
      props: {
        ...defaultProps,
        entry: entryWithZeroTimings,
      },
    });

    // ゼロ以外のタイミングのバーのみが表示されることを確認
    const bars = container.querySelectorAll(".absolute.h-full");
    expect(bars.length).toBe(3); // send, wait, receive only
  });

  it("handles negative timings correctly", () => {
    const entryWithNegativeTimings = {
      ...mockEntry,
      timings: {
        blocked: -1,
        dns: -1,
        connect: -1,
        ssl: -1,
        send: 100,
        wait: 200,
        receive: 100,
      },
    };

    const { container } = render(WaterfallBar, {
      props: {
        ...defaultProps,
        entry: entryWithNegativeTimings,
      },
    });

    // 負の値のタイミングのバーが表示されないことを確認
    const bars = container.querySelectorAll(".absolute.h-full");
    expect(bars.length).toBe(3); // send, wait, receive only
  });

  describe("WaterfallBar mouse interactions", () => {
    it("updates tooltip position on mouse move", async () => {
      const { container } = render(WaterfallBar, {
        props: defaultProps,
      });

      const waterfallContainer = container.querySelector(
        ".waterfall-container"
      );
      const rect = { left: 50, right: 250 };
      vi.spyOn(waterfallContainer, "getBoundingClientRect").mockReturnValue(
        rect
      );

      await fireEvent.mouseMove(waterfallContainer, {
        clientX: 100,
        clientY: 50,
      });

      expect(waterfallContainer.style.getPropertyValue("--tooltip-x")).toBe(
        "50px"
      );
    });

    it("handles mouse move near container edges", async () => {
      const { container } = render(WaterfallBar, {
        props: defaultProps,
      });

      const waterfallContainer = container.querySelector(
        ".waterfall-container"
      );
      const rect = { left: 0, right: 200 };
      vi.spyOn(waterfallContainer, "getBoundingClientRect").mockReturnValue(
        rect
      );

      // Test near left edge
      await fireEvent.mouseMove(waterfallContainer, {
        clientX: 5,
        clientY: 50,
      });

      // Test near right edge
      await fireEvent.mouseMove(waterfallContainer, {
        clientX: 195,
        clientY: 50,
      });

      expect(
        waterfallContainer.style.getPropertyValue("--tooltip-x")
      ).toBeDefined();
    });

    it("handles multiple rapid mouse movements", async () => {
      const { container } = render(WaterfallBar, {
        props: defaultProps,
      });

      const waterfallContainer = container.querySelector(
        ".waterfall-container"
      );
      const rect = { left: 0, right: 200 };
      vi.spyOn(waterfallContainer, "getBoundingClientRect").mockReturnValue(
        rect
      );

      for (let i = 0; i < 5; i++) {
        await fireEvent.mouseMove(waterfallContainer, {
          clientX: 50 + i * 10,
          clientY: 50,
        });
      }

      expect(
        waterfallContainer.style.getPropertyValue("--tooltip-x")
      ).toBeDefined();
    });

    it("removes tooltip completely on mouse leave", async () => {
      const { container } = render(WaterfallBar, {
        props: defaultProps,
      });

      const waterfallContainer = container.querySelector(
        ".waterfall-container"
      );

      // Show tooltip first
      await fireEvent.mouseMove(waterfallContainer);
      expect(container.querySelector(".tooltip")).toBeTruthy();

      // Then hide it
      await fireEvent.mouseLeave(waterfallContainer);
      expect(container.querySelector(".tooltip")).toBeFalsy();
    });
  });

  it("shows tooltip on mouseover", async () => {
    const { container } = render(WaterfallBar, { props: defaultProps });

    // マウスオーバーイベントをトリガー
    await fireEvent.mouseMove(container.querySelector(".waterfall-container"));

    // ツールチップが表示されることを確認
    const tooltip = container.querySelector(".tooltip");
    expect(tooltip).toBeTruthy();

    // ツールチップの内容を確認
    expect(tooltip.textContent).toContain("DNS: 200 ms");
    expect(tooltip.textContent).toContain("Connect: 300 ms");
    expect(tooltip.textContent).toContain("Wait: 200 ms");
  });

  it("hides tooltip on mouseleave", async () => {
    const { container } = render(WaterfallBar, { props: defaultProps });

    // マウスオーバーしてからマウスリーブ
    await fireEvent.mouseMove(container.querySelector(".waterfall-container"));
    await fireEvent.mouseLeave(container.querySelector(".waterfall-container"));

    // ツールチップが非表示になることを確認
    const tooltip = container.querySelector(".tooltip");
    expect(tooltip).toBeFalsy();
  });

  it("handles page info correctly", () => {
    const { container } = render(WaterfallBar, {
      props: {
        ...defaultProps,
        hasPageInfo: true,
        entry: {
          ...mockEntry,
          pageref: "page1",
        },
      },
    });

    const bars = container.querySelectorAll(".absolute.h-full");
    expect(bars.length).toBe(7);
  });

  it("formats timing values correctly in tooltip", async () => {
    const { container } = render(WaterfallBar, { props: defaultProps });

    await fireEvent.mouseMove(container.querySelector(".waterfall-container"));

    // formatTimeが正しく呼ばれることを確認
    expect(defaultProps.formatTime).toHaveBeenCalledWith(200); // dns
    expect(defaultProps.formatTime).toHaveBeenCalledWith(300); // connect
    expect(defaultProps.formatTime).toHaveBeenCalledWith(200); // wait
  });

  it("calculates correct positions relative to page start time", () => {
    const pageEntries = [
      {
        ...mockEntry,
        startedDateTime: "2024-01-01T12:00:00Z",
        pageref: "page1",
      },
      {
        ...mockEntry,
        startedDateTime: "2024-01-01T12:00:01Z",
        pageref: "page1",
      },
    ];

    const { container } = render(WaterfallBar, {
      props: {
        ...defaultProps,
        hasPageInfo: true,
        entries: pageEntries,
        entry: pageEntries[1],
      },
    });

    const firstBar = container.querySelector(".absolute.h-full");
    const left = parseFloat(firstBar.style.left);
    expect(left).toBeGreaterThan(0); // 2番目のエントリなので左位置が0より大きい

    describe("Internal calculations", () => {
      let component;

      beforeEach(async () => {
        // コンポーネントをレンダリングし、内部関数にアクセスできるようにする
        const instance = render(WaterfallBar, {
          props: {
            entry: mockEntry,
            entries: mockEntries,
            hasPageInfo: false,
            formatTime: vi.fn((time) => `${time} ms`),
          },
        });

        // コンポーネントインスタンスを取得
        component = instance.component;
        await tick(); // Svelteの更新サイクルを待つ
      });

      describe("calculateBarWidth", () => {
        it("calculates correct percentage of timing relative to total time", async () => {
          // calculateBarWidth関数を直接呼び出す
          const calculateBarWidth =
            component.$$.ctx[component.$$.props["calculateBarWidth"]];

          // テストケースのdurationとtotalDurationを設定
          const result1 = calculateBarWidth(100);
          const result2 = calculateBarWidth(500);

          expect(Number(result1.toFixed(2))).toBe(10.0); // 100ms out of 1000ms = 10%
          expect(Number(result2.toFixed(2))).toBe(50.0); // 500ms out of 1000ms = 50%
        });

        it("handles zero timing", async () => {
          const calculateBarWidth =
            component.$$.ctx[component.$$.props["calculateBarWidth"]];
          const result = calculateBarWidth(0);
          expect(result).toBe(0);
        });

        it("limits maximum width to remaining space", async () => {
          const calculateBarWidth =
            component.$$.ctx[component.$$.props["calculateBarWidth"]];
          const result = calculateBarWidth(1500);
          expect(result).toBeLessThanOrEqual(100);
        });
      });

      describe("Bar positioning calculations", () => {
        it("calculates correct positions for timing phases", async () => {
          // バーの位置を計算する関数をテスト
          const { container } = render(WaterfallBar, {
            props: {
              entry: {
                startedDateTime: "2024-01-01T12:00:00Z",
                time: 3000,
                timings: {
                  blocked: 100,
                  dns: 200,
                  connect: 300,
                  ssl: 400,
                  send: 500,
                  wait: 600,
                  receive: 700,
                },
              },
              entries: [mockEntry],
              hasPageInfo: false,
              formatTime: vi.fn((time) => `${time} ms`),
            },
          });

          await tick();

          const bars = container.querySelectorAll(".absolute.h-full");
          const positions = Array.from(bars).map((bar) => ({
            left: parseFloat(bar.style.left),
            width: parseFloat(bar.style.width),
          }));

          // 各フェーズの位置が正しく計算されていることを確認
          positions.forEach((pos, index) => {
            expect(pos.left).toBeGreaterThanOrEqual(0);
            expect(pos.left).toBeLessThanOrEqual(100);
            expect(pos.width).toBeGreaterThan(0);
            expect(pos.width).toBeLessThanOrEqual(100);

            if (index > 0) {
              // 各バーが前のバーの後ろに配置されていることを確認
              expect(pos.left).toBeGreaterThanOrEqual(
                positions[index - 1].left
              );
            }
          });
        });

        it("handles negative timing values correctly", async () => {
          const { container } = render(WaterfallBar, {
            props: {
              entry: {
                startedDateTime: "2024-01-01T12:00:00Z",
                time: 3000,
                timings: {
                  blocked: -1,
                  dns: 200,
                  connect: 300,
                  ssl: 400,
                  send: 500,
                  wait: 600,
                  receive: 700,
                },
              },
              entries: [mockEntry],
              hasPageInfo: false,
              formatTime: vi.fn((time) => `${time} ms`),
            },
          });

          await tick();

          const bars = container.querySelectorAll(".absolute.h-full");
          const firstBar = bars[0];
          expect(firstBar.style.left).toBe("0%");
        });

        it("ensures positions do not exceed 100%", async () => {
          const { container } = render(WaterfallBar, {
            props: {
              entry: {
                startedDateTime: "2024-01-01T12:00:00Z",
                time: 1000,
                timings: {
                  blocked: 1000,
                  dns: 1000,
                  connect: 1000,
                  ssl: 1000,
                  send: 1000,
                  wait: 1000,
                  receive: 1000,
                },
              },
              entries: [mockEntry],
              hasPageInfo: false,
              formatTime: vi.fn((time) => `${time} ms`),
            },
          });

          await tick();

          const bars = container.querySelectorAll(".absolute.h-full");
          bars.forEach((bar) => {
            const left = parseFloat(bar.style.left);
            expect(left).toBeLessThanOrEqual(100);
          });
        });
      });

      describe("Total duration and base time calculations", () => {
        it("calculates correct base time for page entries", async () => {
          const pageEntries = [
            {
              startedDateTime: "2024-01-01T12:00:00Z",
              time: 1000,
              pageref: "page1",
              timings: { ...mockEntry.timings },
            },
            {
              startedDateTime: "2024-01-01T12:00:01Z",
              time: 1000,
              pageref: "page1",
              timings: { ...mockEntry.timings },
            },
          ];

          const { container } = render(WaterfallBar, {
            props: {
              entry: pageEntries[1],
              entries: pageEntries,
              hasPageInfo: true,
              formatTime: vi.fn((time) => `${time} ms`),
            },
          });

          await tick();

          // 2番目のエントリーのバーが適切な位置に表示されていることを確認
          const bars = container.querySelectorAll(".absolute.h-full");
          const firstBarLeft = parseFloat(bars[0].style.left);
          expect(firstBarLeft).toBeGreaterThan(0);
        });
      });
    });
  });
});
