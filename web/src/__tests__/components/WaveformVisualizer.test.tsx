import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { WaveformVisualizer } from "@/components/agents/WaveformVisualizer";

// Mock canvas context
const mockCtx = {
  clearRect: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  stroke: vi.fn(),
  strokeStyle: "",
  lineWidth: 0,
  lineJoin: "",
  lineCap: "",
  globalAlpha: 1,
};

HTMLCanvasElement.prototype.getContext = vi.fn(() => mockCtx) as unknown as typeof HTMLCanvasElement.prototype.getContext;

// Mock requestAnimationFrame
vi.stubGlobal("requestAnimationFrame", vi.fn((_cb: FrameRequestCallback) => {
  // Don't actually run the animation loop in tests
  return 1;
}));
vi.stubGlobal("cancelAnimationFrame", vi.fn());

describe("WaveformVisualizer", () => {
  it("renders a canvas element", () => {
    render(<WaveformVisualizer analyser={null} />);
    const canvas = screen.getByLabelText("Audio waveform");
    expect(canvas).toBeInTheDocument();
    expect(canvas.tagName).toBe("CANVAS");
  });

  it("renders with custom label", () => {
    render(<WaveformVisualizer analyser={null} label="You" />);
    expect(screen.getByText("You")).toBeInTheDocument();
    expect(
      screen.getByLabelText("You audio waveform")
    ).toBeInTheDocument();
  });

  it("applies active styling when active", () => {
    const { container } = render(
      <WaveformVisualizer analyser={null} active={true} />
    );
    const wrapper = container.querySelector(".border-theme-primary\\/30");
    expect(wrapper).toBeInTheDocument();
  });

  it("applies inactive styling when not active", () => {
    const { container } = render(
      <WaveformVisualizer analyser={null} active={false} />
    );
    const wrapper = container.querySelector(".border-zinc-800");
    expect(wrapper).toBeInTheDocument();
  });

  it("accepts custom dimensions", () => {
    render(
      <WaveformVisualizer analyser={null} width={400} height={100} />
    );
    const canvas = screen.getByLabelText("Audio waveform");
    expect(canvas).toHaveAttribute("width", "400");
    expect(canvas).toHaveAttribute("height", "100");
  });
});
