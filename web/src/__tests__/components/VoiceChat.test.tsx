import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { VoiceChat } from "@/components/agents/VoiceChat";

// Mock all hooks
const mockStartRecording = vi.fn();
const mockStopRecording = vi.fn();
vi.mock("@/hooks/useMediaRecorder", () => ({
  useMediaRecorder: vi.fn(() => ({
    isRecording: false,
    startRecording: mockStartRecording,
    stopRecording: mockStopRecording,
    stream: null,
    analyser: null,
  })),
}));

const mockConnect = vi.fn();
const mockDisconnect = vi.fn();
const mockSendAudio = vi.fn();
const mockSendVadEvent = vi.fn();
vi.mock("@/hooks/useAudioChannel", () => ({
  useAudioChannel: vi.fn(() => ({
    sendAudio: mockSendAudio,
    sendVadEvent: mockSendVadEvent,
    connectionState: "disconnected" as const,
    connect: mockConnect,
    disconnect: mockDisconnect,
  })),
}));

const mockEnqueue = vi.fn();
const mockInterrupt = vi.fn();
vi.mock("@/hooks/useAudioPlayback", () => ({
  useAudioPlayback: vi.fn(() => ({
    isPlaying: false,
    enqueue: mockEnqueue,
    interrupt: mockInterrupt,
    analyser: null,
  })),
}));

describe("VoiceChat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders with Connect button when not connected", () => {
    render(<VoiceChat chatId="chat-1" agentId="support" />);

    expect(screen.getByText("Voice Chat")).toBeInTheDocument();
    expect(screen.getByText("Connect")).toBeInTheDocument();
    expect(screen.getByLabelText("Connect voice")).toBeInTheDocument();
  });

  it("connects when Connect button is clicked", async () => {
    const user = userEvent.setup();
    render(<VoiceChat chatId="chat-1" agentId="support" />);

    await user.click(screen.getByText("Connect"));
    expect(mockConnect).toHaveBeenCalled();
  });

  it("has accessible region label", () => {
    render(<VoiceChat chatId="chat-1" agentId="support" />);
    expect(
      screen.getByRole("region", { name: /voice chat with support/i })
    ).toBeInTheDocument();
  });

  it("shows status indicator", () => {
    render(<VoiceChat chatId="chat-1" agentId="support" />);
    expect(screen.getByText("Ready")).toBeInTheDocument();
  });
});
