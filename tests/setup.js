import { vi } from "vitest";
import mermaid from "mermaid";

// Mermaidのモック化
vi.mock("mermaid", () => ({
  default: {
    initialize: vi.fn(),
    parse: vi.fn().mockResolvedValue(true),
    render: vi.fn().mockResolvedValue({ svg: "<svg>Mocked SVG</svg>" }),
  },
}));

// グローバルなMermaid設定のモック
global.mermaid = mermaid;
