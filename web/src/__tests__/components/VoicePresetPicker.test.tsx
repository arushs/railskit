import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  VoicePresetPicker,
  type VoicePreset,
} from "@/components/agents/VoicePresetPicker";

const mockPresets: VoicePreset[] = [
  {
    id: "1",
    name: "Friendly Sarah",
    description: "Warm and approachable female voice",
    provider: "elevenlabs",
    voiceId: "sarah-1",
    characteristics: ["warm", "friendly", "professional"],
    sampleUrl: "https://example.com/sarah.mp3",
  },
  {
    id: "2",
    name: "Professional Alex",
    description: "Clear and authoritative male voice",
    provider: "elevenlabs",
    voiceId: "alex-1",
    characteristics: ["clear", "authoritative"],
  },
];

// Mock Audio
const mockAudio = {
  play: vi.fn(() => Promise.resolve()),
  pause: vi.fn(),
  src: "",
  currentTime: 0,
  onended: null as (() => void) | null,
  onerror: null as (() => void) | null,
};

vi.stubGlobal("Audio", vi.fn(() => mockAudio));

describe("VoicePresetPicker", () => {
  const onSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders voice presets", () => {
    render(
      <VoicePresetPicker
        presets={mockPresets}
        onSelect={onSelect}
      />
    );

    expect(screen.getByText("Select Voice")).toBeInTheDocument();
    expect(screen.getByText("Friendly Sarah")).toBeInTheDocument();
    expect(screen.getByText("Professional Alex")).toBeInTheDocument();
  });

  it("shows characteristics as tags", () => {
    render(
      <VoicePresetPicker
        presets={mockPresets}
        onSelect={onSelect}
      />
    );

    expect(screen.getByText("warm")).toBeInTheDocument();
    expect(screen.getByText("friendly")).toBeInTheDocument();
    expect(screen.getByText("authoritative")).toBeInTheDocument();
  });

  it("calls onSelect when a preset is clicked", async () => {
    const user = userEvent.setup();
    render(
      <VoicePresetPicker
        presets={mockPresets}
        onSelect={onSelect}
      />
    );

    await user.click(
      screen.getByLabelText("Select Friendly Sarah voice")
    );
    expect(onSelect).toHaveBeenCalledWith(mockPresets[0]);
  });

  it("shows Selected badge for selected preset", () => {
    render(
      <VoicePresetPicker
        presets={mockPresets}
        selectedId="1"
        onSelect={onSelect}
      />
    );

    expect(screen.getByText("Selected")).toBeInTheDocument();
  });

  it("shows Preview button only for presets with sampleUrl", () => {
    render(
      <VoicePresetPicker
        presets={mockPresets}
        onSelect={onSelect}
      />
    );

    const previewButtons = screen.getAllByText(/Preview/);
    expect(previewButtons).toHaveLength(1); // Only Sarah has sampleUrl
  });

  it("renders loading skeleton when isLoading", () => {
    const { container } = render(
      <VoicePresetPicker
        presets={[]}
        onSelect={onSelect}
        isLoading
      />
    );

    const skeletons = container.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("plays preview audio on Preview click", async () => {
    const user = userEvent.setup();
    render(
      <VoicePresetPicker
        presets={mockPresets}
        onSelect={onSelect}
      />
    );

    await user.click(screen.getByText("▶ Preview"));
    expect(mockAudio.play).toHaveBeenCalled();
  });
});
