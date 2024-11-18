import { render, fireEvent } from "@testing-library/svelte";
import { describe, it, expect, beforeEach, vi } from "vitest";
import SequenceExport from "$lib/components/SequenceExport.svelte";

describe("SequenceExport", () => {
  beforeEach(() => {
    // Mock SVG element
    const mockSvg = document.createElement("div");
    mockSvg.innerHTML = '<svg width="100" height="100"></svg>';
    document.body.appendChild(mockSvg);
    mockSvg.id = "graph";

    // Mock Canvas API
    global.HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
      fillRect: vi.fn(),
      drawImage: vi.fn(),
      fillStyle: "",
    }));

    global.HTMLCanvasElement.prototype.toBlob = vi.fn((callback) =>
      callback(new Blob(["test"], { type: "image/png" }))
    );

    // Mock clipboard API
    global.navigator.clipboard = {
      write: vi.fn().mockResolvedValue(undefined),
      writeText: vi.fn().mockResolvedValue(undefined),
    };

    // Mock URL API
    global.URL.createObjectURL = vi.fn(() => "blob:test");
    global.URL.revokeObjectURL = vi.fn();
    global.open = vi.fn();
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.clearAllMocks();
  });

  // 1. 基本的なレンダリングテスト
  it("renders all format options correctly", () => {
    const { getByLabelText } = render(SequenceExport);
    expect(getByLabelText("PNG")).toBeTruthy();
    expect(getByLabelText("SVG")).toBeTruthy();
  });

  // 2. ファイル名の初期化テスト
  it("initializes with correct filename", () => {
    const { container } = render(SequenceExport, {
      props: { logFilename: "test.har" },
    });
    const input = container.querySelector('input[type="text"]');
    expect(input.value).toBe("Sequence_test.har.png");
  });

  // 3. フォーマット切り替えテスト
  it("changes filename extension when format changes", async () => {
    const { container, getByLabelText } = render(SequenceExport, {
      props: { logFilename: "test.har" },
    });

    await fireEvent.click(getByLabelText("SVG"));
    const input = container.querySelector('input[type="text"]');
    expect(input.value).toBe("Sequence_test.har.svg");
  });

  // 4. サイズ入力の表示/非表示テスト
  it("shows/hides size input based on selection", async () => {
    const { container, getByLabelText } = render(SequenceExport);

    expect(container.querySelector('input[type="number"]')).toBeNull();

    await fireEvent.click(getByLabelText("Width"));
    expect(container.querySelector('input[type="number"]')).toBeTruthy();
  });

  // 5. 背景設定のテスト
  it("toggles background setting correctly", async () => {
    const { getByLabelText } = render(SequenceExport);

    // デフォルトでTransparentが選択されているか確認
    const transparentRadio = getByLabelText("Transparent");
    expect(transparentRadio.checked).toBe(true);

    // Whiteに切り替え
    const whiteRadio = getByLabelText("White");
    await fireEvent.click(whiteRadio);
    expect(whiteRadio.checked).toBe(true);
    expect(transparentRadio.checked).toBe(false);
  });

  // 6. PNGフォーマット時のみ背景設定が表示されることのテスト
  it("shows background options only for PNG format", async () => {
    const { getByLabelText, queryByLabelText } = render(SequenceExport);

    // Initially (PNG format), background options should be visible
    expect(queryByLabelText("Transparent")).toBeTruthy();
    expect(queryByLabelText("White")).toBeTruthy();

    // Switch to SVG format
    await fireEvent.click(getByLabelText("SVG"));

    // Background options should be hidden
    expect(queryByLabelText("Transparent")).toBeNull();
    expect(queryByLabelText("White")).toBeNull();
  });

  // 7. ファイル名入力のテスト
  it("allows filename modification", async () => {
    const { container } = render(SequenceExport);

    const input = container.querySelector('input[type="text"]');
    await fireEvent.input(input, { target: { value: "custom.png" } });
    expect(input.value).toBe("custom.png");
  });
});
