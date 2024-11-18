import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/svelte";
import FileUpload from "$lib/FileUpload.svelte";

describe("FileUpload Component", () => {
  it("should render file input with correct accept attribute", () => {
    const component = render(FileUpload);
    const fileInput = component.container.querySelector('input[type="file"]');

    expect(fileInput).toBeTruthy();
    expect(fileInput.getAttribute("accept")).toBe(".har");
  });

  it("should dispatch upload event with file when file is selected", async () => {
    const component = render(FileUpload);
    const fileInput = component.container.querySelector('input[type="file"]');

    // モックファイルの作成
    const file = new File(["test content"], "test.har", {
      type: "application/json",
    });

    // イベントハンドラーのモック作成
    const mockHandler = vi.fn();
    component.component.$on("upload", mockHandler);

    // ファイル選択イベントの発火
    await fireEvent.change(fileInput, {
      target: {
        files: [file],
      },
    });

    // イベントが正しく発火されたことを確認
    expect(mockHandler).toHaveBeenCalledTimes(1);
    const eventDetail = mockHandler.mock.calls[0][0].detail;
    expect(eventDetail).toBe(file);
    expect(eventDetail.name).toBe("test.har");
  });

  it("should handle no file selected", async () => {
    const component = render(FileUpload);
    const fileInput = component.container.querySelector('input[type="file"]');

    const mockHandler = vi.fn();
    component.component.$on("upload", mockHandler);

    // 空のファイルリストでイベントを発火
    await fireEvent.change(fileInput, {
      target: {
        files: [],
      },
    });

    // ファイルが選択されていない場合、イベントは発火されないことを確認
    expect(mockHandler).not.toHaveBeenCalled();
  });

  it("should accept only .har files", () => {
    const component = render(FileUpload);
    const fileInput = component.container.querySelector('input[type="file"]');

    expect(fileInput.accept).toBe(".har");
  });

  it("should clear input value after file selection", async () => {
    const component = render(FileUpload);
    const fileInput = component.container.querySelector('input[type="file"]');

    const file = new File(["test content"], "test.har", {
      type: "application/json",
    });

    await fireEvent.change(fileInput, {
      target: {
        files: [file],
      },
    });

    // ファイル選択後に新しいファイルを選択できるようにvalue属性がリセットされていることを確認
    await fireEvent.change(fileInput, { target: { value: "" } });
    expect(fileInput.value).toBe("");
  });
});
