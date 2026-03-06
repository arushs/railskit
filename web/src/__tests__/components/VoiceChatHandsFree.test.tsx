import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock @ricky0123/vad-web BEFORE importing the component
vi.mock("@ricky0123/vad-web", () => ({
  MicVAD: {
    new: vi.fn(() =>
      Promise.resolve({
        start: vi.fn(),
        pause: vi.fn(),
        destroy: vi.fn(),
      })
    ),
  },
}));

// Mock hooks
const mockConnect = vi.fn();
const mockDisconnect = vi.fn();
vi.mock("@/hooks/useAudioChannel", () => ({
  useAudioChannel: vi.fn(() => ({
    sendAudio: vi.fn(),
    sendVadEvent: vi.fn(),
    connectionState: "disconnected" as const,
    connect: mockConnect,
    disconnect: mockDisconnect,
  })),
}));

vi.mock("@/hooks/useAudioPlayback", () => ({
  useAudioPlayback: vi.fn(() => ({
    isPlaying: false,
    enqueue: vi.fn(),
    interrupt: vi.fn(),
    analyser: null,
  })),
}));

// Mock navigator.mediaDevices for analyser setup
Object.defineProperty(navigator, "mediaDevices", {
  value: {
    getUserMedia: vi.fn(() =>
      Promise.resolve({
        getTracks: () => [{ stop: vi.fn() }],
      })
    ),
  },
  writable: true,
});

vi.stubGlobal(
  "AudioContext",
  vi.fn(() => ({
    createMediaStreamSource: vi.fn(() => ({ connect: vi.fn() })),
    createAnalyser: vi.fn(() => ({
      fftSize: 0,
      frequencyBinCount: 128,
    })),
    destination: {},
  }))
);

// Import component AFTER mocks
import { VoiceChatHandsFree } from "@/components/agents/VoiceChatHandsFree";

describe("VoiceChatHandsFree", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders with Start button", () => {
    render(
      <VoiceChatHandsFree chatId="chat-1" agentId="support" />
    );

    expect(screen.getByText("Hands-Free Mode")).toBeInTheDocument();
    expect(screen.getByText("Start")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Start hands-free mode")
    ).toBeInTheDocument();
  });

  it("has accessible region label", () => {
    render(
      <VoiceChatHandsFree chatId="chat-1" agentId="support" />
    );
    expect(
      screen.getByRole("region", {
        name: /hands-free voice chat with support/i,
      })
    ).toBeInTheDocument();
  });

  it("shows inactive status by default", () => {
    render(
      <VoiceChatHandsFree chatId="chat-1" agentId="support" />
    );
    expect(screen.getByText("Inactive")).toBeInTheDocument();
  });

  it("connects when Start is clicked", async () => {
    const user = userEvent.setup();
    render(
      <VoiceChatHandsFree chatId="chat-1" agentId="support" />
    );

    await user.click(screen.getByText("Start"));
    expect(mockConnect).toHaveBeenCalled();
  });
});
