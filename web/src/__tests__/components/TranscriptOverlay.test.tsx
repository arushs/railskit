import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  TranscriptOverlay,
  type TranscriptEntry,
} from "@/components/agents/TranscriptOverlay";

const mockEntries: TranscriptEntry[] = [
  {
    id: "1",
    role: "user",
    text: "Hello, can you help me?",
    isFinal: true,
    timestamp: Date.now(),
  },
  {
    id: "2",
    role: "agent",
    text: "Of course! How can I assist you today?",
    isFinal: true,
    timestamp: Date.now(),
  },
  {
    id: "3",
    role: "user",
    text: "I need to check my order...",
    isFinal: false,
    timestamp: Date.now(),
  },
];

describe("TranscriptOverlay", () => {
  it("renders nothing when no entries", () => {
    const { container } = render(<TranscriptOverlay entries={[]} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders nothing when not visible", () => {
    const { container } = render(
      <TranscriptOverlay entries={mockEntries} visible={false} />
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders transcript entries", () => {
    render(<TranscriptOverlay entries={mockEntries} />);

    expect(screen.getByText("Live Transcript")).toBeInTheDocument();
    expect(
      screen.getByText("Hello, can you help me?")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Of course! How can I assist you today?")
    ).toBeInTheDocument();
    expect(
      screen.getByText("I need to check my order...")
    ).toBeInTheDocument();
  });

  it("has accessible log role", () => {
    render(<TranscriptOverlay entries={mockEntries} />);
    expect(
      screen.getByRole("log", {
        name: /voice conversation transcript/i,
      })
    ).toBeInTheDocument();
  });

  it("shows role labels (You / Agent)", () => {
    render(<TranscriptOverlay entries={mockEntries} />);
    const youLabels = screen.getAllByText("You");
    const agentLabels = screen.getAllByText("Agent");
    expect(youLabels).toHaveLength(2); // 2 user entries
    expect(agentLabels).toHaveLength(1);
  });

  it("applies italic style to non-final entries", () => {
    render(<TranscriptOverlay entries={mockEntries} />);
    const nonFinalEntry = screen
      .getByText("I need to check my order...")
      .closest("div[class]");
    expect(nonFinalEntry?.className).toContain("italic");
  });
});
